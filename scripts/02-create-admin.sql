-- Script para criar Admin padrão no Supabase
-- Este script deve ser executado uma vez

-- 1. Criar utilizador admin via Supabase Auth
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  is_sso_user
) VALUES (
  'admin@solucoesdiferentes.pt',
  crypt('Admin@2024', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  FALSE
) ON CONFLICT DO NOTHING;

-- 2. Adicionar perfil de admin na tabela users
INSERT INTO users (id, email, full_name, role, company_name, phone, address)
SELECT 
  id,
  email,
  'Administrador Soluções Diferentes',
  'admin',
  'Soluções Diferentes',
  '+351 000 000 000',
  'Portugal'
FROM auth.users
WHERE email = 'admin@solucoesdiferentes.pt'
ON CONFLICT DO NOTHING;

-- 3. Verificar que foi criado
SELECT 'Admin criado com sucesso!' as resultado;
SELECT email, full_name, role FROM users WHERE email = 'admin@solucoesdiferentes.pt';
