import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - listar categorias
export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  // Buscar categorias com contagem de ficheiros
  let query = svc.from('materiais_categorias').select('*').order('created_at', { ascending: false })
  
  // Parceiros so veem categorias ativas
  if (!isAdmin) {
    query = query.eq('status', 'ativa')
  }

  const { data: categorias, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Buscar contagem de ficheiros por categoria
  const categoriasComContagem = await Promise.all((categorias ?? []).map(async cat => {
    const { count } = await svc.from('materiais_ficheiros').select('id', { count: 'exact', head: true }).eq('categoria_id', cat.id)
    return { ...cat, file_count: count ?? 0 }
  }))

  return NextResponse.json({ categorias: categoriasComContagem })
}

// POST - criar categoria (admin)
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { title, tipo, description } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 })

  const { data, error } = await svc.from('materiais_categorias').insert({
    title: title.trim(),
    tipo: tipo || 'apoio',
    description: description || '',
    status: 'ativa',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categoria: data })
}

// PATCH - actualizar status (admin)
export async function PATCH(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id, status } = await req.json()
  const { error } = await svc.from('materiais_categorias').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// DELETE - apagar categoria (admin)
export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id } = await req.json()

  // Apagar ficheiros da categoria do storage
  const { data: ficheiros } = await svc.from('materiais_ficheiros').select('file_path').eq('categoria_id', id)
  const paths = (ficheiros ?? []).map((f: any) => f.file_path).filter(Boolean)
  if (paths.length > 0) await svc.storage.from('materiais').remove(paths)

  // Apagar registos (cascade ja apaga ficheiros)
  await svc.from('materiais_categorias').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
