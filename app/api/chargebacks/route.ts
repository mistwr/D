import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient } from '@supabase/supabase-js'

const svc = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Listar chargebacks (admin ve todos, parceiro ve os seus)
export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const url = new URL(req.url)
  const parceiro_id = url.searchParams.get('parceiro_id')

  let query = service.from('chargebacks').select(`
    *,
    venda:vendas(id, client_name, service_type, operator, created_at),
    parceiro:profiles!chargebacks_parceiro_id_fkey(id, full_name, email),
    criador:profiles!chargebacks_criado_por_fkey(id, full_name)
  `).order('created_at', { ascending: false })

  if (!isAdmin) {
    query = query.eq('parceiro_id', user.id)
  } else if (parceiro_id) {
    query = query.eq('parceiro_id', parceiro_id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ chargebacks: data || [] })
}

// POST: Criar chargeback (apenas admin)
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const body = await req.json()
  const { venda_id, parceiro_id, valor, motivo, observacoes } = body

  if (!venda_id || !parceiro_id || !valor || !motivo) {
    return NextResponse.json({ error: 'venda_id, parceiro_id, valor e motivo sao obrigatorios' }, { status: 400 })
  }

  // Criar chargeback
  const { data: chargeback, error } = await service.from('chargebacks').insert({
    venda_id,
    parceiro_id,
    valor: parseFloat(valor),
    motivo,
    observacoes: observacoes || null,
    criado_por: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Actualizar estado da venda para 'chargeback' se necessario
  await service.from('vendas').update({ status: 'chargeback' }).eq('id', venda_id)

  return NextResponse.json({ chargeback })
}

// DELETE: Remover chargeback (apenas admin)
export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const { error } = await service.from('chargebacks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
