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
    return NextResponse.json({ error: 'Nao autorizado - sessao expirada ou nao autenticado' }, { status: 401 })
  }

  const service = svc()
  const { data: profile, error: profileError } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  
  if (profileError || !profile) {
    return NextResponse.json({ error: 'Perfil nao encontrado: ' + (profileError?.message || '') }, { status: 403 })
  }
  
  const isAdmin = profile.role === 'admin' || profile.is_superadmin === true
  if (!isAdmin) {
    return NextResponse.json({ error: `Apenas admin pode criar cargos. Role atual: "${profile.role || 'nenhum'}"` }, { status: 403 })
  }

  const body = await req.json()
  const { data, error } = await service.from('cargos').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin === true
  if (!isAdmin) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

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
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin === true
  if (!isAdmin) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })

  // Remover cargo de todos os utilizadores que o têm antes de o eliminar
  await service.from('profiles').update({ cargo_id: null }).eq('cargo_id', id)

  const { error } = await service.from('cargos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
