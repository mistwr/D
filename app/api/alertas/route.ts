import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/supabase/get-auth-user'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const today = new Date().toISOString().split('T')[0]

  // Run all counts in parallel
  const [
    energiaRes,
    telecomRes,
    pendenteChamadaRes,
    pendenteActivacaoRes,
    clienteNaoAtendeRes,
    novasHojeRes,
    alertasRes,
  ] = await Promise.all([
    // Energia a contactar: data_contacto_energia <= today and not notified
    service.from('vendas')
      .select('id, client_name, operator, amount, data_contacto_energia, created_at, parceiro_name')
      .lte('data_contacto_energia', today)
      .eq('estado_fidelizacao', 'aguardar')
      .in('service_type', ['energia', 'gas'])
      .neq('status', 'cancelado')
      .neq('status', 'rejeitado')
      .order('data_contacto_energia', { ascending: true })
      .limit(50),

    // Telecom a contactar: data_fidelizacao_telecom <= today
    service.from('vendas')
      .select('id, client_name, operator, amount, data_fidelizacao_telecom, created_at, parceiro_name')
      .lte('data_fidelizacao_telecom', today)
      .eq('estado_fidelizacao', 'aguardar')
      .eq('service_type', 'telecom')
      .neq('status', 'cancelado')
      .neq('status', 'rejeitado')
      .order('data_fidelizacao_telecom', { ascending: true })
      .limit(50),

    // Pendente de chamada
    service.from('vendas')
      .select('id, client_name, operator, amount, created_at, parceiro_name')
      .eq('status', 'pendente_chamada')
      .order('created_at', { ascending: true })
      .limit(50),

    // Pendente ativacao SMS
    service.from('vendas')
      .select('id, client_name, operator, amount, created_at, parceiro_name')
      .eq('status', 'pendente_ativacao_sms')
      .order('created_at', { ascending: true })
      .limit(50),

    // Cliente nao atende
    service.from('vendas')
      .select('id, client_name, operator, amount, created_at, parceiro_name')
      .eq('status', 'cliente_nao_atende')
      .order('created_at', { ascending: true })
      .limit(50),

    // Novas vendas hoje
    service.from('vendas')
      .select('id, client_name, operator, amount, service_type, created_at, parceiro_name')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .order('created_at', { ascending: false })
      .limit(20),

    // Alertas existentes
    service.from('alertas')
      .select('*')
      .eq('lido', false)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return NextResponse.json({
    energia: energiaRes.data || [],
    telecom: telecomRes.data || [],
    pendente_chamada: pendenteChamadaRes.data || [],
    pendente_ativacao_sms: pendenteActivacaoRes.data || [],
    cliente_nao_atende: clienteNaoAtendeRes.data || [],
    novas_hoje: novasHojeRes.data || [],
    alertas: alertasRes.data || [],
    counts: {
      energia: energiaRes.data?.length || 0,
      telecom: telecomRes.data?.length || 0,
      pendente_chamada: pendenteChamadaRes.data?.length || 0,
      pendente_ativacao_sms: pendenteActivacaoRes.data?.length || 0,
      cliente_nao_atende: clienteNaoAtendeRes.data?.length || 0,
      novas_hoje: novasHojeRes.data?.length || 0,
    }
  })
}

export async function PATCH(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id, tipo, venda_id } = await req.json()

  if (id) {
    // Mark single alert as read
    await service.from('alertas').update({ lido: true }).eq('id', id)
  } else if (tipo === 'fidelizacao' && venda_id) {
    // Mark venda fidelizacao as contactado
    await service.from('vendas').update({ estado_fidelizacao: 'contactado' }).eq('id', venda_id)
  }

  return NextResponse.json({ ok: true })
}
