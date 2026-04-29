-- Script para criar admin de teste
-- Execute este script no Supabase SQL Editor

-- Primeiro, crie o usuário de autenticação no Supabase Auth
-- Depois execute este SQL:

INSERT INTO users (
  id,
  email,
  full_name,
  role,
  company_name,
  phone,
  address,
  created_at,
  updated_at
) VALUES (
  'admin-user-id-placeholder', -- Será substituído com o UUID real do auth.users
  'admin@solucoes-diferentes.pt',
  'Administrador',
  'admin',
  'Soluções Diferentes',
  '+351912345678',
  'Rua Principal, 123 - Lisboa',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Credenciais de teste:
-- Email: admin@solucoes-diferentes.pt
-- Senha: Admin@2024!Seg
