import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getUser(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-access-token')?.value
  if (!token) return null
  const { data } = await svc().auth.getUser(token)
  return data.user
}

// GET - listar categorias
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await svc().from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  let query = svc().from('materiais_categorias').select('*').order('created_at', { ascending: false })
  
  // Parceiros so veem categorias ativas
  if (!isAdmin) {
    query = query.eq('status', 'ativa')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ categorias: data })
}

// POST - criar categoria (admin)
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await svc().from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await req.json()
  const { title, tipo, description } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

  const { data, error } = await svc().from('materiais_categorias').insert({
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
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await svc().from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id, status } = await req.json()
  const { error } = await svc().from('materiais_categorias').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// DELETE - apagar categoria (admin)
export async function DELETE(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await svc().from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()

  // Apagar ficheiros da categoria do storage
  const { data: ficheiros } = await svc().from('materiais_ficheiros').select('file_path').eq('categoria_id', id)
  if (ficheiros?.length) {
    const paths = ficheiros.map(f => f.file_path).filter(Boolean)
    if (paths.length) await svc().storage.from('materiais').remove(paths)
  }

  // Apagar registos
  await svc().from('materiais_ficheiros').delete().eq('categoria_id', id)
  await svc().from('materiais_categorias').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
