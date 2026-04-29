import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  let query = supabase.from('contratos').select('*').order('created_at', { ascending: false })
  if (!isAdmin) query = query.eq('user_id', user.id)

  const { data: contratos } = await query
  return NextResponse.json({ contratos: contratos ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { data: contrato, error } = await supabase.from('contratos').insert({
    user_id: user.id,
    client_name: body.client_name,
    client_phone: body.client_phone ?? '',
    client_cc: body.client_cc ?? '',
    client_nif: body.client_nif ?? '',
    client_morada: body.client_morada ?? '',
    client_email: body.client_email ?? '',
    servico_type: body.servico_type,
    operadora: body.operadora ?? '',
    assinado_cliente: false,
    assinado_vendedor: false,
    status: 'rascunho',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contrato })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { id, updates } = await req.json()
  const { data: existing } = await supabase.from('contratos').select('user_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  if (!isAdmin && existing.user_id !== user.id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: contrato } = await supabase
    .from('contratos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  return NextResponse.json({ contrato })
}
