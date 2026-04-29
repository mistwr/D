-- ==========================================================
-- CRM SOLUÇÕES DIFERENTES - Database Schema
-- ==========================================================

-- 1. TABELA: USERS (Usuários/Parceiros e Admin)
-- Armazena informações de usuários com seus roles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'parceiro', -- 'admin' ou 'parceiro'
  telefone VARCHAR(20),
  empresa VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA: VENDAS (Vendas/Contratos)
-- Armazena informações de vendas registradas por parceiros
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cliente VARCHAR(255) NOT NULL,
  email_cliente VARCHAR(255) NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  moeda VARCHAR(3) DEFAULT 'EUR', -- EUR, USD, GBP, etc
  descricao TEXT,
  tipo_contrato VARCHAR(100) NOT NULL, -- Ex: "Serviço", "Produto", "Consultoria"
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendente', -- Pendente, Processado, Pago, Cancelado, Em Revisão, Rejeitado
  observacoes TEXT,
  data_venda DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA: DOCUMENTOS (Ficheiros PDF/Excel associados a vendas)
-- Armazena referências aos documentos armazenados em Vercel Blob
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  url_arquivo VARCHAR(500) NOT NULL, -- URL do Vercel Blob
  tipo_documento VARCHAR(50) NOT NULL, -- 'contrato', 'factura', 'proposta', etc
  tamanho BIGINT, -- Tamanho em bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA: NOTIFICACOES (Sistema de notificações push do dashboard)
-- Armazena notificações para cada usuário
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'venda_registrada', 'venda_atualizada', 'venda_aprovada', etc
  venda_id UUID REFERENCES vendas(id) ON DELETE SET NULL,
  lido BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================================

CREATE INDEX idx_vendas_user_id ON vendas(user_id);
CREATE INDEX idx_vendas_estado ON vendas(estado);
CREATE INDEX idx_vendas_data_venda ON vendas(data_venda);
CREATE INDEX idx_documentos_venda_id ON documentos(venda_id);
CREATE INDEX idx_notificacoes_user_id ON notificacoes(user_id);
CREATE INDEX idx_notificacoes_lido ON notificacoes(lido);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA A NÍVEL BD
-- ==========================================================

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem seus dados
CREATE POLICY "users_see_own_data"
  ON users FOR SELECT
  USING (
    auth.uid()::uuid = id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin')
  );

-- Policy: Parceiros veem suas vendas, admins veem tudo
CREATE POLICY "vendas_visibility"
  ON vendas FOR SELECT
  USING (
    user_id = auth.uid()::uuid OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin')
  );

-- Policy: Usuários só criam vendas para si mesmos
CREATE POLICY "vendas_insert"
  ON vendas FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);

-- Policy: Usuários só atualizam suas vendas (admins podem atualizar tudo)
CREATE POLICY "vendas_update"
  ON vendas FOR UPDATE
  USING (
    user_id = auth.uid()::uuid OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin')
  );

-- Policy: Parceiros veem documentos de suas vendas
CREATE POLICY "documentos_visibility"
  ON documentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendas
      WHERE vendas.id = documentos.venda_id
      AND (vendas.user_id = auth.uid()::uuid OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin'))
    )
  );

-- Policy: Notificações do usuário
CREATE POLICY "notificacoes_visibility"
  ON notificacoes FOR SELECT
  USING (
    user_id = auth.uid()::uuid OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin')
  );

-- ==========================================================
-- TRIGGERS PARA AUDITORIA (updated_at automático)
-- ==========================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_vendas_updated_at
  BEFORE UPDATE ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_documentos_updated_at
  BEFORE UPDATE ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
