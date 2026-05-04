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

function getFileType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel'
  return 'other'
}

// GET - listar ficheiros de uma categoria
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const categoriaId = req.nextUrl.searchParams.get('categoria_id')
  if (!categoriaId) return NextResponse.json({ error: 'categoria_id obrigatório' }, { status: 400 })

  const { data, error } = await svc()
    .from('materiais_ficheiros')
    .select('*')
    .eq('categoria_id', categoriaId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Gerar signed URLs
  const ficheiros = await Promise.all((data || []).map(async f => {
    let signed_url: string | null = null
    if (f.file_path) {
      const { data: urlData } = await svc().storage.from('materiais').createSignedUrl(f.file_path, 3600)
      signed_url = urlData?.signedUrl ?? null
    }
    return { ...f, signed_url }
  }))

  return NextResponse.json({ ficheiros })
}

// POST - upload ficheiro (admin)
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await svc().from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const formData = await req.formData()
  const categoriaId = formData.get('categoria_id') as string
  const file = formData.get('file') as File

  if (!categoriaId || !file) return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${categoriaId}/${Date.now()}_${fileName}`

  const { error: uploadError } = await svc().storage.from('materiais').upload(filePath, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error } = await svc().from('materiais_ficheiros').insert({
    categoria_id: categoriaId,
    file_name: file.name,
    file_path: filePath,
    file_type: getFileType(file.name),
    file_size: file.size,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Gerar signed URL
  const { data: urlData } = await svc().storage.from('materiais').createSignedUrl(filePath, 3600)

  return NextResponse.json({ ficheiro: { ...data, signed_url: urlData?.signedUrl ?? null } })
}

// DELETE - apagar ficheiro (admin)
export async function DELETE(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await svc().from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()

  // Obter path para apagar do storage
  const { data: ficheiro } = await svc().from('materiais_ficheiros').select('file_path').eq('id', id).single()
  if (ficheiro?.file_path) {
    await svc().storage.from('materiais').remove([ficheiro.file_path])
  }

  await svc().from('materiais_ficheiros').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
