import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
  if (['doc', 'docx'].includes(ext)) return ext
  if (['xls', 'xlsx'].includes(ext)) return ext
  if (['jpg', 'jpeg'].includes(ext)) return ext
  if (ext === 'png') return 'png'
  return 'other'
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const vendaId = sp.get('venda_id')
  if (!vendaId) return NextResponse.json({ documentos: [] })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: venda } = await supabase.from('vendas').select('user_id').eq('id', vendaId).single()
  if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
  if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const svc = service()
  const { data: docs } = await svc.from('documentos').select('*').eq('venda_id', vendaId).order('created_at', { ascending: false })

  // Gerar URLs assinadas
  const withUrls = await Promise.all((docs ?? []).map(async (doc: any) => {
    if (!doc.file_path) return { ...doc, signed_url: null }
    const { data: signed } = await svc.storage.from('documentos').createSignedUrl(doc.file_path, 3600)
    return { ...doc, signed_url: signed?.signedUrl ?? null }
  }))

  return NextResponse.json({ documentos: withUrls })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await req.formData()
  const vendaId = formData.get('venda_id') as string
  const file = formData.get('file') as File | null

  if (!vendaId || !file) return NextResponse.json({ error: 'Campos obrigatórios: venda_id, file' }, { status: 400 })

  const { data: venda } = await supabase.from('vendas').select('user_id').eq('id', vendaId).single()
  if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const svc = service()
  const ext = file.name.split('.').pop() ?? 'pdf'
  const filePath = `${vendaId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await svc.storage.from('documentos').upload(filePath, arrayBuffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: 'Erro ao fazer upload: ' + uploadError.message }, { status: 500 })

  const { data: doc, error: dbErr } = await svc.from('documentos').insert({
    venda_id: vendaId,
    file_name: file.name,
    file_type: getFileType(file.name),
    file_path: filePath,
    file_size: file.size,
    uploaded_by: user.id,
  }).select().single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ documento: doc })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const svc = service()
  const { data: doc } = await svc.from('documentos').select('file_path, venda_id').eq('id', id).single()
  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })

  if (doc.file_path) await svc.storage.from('documentos').remove([doc.file_path])
  await svc.from('documentos').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
