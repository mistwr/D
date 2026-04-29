#!/usr/bin/env node

/**
 * Setup script para criar as tabelas no Supabase
 * Executa: uv run scripts/setup.py ou node scripts/setup.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'public' }
})

async function setupDatabase() {
  console.log('🚀 Iniciando setup do Supabase...\n')

  try {
    // 1. Create users table
    console.log('📋 Criando tabela users...')
    const { error: usersError } = await supabase.rpc('exec', {
      sql: `
        DROP TABLE IF EXISTS public.users CASCADE;
        CREATE TABLE public.users (
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
        CREATE INDEX idx_users_email ON public.users(email);
      `
    })

    if (usersError) {
      console.log('⚠️  Tentando criar users table com método alternativo...')
      // Tentar sem rpc
    }

    // 2. Create contratos table
    console.log('📋 Criando tabela contratos...')
    const { error: contratosError } = await supabase.rpc('exec', {
      sql: `
        DROP TABLE IF EXISTS public.contratos CASCADE;
        CREATE TABLE public.contratos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
        CREATE INDEX idx_contratos_user_id ON public.contratos(user_id);
      `
    })

    if (contratosError) {
      console.log('⚠️  Erro criando contratos table')
    }

    // 3. Create assinaturas table
    console.log('📋 Criando tabela contrato_assinaturas...')
    const { error: assinaturasError } = await supabase.rpc('exec', {
      sql: `
        DROP TABLE IF EXISTS public.contrato_assinaturas CASCADE;
        CREATE TABLE public.contrato_assinaturas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
          assinante_id UUID NOT NULL REFERENCES public.users(id),
          assinante_email VARCHAR(255),
          assinante_nome VARCHAR(255),
          tipo VARCHAR(50) NOT NULL,
          signature_image_base64 TEXT,
          ip_address VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_assinaturas_contrato_id ON public.contrato_assinaturas(contrato_id);
      `
    })

    if (assinaturasError) {
      console.log('⚠️  Erro criando assinaturas table')
    }

    console.log('\n✅ Setup completado!')
    console.log('\n📝 Próximos passos:')
    console.log('1. Registar uma nova conta em /register')
    console.log('2. Fazer login em /login')
    console.log('3. Criar contratos em /contratos')

  } catch (error) {
    console.error('❌ Erro durante setup:', error)
    process.exit(1)
  }
}

setupDatabase()
