-- ====== FIX: Create correct users table with password field ======

-- Drop existing table if exists and recreate with correct schema
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'parceiro',
  company_name VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate other tables with correct schema
DROP TABLE IF EXISTS contratos CASCADE;
DROP TABLE IF EXISTS contrato_assinaturas CASCADE;
DROP TABLE IF EXISTS vendas CASCADE;
DROP TABLE IF EXISTS comissoes_por_operadora CASCADE;

-- Create contratos table
CREATE TABLE contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_cc VARCHAR(20),
  client_nif VARCHAR(20),
  client_morada TEXT,
  client_email VARCHAR(255),
  servico_type VARCHAR(50) NOT NULL,
  operadora VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'rascunho',
  assinado_cliente BOOLEAN DEFAULT false,
  assinado_vendedor BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contrato_assinaturas table
CREATE TABLE contrato_assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  assinante_id UUID NOT NULL REFERENCES users(id),
  assinante_email VARCHAR(255),
  assinante_nome VARCHAR(255),
  signature_image_base64 TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendas table
CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  amount DECIMAL(15,2),
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comissoes_por_operadora table
CREATE TABLE comissoes_por_operadora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  operadora VARCHAR(100),
  servico_type VARCHAR(50),
  percentual DECIMAL(5,2),
  valor_fixo DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_contratos_user_id ON contratos(user_id);
CREATE INDEX idx_contratos_status ON contratos(status);
CREATE INDEX idx_assinaturas_contrato_id ON contrato_assinaturas(contrato_id);
CREATE INDEX idx_vendas_user_id ON vendas(user_id);
CREATE INDEX idx_comissoes_admin_id ON comissoes_por_operadora(admin_id);

-- Disable RLS for now (we're using custom auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE contratos DISABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_assinaturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes_por_operadora DISABLE ROW LEVEL SECURITY;
