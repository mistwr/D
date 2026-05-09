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
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  const sp = req.nextUrl.searchParams

  // Listar parceiros
  if (sp.get('parceiros') === '1' && isAdmin) {
    const { data } = await service.from('profiles').select('id, full_name, company_name').eq('role', 'parceiro').order('full_name')
    const { data: authUsers } = await service.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    authUsers?.users?.forEach(u => { emailMap[u.id] = u.email ?? '' })
    const parceiros = (data ?? []).map(p => ({ ...p, email: emailMap[p.id] ?? '' }))
    return NextResponse.json({ parceiros })
  }

  // Métricas
  if (sp.get('metrics') === '1') {
    let query = service.from('vendas').select('amount, status, service_type')
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
    const { data: venda } = await service.from('vendas').select('*').eq('id', vendaId).single()
    if (!venda) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
    if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    const { data: parceiro } = await service.from('profiles').select('full_name').eq('id', venda.user_id).single()
    return NextResponse.json({ venda, parceiro })
  }

  // Todas as vendas
  let query = service.from('vendas').select('*').order('created_at', { ascending: false })
  if (!isAdmin) query = query.eq('user_id', user.id)
  const { data: vendas, error: vendasError } = await query
  if (vendasError) return NextResponse.json({ error: vendasError.message }, { status: 500 })

  let profileMap: Record<string, string> = {}
  if (isAdmin && vendas && vendas.length > 0) {
    const userIds = [...new Set(vendas.map((v: any) => v.user_id))]
    const { data: profiles } = await service.from('profiles').select('id, full_name').in('id', userIds)
    profiles?.forEach((p: any) => { profileMap[p.id] = p.full_name })
  }
  const enriched = (vendas ?? []).map((v: any) => ({
    ...v,
    parceiro_name: profileMap[v.user_id] ?? 'Desconhecido',
  }))
  return NextResponse.json({ vendas: enriched })
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const body = await req.json()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: venda, error } = await service.from('vendas').insert({
    user_id: isAdmin && body.user_id ? body.user_id : user.id,
    client_name: body.client_name || '',
    client_email: body.client_email || null,
    client_phone: body.client_phone || '',
    client_nif: body.client_nif || null,
    client_cc: body.client_cc || null,
    client_iban: body.client_iban || null,
    client_address: body.client_address || null,
    amount: parseFloat(body.amount) || 0,
    currency: body.currency || 'EUR',
    description: body.description || '',
    contract_type: body.contract_type || '',
    service_type: body.service_type || 'telecom',
    operator: body.operator || '',
    plano: body.plano || '',
    status: 'pendente',
    notes: body.notes || '',
    is_dual: body.is_dual || false,
    energia_tipo: body.energia_tipo || null,
    energia_tipo_processo: body.energia_tipo_processo || null,
    cpe: body.cpe || null,
    cui: body.cui || null,
    cpes: body.cpes || [],
    cuis: body.cuis || [],
    potencia: body.potencia || null,
    escalao: body.escalao || null,
    gas_escalao: body.gas_escalao || null,
    telco_numeros: body.telco_numeros || [],
    telco_fixo: body.telco_fixo || null,
    telco_fixo_cvp: body.telco_fixo_cvp || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ venda })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const { data: docs } = await service.from('documentos').select('id, file_path').eq('venda_id', id)
  if (docs && docs.length > 0) {
    const paths = docs.map((d: any) => d.file_path).filter(Boolean)
    if (paths.length > 0) await service.storage.from('documentos').remove(paths)
    await service.from('documentos').delete().eq('venda_id', id)
  }

  const { error } = await service.from('vendas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { id, status, ...rest } = await req.json()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: venda } = await service.from('vendas').select('user_id').eq('id', id).single()
  if (!venda) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
  if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const updates: any = { updated_at: new Date().toISOString() }
  if (status) updates.status = status
  Object.assign(updates, rest)

  await service.from('vendas').update(updates).eq('id', id)
  return NextResponse.json({ ok: true })
}
