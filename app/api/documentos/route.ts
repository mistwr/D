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
  if (['doc', 'docx'].includes(ext)) return ext
  if (['xls', 'xlsx'].includes(ext)) return ext
  if (['jpg', 'jpeg'].includes(ext)) return ext
  if (ext === 'png') return 'png'
  return 'other'
}

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const vendaId = sp.get('venda_id')
  const tipo = sp.get('tipo') // 'contrato' = documentos sem venda_id do próprio parceiro

  const svc = service()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

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

  if (tipo === 'contrato') {
    const { data: docs } = await svc
      .from('documentos').select('*')
      .eq('uploaded_by', user.id).is('venda_id', null)
      .order('created_at', { ascending: false })

    const withUrls = await Promise.all((docs ?? []).map(async (doc: any) => {
      const { data: signed } = doc.file_path
        ? await svc.storage.from('documentos').createSignedUrl(doc.file_path, 3600)
        : { data: null }
      return { ...doc, signed_url: signed?.signedUrl ?? null }
    }))
    return NextResponse.json({ documentos: withUrls })
  }

  if (!vendaId) return NextResponse.json({ documentos: [] })

  // Verificar permissão
  const { data: venda } = await svc.from('vendas').select('user_id').eq('id', vendaId).single()
  if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
  if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  // Buscar docs na tabela
  const { data: dbDocs } = await svc
    .from('documentos').select('*')
    .eq('venda_id', vendaId)
    .order('created_at', { ascending: false })

  // Buscar uploader names
  const uploaderIds = [...new Set((dbDocs ?? []).map((d: any) => d.uploaded_by).filter(Boolean))]
  const profilesMap: Record<string, string> = {}
  if (uploaderIds.length > 0) {
    const { data: profiles } = await svc.from('profiles').select('id, full_name').in('id', uploaderIds)
    profiles?.forEach((p: any) => { profilesMap[p.id] = p.full_name })
  }
  // Também buscar nome do dono da venda
  const { data: vendaOwner } = await svc.from('profiles').select('id, full_name').eq('id', venda.user_id).single()
  const ownerName = vendaOwner?.full_name ?? 'Parceiro'

  const dbDocsWithUrls = await Promise.all((dbDocs ?? []).map(async (doc: any) => {
    const { data: signed } = doc.file_path
      ? await svc.storage.from('documentos').createSignedUrl(doc.file_path, 3600)
      : { data: null }
    return {
      ...doc,
      signed_url: signed?.signedUrl ?? null,
      uploader_name: profilesMap[doc.uploaded_by] ?? ownerName,
    }
  }))

  // Fallback: listar ficheiros directamente do storage na pasta da venda
  // (cobre ficheiros carregados antes da tabela documentos estar funcional)
  const { data: storageFiles } = await svc.storage.from('documentos').list(vendaId, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } })

  const dbFilePaths = new Set((dbDocs ?? []).map((d: any) => d.file_path).filter(Boolean))

  const orphanDocs = await Promise.all(
    (storageFiles ?? [])
      .filter(f => f.name && !f.id?.startsWith('.') && !dbFilePaths.has(`${vendaId}/${f.name}`))
      .map(async (f) => {
        const filePath = `${vendaId}/${f.name}`
        const { data: signed } = await svc.storage.from('documentos').createSignedUrl(filePath, 3600)
        const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
        return {
          id: `storage-${f.name}`,
          file_name: f.name,
          file_path: filePath,
          file_type: getFileType(f.name),
          file_size: f.metadata?.size ?? 0,
          created_at: f.created_at ?? new Date().toISOString(),
          venda_id: vendaId,
          uploaded_by: venda.user_id,
          uploader_name: ownerName,
          signed_url: signed?.signedUrl ?? null,
          _orphan: true, // ficheiro em storage sem registo na tabela
        }
      })
  )

  return NextResponse.json({ documentos: [...dbDocsWithUrls, ...orphanDocs] })
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const contentType = req.headers.get('content-type') ?? ''
  const svc = service()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  let vendaId: string | null = null
  let fileName: string = ''
  let fileType: string = 'other'
  let fileSize: number = 0
  let fileBuffer: ArrayBuffer

  if (contentType.includes('application/json')) {
    // JSON com base64 (enviado por nova venda)
    const body = await req.json()
    vendaId = body.venda_id ?? null
    fileName = body.file_name ?? 'ficheiro'
    fileType = getFileType(fileName)
    fileSize = body.file_size ?? 0

    if (!body.file_data) return NextResponse.json({ error: 'Dados do ficheiro em falta' }, { status: 400 })

    // base64 pode vir com prefixo data:...;base64,
    const base64 = (body.file_data as string).replace(/^data:[^;]+;base64,/, '')
    const binary = Buffer.from(base64, 'base64')
    fileBuffer = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength)
  } else {
    // FormData (enviado pelo admin e contratos)
    let formData: FormData
    try { formData = await req.formData() }
    catch { return NextResponse.json({ error: 'Erro ao ler formulário' }, { status: 400 }) }

    vendaId = (formData.get('venda_id') as string) || null
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return NextResponse.json({ error: 'Ficheiro obrigatório' }, { status: 400 })

    fileName = file.name
    fileType = getFileType(file.name)
    fileSize = file.size
    fileBuffer = await file.arrayBuffer()
  }

  if (vendaId) {
    const { data: venda } = await svc.from('vendas').select('user_id').eq('id', vendaId).single()
    if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const folder = vendaId ?? `contratos/${user.id}`
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${folder}/${Date.now()}-${safeFileName}`

  const { error: uploadError } = await svc.storage.from('documentos').upload(filePath, fileBuffer, {
    contentType: 'application/octet-stream',
    upsert: false,
  })
  if (uploadError) return NextResponse.json({ error: 'Erro ao fazer upload: ' + uploadError.message }, { status: 500 })

  const { data: doc, error: dbErr } = await svc.from('documentos').insert({
    venda_id: vendaId ?? null,
    file_name: fileName,
    file_type: fileType,
    file_path: filePath,
    file_size: fileSize,
    uploaded_by: user.id,
  }).select().single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  const { data: signed } = await svc.storage.from('documentos').createSignedUrl(filePath, 3600)
  return NextResponse.json({ documento: { ...doc, signed_url: signed?.signedUrl ?? null } })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
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
