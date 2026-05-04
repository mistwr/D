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

function getFileType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
  if (['doc', 'docx'].includes(ext)) return 'doc'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet'
  return 'other'
}

// GET - listar ficheiros de uma categoria
export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const categoriaId = req.nextUrl.searchParams.get('categoria_id')
  if (!categoriaId) return NextResponse.json({ ficheiros: [] })

  const svc = service()
  const { data: ficheiros } = await svc
    .from('materiais_ficheiros')
    .select('*')
    .eq('categoria_id', categoriaId)
    .order('created_at', { ascending: false })

  // Gerar URLs assinadas
  const withUrls = await Promise.all((ficheiros ?? []).map(async (f: any) => {
    const { data: signed } = await svc.storage.from('materiais').createSignedUrl(f.file_path, 3600)
    return { ...f, signed_url: signed?.signedUrl ?? null }
  }))

  return NextResponse.json({ ficheiros: withUrls })
}

// POST - upload de ficheiro (admin)
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const formData = await req.formData()
  const categoriaId = formData.get('categoria_id') as string
  const file = formData.get('file') as File | null

  if (!categoriaId || !file) return NextResponse.json({ error: 'categoria_id e ficheiro sao obrigatorios' }, { status: 400 })

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${categoriaId}/${Date.now()}-${safeName}`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await svc.storage.from('materiais').upload(filePath, bytes, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: row, error: dbErr } = await svc.from('materiais_ficheiros').insert({
    categoria_id: categoriaId,
    file_name: file.name,
    file_path: filePath,
    file_type: getFileType(file.name),
    file_size: file.size,
  }).select().single()

  if (dbErr) {
    await svc.storage.from('materiais').remove([filePath])
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  const { data: signed } = await svc.storage.from('materiais').createSignedUrl(filePath, 3600)
  return NextResponse.json({ ficheiro: { ...row, signed_url: signed?.signedUrl ?? null } })
}

// DELETE - apagar ficheiro (admin)
export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id } = await req.json()

  const { data: row } = await svc.from('materiais_ficheiros').select('file_path').eq('id', id).single()
  if (row?.file_path) await svc.storage.from('materiais').remove([row.file_path])
  await svc.from('materiais_ficheiros').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
