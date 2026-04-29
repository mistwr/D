import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('[v0] Init: Verificando schema do Supabase...')

    // 1. Verificar se tabela users existe
    const { data: usersTable, error: usersErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)

    if (usersErr?.code === 'PGRST116') {
      console.log('[v0] Init: Tabela users não existe, criando...')
      // Tabela não existe - mas não podemos criar via Supabase JS
      // Instruir user a executar o SQL manualmente
      return NextResponse.json({ 
        ok: false,
        message: 'Tables not created. Please run the SQL script in Supabase console.',
        sql_url: 'https://app.supabase.com/project/_/sql'
      }, { status: 400 })
    }

    console.log('[v0] Init: Schema verificado com sucesso')
    return NextResponse.json({ ok: true, message: 'Database schema ready' })
  } catch (e) {
    console.log('[v0] Init error:', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

