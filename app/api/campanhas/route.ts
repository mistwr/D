import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const { data: campanha } = await supabase.from('campanhas').select('*').eq('id', id).single()
    if (!campanha) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
    return NextResponse.json({ campanha })
  }

  const { data: campanhas } = await supabase.from('campanhas').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ campanhas: campanhas ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { data: campanha, error } = await supabase.from('campanhas').insert({
    title: body.title,
    operator: body.operator ?? '',
    service_type: body.service_type ?? 'telecom',
    description: body.description ?? '',
    status: body.status ?? 'ativa',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campanha })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id, ...updates } = await req.json()
  await supabase.from('campanhas').update(updates).eq('id', id)
  return NextResponse.json({ ok: true })
}
