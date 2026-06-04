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

  const service = svc()
  const { searchParams } = new URL(req.url)
  const saleId = searchParams.get('sale_id')
  const status = searchParams.get('status')

  let query = service.from('sale_notifications').select('*')

  if (saleId) query = query.eq('sale_id', saleId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ notifications: data || [] })
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const body = await req.json()
  const { sale_id, notification_type } = body

  if (!sale_id || !notification_type) {
    return NextResponse.json({ error: 'sale_id e notification_type obrigatórios' }, { status: 400 })
  }

  // Buscar venda
  const { data: sale } = await service.from('vendas').select('*').eq('id', sale_id).single()
  if (!sale) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })

  // Calcular data de trigger baseado no tipo de notificação
  let triggerDate = new Date()
  if (notification_type === 'fidelizacao_tv_22m') {
    // TV com 22 meses de fidelização
    triggerDate = new Date(sale.data_fidelizacao)
    triggerDate.setMonth(triggerDate.getMonth() + 22)
  } else if (notification_type === 'adesao_digi_3m') {
    // DIGI com 3 meses desde adesão
    triggerDate = new Date(sale.created_at)
    triggerDate.setMonth(triggerDate.getMonth() + 3)
  }

  // Criar notificação
  const { data: notification, error } = await service.from('sale_notifications').insert({
    sale_id,
    notification_type,
    trigger_date: triggerDate.toISOString().split('T')[0],
    status: 'pendente'
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(notification)
}

export async function PUT(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const body = await req.json()
  const { id, status, notes } = body

  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
  if (status) updateData.status = status
  if (notes !== undefined) updateData.notes = notes

  if (status === 'tratado') {
    updateData.treated_by = user.id
  }

  if (status === 'visto') {
    // Adicionar user ao array seen_by
    const { data: notification } = await service.from('sale_notifications').select('seen_by').eq('id', id).single()
    const seenBy = notification?.seen_by || []
    if (!seenBy.includes(user.id)) {
      seenBy.push(user.id)
      updateData.seen_by = seenBy
    }
  }

  const { data, error } = await service.from('sale_notifications')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
