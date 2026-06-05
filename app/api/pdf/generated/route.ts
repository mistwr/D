import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const service = svc()
    const { searchParams } = new URL(req.url)
    const sale_id = searchParams.get('sale_id')

    if (!sale_id) {
      return NextResponse.json({ error: 'sale_id obrigatório' }, { status: 400 })
    }

    // Buscar venda para verificar permissões
    const { data: sale } = await service
      .from('vendas')
      .select('user_id')
      .eq('id', sale_id)
      .single()

    // Verificar permissões
    const { data: profile } = await service
      .from('profiles')
      .select('role, is_superadmin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
    if (!isAdmin && sale?.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Buscar PDFs gerados
    const { data: pdfs, error } = await service
      .from('generated_pdfs')
      .select('*')
      .eq('sale_id', sale_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ pdfs })
  } catch (error) {
    console.log('[v0] Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
