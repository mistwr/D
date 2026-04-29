import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserById, getVendas, getVendasByUser, getVendaById, createVenda, updateVendaStatus, getMetrics, getDocsByVenda, getParceiros } from '@/lib/store'

async function getUser() {
  const jar = await cookies()
  const t = jar.get('sd_session')?.value
  if (!t) return null
  try { const { id } = JSON.parse(Buffer.from(t, 'base64').toString()); return getUserById(id) ?? null } catch { return null }
}

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  if (sp.get('metrics') === '1') {
    return NextResponse.json(getMetrics(user.role === 'admin' ? undefined : user.id))
  }
  if (sp.get('parceiros') === '1' && user.role === 'admin') {
    return NextResponse.json({ parceiros: getParceiros().map(p => ({ id: p.id, full_name: p.full_name, email: p.email, company_name: p.company_name })) })
  }
  const vendaId = sp.get('id')
  if (vendaId) {
    const venda = getVendaById(vendaId)
    if (!venda) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
    if (user.role === 'parceiro' && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    const owner = getUserById(venda.user_id)
    return NextResponse.json({ venda, documentos: getDocsByVenda(vendaId), parceiro: owner ? { full_name: owner.full_name, email: owner.email } : null })
  }
  const vendas = user.role === 'admin' ? getVendas() : getVendasByUser(user.id)
  const enriched = vendas.map(v => {
    const owner = getUserById(v.user_id)
    return { ...v, parceiro_name: owner?.full_name || 'Desconhecido' }
  })
  return NextResponse.json({ vendas: enriched })
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const body = await req.json()
  const venda = createVenda({
    user_id: user.role === 'admin' && body.user_id ? body.user_id : user.id,
    client_name: body.client_name || '',
    client_email: body.client_email || '',
    client_phone: body.client_phone || '',
    amount: parseFloat(body.amount) || 0,
    currency: body.currency || 'EUR',
    description: body.description || '',
    contract_type: body.contract_type || 'Outro',
    service_type: body.service_type || 'telecom',
    operator: body.operator || '',
    status: 'pendente',
    notes: body.notes || '',
  })
  return NextResponse.json({ venda })
}

export async function PATCH(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const { id, status } = await req.json()
  const venda = getVendaById(id)
  if (!venda) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
  if (user.role !== 'admin' && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  updateVendaStatus(id, status)
  return NextResponse.json({ ok: true })
}
