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

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const campanhaId = req.nextUrl.searchParams.get('campanha_id')
  if (!campanhaId) return NextResponse.json({ ficheiros: [] })

  const svc = service()
  const { data: ficheiros } = await svc
    .from('campanha_ficheiros')
    .select('*')
    .eq('campanha_id', campanhaId)
    .order('created_at', { ascending: false })

  // Gerar URLs assinadas
  const withUrls = await Promise.all((ficheiros ?? []).map(async (f: any) => {
    const { data: signed } = await svc.storage.from('campanhas').createSignedUrl(f.file_path, 3600)
    return { ...f, signed_url: signed?.signedUrl ?? null }
  }))

  return NextResponse.json({ ficheiros: withUrls })
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const formData = await req.formData()
  const campanhaId = formData.get('campanha_id') as string
  const file = formData.get('file') as File | null

  if (!campanhaId || !file) return NextResponse.json({ error: 'campanha_id e ficheiro sao obrigatorios' }, { status: 400 })

  // Validação de tamanho máximo: 25MB
  const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ 
      error: `Ficheiro demasiado grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo permitido: 25MB` 
    }, { status: 413 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${campanhaId}/${Date.now()}-${safeName}`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await svc.storage.from('campanhas').upload(filePath, bytes, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: row, error: dbErr } = await svc.from('campanha_ficheiros').insert({
    campanha_id: campanhaId,
    file_name: file.name,
    file_path: filePath,
    file_type: getFileType(file.name),
    file_size: file.size,
    uploaded_by: user.id,
  }).select().single()

  if (dbErr) {
    await svc.storage.from('campanhas').remove([filePath])
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  const { data: signed } = await svc.storage.from('campanhas').createSignedUrl(filePath, 3600)
  return NextResponse.json({ ficheiro: { ...row, signed_url: signed?.signedUrl ?? null } })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id } = await req.json()

  const { data: row } = await svc.from('campanha_ficheiros').select('file_path').eq('id', id).single()
  if (row?.file_path) await svc.storage.from('campanhas').remove([row.file_path])
  await svc.from('campanha_ficheiros').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
