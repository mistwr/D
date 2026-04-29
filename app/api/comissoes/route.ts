import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  const sp = req.nextUrl.searchParams
  const parceiroId = isAdmin && sp.get('parceiro_id') ? sp.get('parceiro_id')! : user.id

  const { data: comissao } = await supabase.from('comissoes').select('*').eq('parceiro_id', parceiroId).single()

  // Tabela global de comissoes por operadora
  const { data: comissoesOp } = await supabase
    .from('comissoes_operadora')
    .select('*')
    .order('servico_type').order('operadora').order('plano')

  // Calcular comissoes das vendas do parceiro
  const { data: vendas } = await supabase
    .from('vendas')
    .select('id, client_name, service_type, operator, plano, amount, status')
    .eq('user_id', parceiroId)
    .not('status', 'in', '("cancelado","rejeitado")')

  let energia = 0, telecom = 0
  const detalhes: any[] = []

  for (const v of vendas ?? []) {
    let com = 0
    const opRow = (comissoesOp ?? []).find(o =>
      o.operadora === v.operator &&
      o.servico_type === v.service_type &&
      (v.service_type !== 'telecom' || !o.plano || o.plano === '' || o.plano === v.plano)
    )
    if (opRow) {
      com = (opRow.valor_comissao ?? 0) + ((v.amount ?? 0) * ((opRow.percentagem ?? 0) / 100))
    } else if (comissao) {
      if (v.service_type === 'energia') com = ((v.amount ?? 0) * (comissao.energia_percent / 100)) + comissao.energia_fixo
      else com = ((v.amount ?? 0) * (comissao.telecom_percent / 100)) + comissao.telecom_fixo
    }
    if (v.service_type === 'energia') energia += com
    else telecom += com
    detalhes.push({ ...v, comissao: parseFloat(com.toFixed(2)) })
  }

  return NextResponse.json({
    comissao: comissao ?? null,
    comissoesOp: comissoesOp ?? [],
    calculo: {
      energia: parseFloat(energia.toFixed(2)),
      telecom: parseFloat(telecom.toFixed(2)),
      total: parseFloat((energia + telecom).toFixed(2)),
      detalhes,
    },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const svc = service()

  // Importar/guardar tabela de operadoras via upload Excel
  if (body.action === 'upsert_operadora') {
    const { operadora, servico_type, plano, valor_comissao, percentagem } = body
    const { error } = await svc.from('comissoes_operadora').upsert({
      operadora, servico_type, plano: plano ?? '',
      valor_comissao: parseFloat(valor_comissao) || 0,
      percentagem: parseFloat(percentagem) || 0,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'operadora,servico_type,plano' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { data: comissoesOp } = await svc.from('comissoes_operadora').select('*').order('servico_type').order('operadora').order('plano')
    return NextResponse.json({ success: true, comissoesOp })
  }

  if (body.action === 'import_operadoras') {
    let imported = 0
    for (const row of body.linhas ?? []) {
      const { error } = await svc.from('comissoes_operadora').upsert({
        operadora: row.operadora, servico_type: row.servico_type, plano: row.plano ?? '',
        valor_comissao: parseFloat(row.valor_comissao) || 0,
        percentagem: parseFloat(row.percentagem) || 0,
        created_by: user.id, updated_at: new Date().toISOString(),
      }, { onConflict: 'operadora,servico_type,plano' })
      if (!error) imported++
    }
    const { data: comissoesOp } = await svc.from('comissoes_operadora').select('*').order('servico_type').order('operadora').order('plano')
    return NextResponse.json({ imported, comissoesOp: comissoesOp ?? [] })
  }

  // Guardar comissao base de parceiro
  const { parceiro_id, energia_percent, telecom_percent, energia_fixo, telecom_fixo } = body
  if (!parceiro_id) return NextResponse.json({ error: 'parceiro_id obrigatorio' }, { status: 400 })

  const { error } = await svc.from('comissoes').upsert({
    parceiro_id,
    energia_percent: parseFloat(energia_percent) || 0,
    telecom_percent: parseFloat(telecom_percent) || 0,
    energia_fixo: parseFloat(energia_fixo) || 0,
    telecom_fixo: parseFloat(telecom_fixo) || 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'parceiro_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id } = await req.json()
  const svc = service()
  await svc.from('comissoes_operadora').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
