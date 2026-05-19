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
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data, error } = await service.from('unidades').select('*').order('nome', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) {
    console.log('[v0] POST /api/unidades - NO USER')
    return NextResponse.json({ error: 'Nao autorizado - sessao expirada' }, { status: 401 })
  }

  console.log('[v0] POST /api/unidades - user:', user.id, user.email)
  
  const service = svc()
  const { data: profile, error: profileError } = await service.from('profiles').select('role').eq('id', user.id).single()
  
  console.log('[v0] POST /api/unidades - profile:', JSON.stringify({ profile, error: profileError?.message }))
  
  if (profileError || !profile) {
    return NextResponse.json({ error: 'Perfil nao encontrado: ' + (profileError?.message || 'sem profile') }, { status: 403 })
  }
  
  if (profile.role !== 'admin') {
    return NextResponse.json({ error: `Apenas admin. Role atual: "${profile.role}"` }, { status: 403 })
  }

  const body = await req.json()
  console.log('[v0] POST /api/unidades - body:', JSON.stringify(body))
  
  const { data, error } = await service.from('unidades').insert(body).select().single()
  if (error) {
    console.log('[v0] POST /api/unidades - error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  console.log('[v0] POST /api/unidades - SUCCESS')
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { id, ...rest } = body
  const { data, error } = await service.from('unidades').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })
  const { error } = await service.from('unidades').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
