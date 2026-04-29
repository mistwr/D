import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('[v0] Setup: Iniciando criação de tabelas no Supabase')

    // 1. Create users table
    console.log('[v0] Setup: Criando tabela users...')
    const { error: e1 } = await supabaseAdmin.rpc('exec', {
      sql: `
        DROP TABLE IF EXISTS public.users CASCADE;
        CREATE TABLE IF NOT EXISTS public.users (
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
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
      `
    })
    if (e1) console.log('[v0] Setup: Aviso ao criar users -', e1.message)

    // 2. Create contratos table
    console.log('[v0] Setup: Criando tabela contratos...')
    const { error: e2 } = await supabaseAdmin.rpc('exec', {
      sql: `
        DROP TABLE IF EXISTS public.contratos CASCADE;
        CREATE TABLE IF NOT EXISTS public.contratos (
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
        CREATE INDEX IF NOT EXISTS idx_contratos_user_id ON public.contratos(user_id);
      `
    })
    if (e2) console.log('[v0] Setup: Aviso ao criar contratos -', e2.message)

    // 3. Create assinaturas table
    console.log('[v0] Setup: Criando tabela contrato_assinaturas...')
    const { error: e3 } = await supabaseAdmin.rpc('exec', {
      sql: `
        DROP TABLE IF EXISTS public.contrato_assinaturas CASCADE;
        CREATE TABLE IF NOT EXISTS public.contrato_assinaturas (
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
        CREATE INDEX IF NOT EXISTS idx_assinaturas_contrato_id ON public.contrato_assinaturas(contrato_id);
      `
    })
    if (e3) console.log('[v0] Setup: Aviso ao criar assinaturas -', e3.message)

    // 4. Verify tables exist
    console.log('[v0] Setup: Verificando se tabelas foram criadas...')
    const { error: verifyError, data: userData } = await supabaseAdmin
      .from('users')
      .select('count(*)', { count: 'exact', head: true })

    if (verifyError) {
      console.log('[v0] Setup: Tabela users não existe ainda -', verifyError.code)
      return NextResponse.json({
        success: false,
        message: 'Tabelas não criadas. Execute o SQL manualmente no Supabase console.',
        error: verifyError.message,
        sql_file: '/scripts/03-fix-schema.sql'
      }, { status: 400 })
    }

    console.log('[v0] Setup: Tabelas criadas com sucesso!')

    // 5. Create admin user if doesn't exist
    console.log('[v0] Setup: Criando utilizador admin de teste...')
    const { error: adminError } = await supabaseAdmin
      .from('users')
      .insert({
        email: 'admin@test.com',
        password: 'admin123',
        full_name: 'Admin User',
        role: 'admin'
      })
      .select()
      .single()

    if (adminError && !adminError.message.includes('duplicate')) {
      console.log('[v0] Setup: Aviso ao criar admin -', adminError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Tabelas criadas com sucesso!',
      credentials: {
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      }
    })

  } catch (err: any) {
    console.error('[v0] Setup error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || String(err),
      message: 'Erro ao criar tabelas. Tente executar o SQL manualmente.'
    }, { status: 500 })
  }
}

