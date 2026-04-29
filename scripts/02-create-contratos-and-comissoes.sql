-- Tabela de comissões por operadora
CREATE TABLE IF NOT EXISTS comissoes_por_operadora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operadora VARCHAR(50) NOT NULL,
  servico_type VARCHAR(20) NOT NULL CHECK (servico_type IN ('energia', 'telecom')),
  percentual DECIMAL(5,2) DEFAULT 0,
  valor_fixo DECIMAL(10,2) DEFAULT 0,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(operadora, servico_type)
);

-- Tabela de contratos
CREATE TABLE IF NOT EXISTS contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_cc VARCHAR(20),
  client_nif VARCHAR(20),
  client_morada TEXT,
  client_email VARCHAR(255),
  servico_type VARCHAR(20) NOT NULL CHECK (servico_type IN ('energia', 'telecom')),
  operadora VARCHAR(50),
  assinado_cliente BOOLEAN DEFAULT FALSE,
  assinado_vendedor BOOLEAN DEFAULT FALSE,
  pdf_template_url TEXT,
  pdf_filled_url TEXT,
  pdf_signed_url TEXT,
  status VARCHAR(50) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pendente_cliente', 'pendente_vendedor', 'finalizado', 'rejeitado')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de assinaturas digitais
CREATE TABLE IF NOT EXISTS contrato_assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cliente', 'vendedor')),
  assinante_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assinante_email VARCHAR(255),
  assinante_nome VARCHAR(255),
  signature_image_base64 TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX idx_comissoes_operadora ON comissoes_por_operadora(operadora, servico_type);
CREATE INDEX idx_contratos_user ON contratos(user_id);
CREATE INDEX idx_contratos_status ON contratos(status);
CREATE INDEX idx_assinaturas_contrato ON contrato_assinaturas(contrato_id);

-- RLS Policies
ALTER TABLE comissoes_por_operadora ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_assinaturas ENABLE ROW LEVEL SECURITY;

-- Comissões: apenas admin pode ver/editar
CREATE POLICY comissoes_admin_policy ON comissoes_por_operadora
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Contratos: parceiro ve seus contratos, admin ve todos
CREATE POLICY contratos_select_policy ON contratos
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY contratos_insert_policy ON contratos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY contratos_update_policy ON contratos
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Assinaturas: ver se é parceiro/admin or cliente da venda
CREATE POLICY assinaturas_select_policy ON contrato_assinaturas
  FOR SELECT USING (
    (SELECT user_id FROM contratos WHERE id = contrato_id) = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY assinaturas_insert_policy ON contrato_assinaturas
  FOR INSERT WITH CHECK (
    (SELECT user_id FROM contratos WHERE id = contrato_id) = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
