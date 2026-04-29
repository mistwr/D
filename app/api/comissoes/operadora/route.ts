import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { searchParams } = new URL(request.url)
  // Admin pode pedir comissoes de qualquer parceiro via ?parceiro_id=
  // Parceiro vê sempre as suas próprias (sem parâmetro ou com o seu próprio id)
  const parceiro_id = isAdmin
    ? (searchParams.get('parceiro_id') ?? user.id)
    : user.id

  const { data, error } = await supabase
    .from('comissoes_operadora')
    .select('*')
    .eq('parceiro_id', parceiro_id)
    .order('servico')
    .order('operadora')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comissoes: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const body = await request.json()
  const { parceiro_id, servico, operadora, plano, valor_comissao } = body

  if (!parceiro_id || !servico || !operadora) {
    return NextResponse.json({ error: 'Campos obrigatorios em falta' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('comissoes_operadora')
    .upsert({
      parceiro_id,
      servico,
      operadora,
      plano: plano || '',
      valor_comissao: parseFloat(valor_comissao) || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'parceiro_id,servico,operadora,plano' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comissao: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const body = await request.json()
  const { parceiro_id, servico, operadora, plano } = body

  const { error } = await supabase
    .from('comissoes_operadora')
    .delete()
    .eq('parceiro_id', parceiro_id)
    .eq('servico', servico)
    .eq('operadora', operadora)
    .eq('plano', plano || '')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
