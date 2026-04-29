import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const sp = req.nextUrl.searchParams

  // Listar parceiros
  if (sp.get('parceiros') === '1' && isAdmin) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, company_name')
      .eq('role', 'parceiro')
      .order('full_name')
    // Buscar emails do auth — join via auth.users não é possível em JS, usamos service role
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: authUsers } = await service.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    authUsers?.users?.forEach(u => { emailMap[u.id] = u.email ?? '' })
    const parceiros = (data ?? []).map(p => ({ ...p, email: emailMap[p.id] ?? '' }))
    return NextResponse.json({ parceiros })
  }

  // Métricas
  if (sp.get('metrics') === '1') {
    let query = supabase.from('vendas').select('amount, status, service_type')
    if (!isAdmin) query = query.eq('user_id', user.id)
    const { data: vendas } = await query
    const total = vendas?.reduce((s, v) => s + (v.amount || 0), 0) ?? 0
    const count = vendas?.length ?? 0
    const pendentes = vendas?.filter(v => v.status === 'pendente').length ?? 0
    const pagas = vendas?.filter(v => v.status === 'pago').length ?? 0
    return NextResponse.json({ total, count, pendentes, pagas })
  }

  // Venda por id
  const vendaId = sp.get('id')
  if (vendaId) {
    const { data: venda } = await supabase.from('vendas').select('*').eq('id', vendaId).single()
    if (!venda) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
    if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    const { data: parceiro } = await supabase.from('profiles').select('full_name').eq('id', venda.user_id).single()
    return NextResponse.json({ venda, parceiro })
  }

  // Todas as vendas
  let query = supabase.from('vendas').select('*, profiles!user_id(full_name)').order('created_at', { ascending: false })
  if (!isAdmin) query = query.eq('user_id', user.id)
  const { data: vendas } = await query
  const enriched = (vendas ?? []).map((v: any) => ({ ...v, parceiro_name: v.profiles?.full_name ?? 'Desconhecido', profiles: undefined }))
  return NextResponse.json({ vendas: enriched })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await req.json()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: venda, error } = await supabase.from('vendas').insert({
    user_id: isAdmin && body.user_id ? body.user_id : user.id,
    client_name: body.client_name || '',
    client_email: body.client_email || '',
    client_phone: body.client_phone || '',
    amount: parseFloat(body.amount) || 0,
    currency: body.currency || 'EUR',
    description: body.description || '',
    contract_type: body.contract_type || '',
    service_type: body.service_type || 'telecom',
    operator: body.operator || '',
    status: 'pendente',
    notes: body.notes || '',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ venda })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { id, status, ...rest } = await req.json()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: venda } = await supabase.from('vendas').select('user_id').eq('id', id).single()
  if (!venda) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
  if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const updates: any = { updated_at: new Date().toISOString() }
  if (status) updates.status = status
  Object.assign(updates, rest)

  await supabase.from('vendas').update(updates).eq('id', id)
  return NextResponse.json({ ok: true })
}
