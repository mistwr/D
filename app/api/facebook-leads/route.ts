import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient } from '@supabase/supabase-js'

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
  const db = svc()
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const tipo = req.nextUrl.searchParams.get('tipo') ?? ''
  const estado = req.nextUrl.searchParams.get('estado') ?? ''
  const search = req.nextUrl.searchParams.get('search') ?? ''

  let query = db.from('facebook_leads').select('*').order('created_at', { ascending: false })
  if (tipo) query = query.eq('tipo', tipo)
  if (estado) query = query.eq('estado', estado)
  if (search) query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const db = svc()
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { id, estado, notas, atribuido_a } = body
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const updates: Record<string, any> = {}
  if (estado !== undefined) updates.estado = estado
  if (notas !== undefined) updates.notas = notas
  if (atribuido_a !== undefined) updates.atribuido_a = atribuido_a

  const { data, error } = await db.from('facebook_leads').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const db = svc()
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })
  await db.from('facebook_leads').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
