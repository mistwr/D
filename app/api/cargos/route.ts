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
  const { data, error } = await service.from('cargos').select('*').order('nivel', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) {
    console.log('[v0] POST /api/cargos - NO USER - checking auth failed')
    return NextResponse.json({ error: 'Nao autorizado - sessao expirada ou nao autenticado' }, { status: 401 })
  }

  console.log('[v0] POST /api/cargos - user found:', user.id, user.email)
  
  const service = svc()
  const { data: profile, error: profileError } = await service.from('profiles').select('role, email').eq('id', user.id).single()
  
  console.log('[v0] POST /api/cargos - profile query result:', JSON.stringify({ profile, error: profileError?.message }))
  
  if (profileError) {
    return NextResponse.json({ error: 'Erro ao verificar perfil: ' + profileError.message }, { status: 500 })
  }
  
  if (!profile) {
    return NextResponse.json({ error: 'Perfil nao encontrado para este utilizador' }, { status: 403 })
  }
  
  if (profile.role !== 'admin') {
    return NextResponse.json({ error: `Apenas admin pode criar cargos. O seu perfil tem role: "${profile.role || 'nenhum'}"` }, { status: 403 })
  }

  const body = await req.json()
  console.log('[v0] POST /api/cargos - creating cargo:', JSON.stringify(body))
  
  const { data, error } = await service.from('cargos').insert(body).select().single()
  if (error) {
    console.log('[v0] POST /api/cargos - insert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  console.log('[v0] POST /api/cargos - SUCCESS:', JSON.stringify(data))
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
  const { data, error } = await service.from('cargos').update(rest).eq('id', id).select().single()
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
  const { error } = await service.from('cargos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
