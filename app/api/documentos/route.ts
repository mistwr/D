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
  const tipo = sp.get('tipo') // 'contrato' = documentos sem venda_id do próprio parceiro

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const svc = service()

  // Admin sem filtro → todos os documentos + enriquecer com dados de vendas e parceiros
  if (isAdmin && !vendaId && !tipo) {
    const { data: docs } = await svc
      .from('documentos')
      .select('*')
      .order('created_at', { ascending: false })

    if (!docs || docs.length === 0) return NextResponse.json({ documentos: [] })

    // Buscar vendas únicas referenciadas
    const vendaIds = [...new Set(docs.filter(d => d.venda_id).map((d: any) => d.venda_id))]
    const uploaderIds = [...new Set(docs.map((d: any) => d.uploaded_by).filter(Boolean))]

    const [vendasRes, profilesRes] = await Promise.all([
      vendaIds.length > 0
        ? svc.from('vendas').select('id, client_name, client_email, client_phone, client_nif, amount, status, service_type, operator, plano, user_id').in('id', vendaIds)
        : { data: [] },
      uploaderIds.length > 0
        ? svc.from('profiles').select('id, full_name, email, company').in('id', uploaderIds)
        : { data: [] },
    ])

    const vendasMap = new Map((vendasRes.data ?? []).map((v: any) => [v.id, v]))
    const profilesMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]))

    const withUrls = await Promise.all(docs.map(async (doc: any) => {
      const signed = doc.file_path
        ? (await svc.storage.from('documentos').createSignedUrl(doc.file_path, 3600)).data
        : null
      const venda = vendasMap.get(doc.venda_id) ?? null
      const uploaderProfile = profilesMap.get(doc.uploaded_by) ?? null
      // Tentar obter parceiro via venda se não houver perfil directo
      const vendaUploaderProfile = venda ? (profilesMap.get(venda.user_id) ?? null) : null
      const profile = uploaderProfile ?? vendaUploaderProfile

      return {
        ...doc,
        signed_url: signed?.signedUrl ?? null,
        uploader_name: profile?.full_name ?? 'Desconhecido',
        uploader_email: profile?.email ?? '',
        uploader_company: profile?.company ?? '',
        client_name: venda?.client_name ?? '',
        client_email: venda?.client_email ?? '',
        client_phone: venda?.client_phone ?? '',
        client_nif: venda?.client_nif ?? '',
        venda_amount: venda?.amount ?? 0,
        venda_status: venda?.status ?? '',
        venda_service_type: venda?.service_type ?? '',
        venda_operator: venda?.operator ?? '',
      }
    }))
    return NextResponse.json({ documentos: withUrls })
  }

  let query = svc.from('documentos').select('*').order('created_at', { ascending: false })

  if (tipo === 'contrato') {
    query = query.eq('uploaded_by', user.id).is('venda_id', null)
  } else if (vendaId) {
    const { data: venda } = await supabase.from('vendas').select('user_id').eq('id', vendaId).single()
    if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    query = query.eq('venda_id', vendaId)
  } else {
    return NextResponse.json({ documentos: [] })
  }

  const { data: docs } = await query

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

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Erro ao ler formulário' }, { status: 400 })
  }

  const vendaId = (formData.get('venda_id') as string) || null
  const file = formData.get('file') as File | null

  if (!file || file.size === 0) return NextResponse.json({ error: 'Ficheiro obrigatório' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (vendaId) {
    const { data: venda } = await supabase.from('vendas').select('user_id').eq('id', vendaId).single()
    if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const svc = service()
  const folder = vendaId ?? `contratos/${user.id}`
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${folder}/${Date.now()}-${safeFileName}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await svc.storage.from('documentos').upload(filePath, arrayBuffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: 'Erro ao fazer upload: ' + uploadError.message }, { status: 500 })

  const { data: doc, error: dbErr } = await svc.from('documentos').insert({
    venda_id: vendaId ?? null,
    file_name: file.name,
    file_type: getFileType(file.name),
    file_path: filePath,
    file_size: file.size,
    uploaded_by: user.id,
  }).select().single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  const { data: signed } = await svc.storage.from('documentos').createSignedUrl(filePath, 3600)
  return NextResponse.json({ documento: { ...doc, signed_url: signed?.signedUrl ?? null } })
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
