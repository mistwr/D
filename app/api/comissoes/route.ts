import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  const parceiroId = req.nextUrl.searchParams.get('parceiro_id')
  const targetId = isAdmin && parceiroId ? parceiroId : user.id

  const { data: com } = await supabase.from('comissoes').select('*').eq('parceiro_id', targetId).single()

  // Calcular comissões estimadas com base nas vendas
  const { data: vendas } = await supabase
    .from('vendas')
    .select('amount, service_type, operator, client_name, status')
    .eq('user_id', targetId)
    .in('status', ['pago', 'processado', 'ativa'])

  let energia = 0
  let telecom = 0
  const detalhes: any[] = []

  if (com && vendas) {
    for (const v of vendas) {
      let comissao = 0
      if (v.service_type === 'energia') {
        comissao = (v.amount * (com.energia_percent / 100)) + com.energia_fixo
        energia += comissao
      } else {
        comissao = (v.amount * (com.telecom_percent / 100)) + com.telecom_fixo
        telecom += comissao
      }
      detalhes.push({ ...v, comissao: parseFloat(comissao.toFixed(2)) })
    }
  }

  return NextResponse.json({
    comissao: com ?? null,
    calculo: { energia: parseFloat(energia.toFixed(2)), telecom: parseFloat(telecom.toFixed(2)), total: parseFloat((energia + telecom).toFixed(2)), detalhes }
  })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  if (!body.parceiro_id) return NextResponse.json({ error: 'parceiro_id obrigatorio' }, { status: 400 })

  const { data: comissao, error } = await supabase.from('comissoes').upsert({
    parceiro_id: body.parceiro_id,
    energia_percent: parseFloat(body.energia_percent) || 0,
    telecom_percent: parseFloat(body.telecom_percent) || 0,
    energia_fixo: parseFloat(body.energia_fixo) || 0,
    telecom_fixo: parseFloat(body.telecom_fixo) || 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'parceiro_id' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comissao })
}
