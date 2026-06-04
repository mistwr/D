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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const { id: saleId } = params

  try {
    // Buscar a venda
    const { data: sale, error } = await service
      .from('vendas')
      .select('*')
      .eq('id', saleId)
      .single()

    if (error || !sale) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    // Verificar permissões (admin ou criador da venda)
    const { data: profile } = await service
      .from('profiles')
      .select('role, is_superadmin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
    if (!isAdmin && sale.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    return NextResponse.json({ venda: sale })
  } catch (error) {
    console.log('[v0] Error fetching sale:', error)
    return NextResponse.json({ error: 'Erro ao buscar venda' }, { status: 500 })
  }
}
