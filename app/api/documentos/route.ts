import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserById, getDocsByUser, getDocsByVenda, createDocumento, getDocumentos, getVendaById } from '@/lib/store'

async function getUser() {
  const jar = await cookies()
  const t = jar.get('sd_session')?.value
  if (!t) return null
  try { const { id } = JSON.parse(Buffer.from(t, 'base64').toString()); return getUserById(id) ?? null } catch { return null }
}

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const vendaId = sp.get('venda_id')
  const docId = sp.get('download')

  // Download de ficheiro individual
  if (docId) {
    const allDocs = getDocumentos()
    const doc = allDocs.find(d => d.id === docId)
    if (!doc) return NextResponse.json({ error: 'Documento nao encontrado' }, { status: 404 })
    if (user.role === 'parceiro') {
      const venda = getVendaById(doc.venda_id)
      if (venda && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }
    // Devolver base64 data para download
    return NextResponse.json({
      documento: {
        id: doc.id,
        file_name: doc.file_name,
        file_type: doc.file_type,
        file_data: doc.file_data,
      }
    })
  }

  if (vendaId) {
    const venda = getVendaById(vendaId)
    if (!venda) return NextResponse.json({ error: 'Venda nao encontrada' }, { status: 404 })
    if (user.role === 'parceiro' && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    const docs = getDocsByVenda(vendaId).map(d => ({ ...d, file_data: undefined }))
    return NextResponse.json({ documentos: docs })
  }

  if (user.role === 'admin') {
    const allDocs = getDocumentos()
    const enriched = allDocs.map(d => {
      const uploader = getUserById(d.uploaded_by)
      const venda = getVendaById(d.venda_id)
      return {
        id: d.id, venda_id: d.venda_id, file_name: d.file_name, file_type: d.file_type,
        file_size: d.file_size, uploaded_by: d.uploaded_by, created_at: d.created_at,
        uploader_name: uploader?.full_name || 'Desconhecido',
        uploader_email: uploader?.email || '',
        uploader_company: uploader?.company_name || '',
        client_name: venda?.client_name || 'N/A',
        client_email: venda?.client_email || '',
        client_phone: venda?.client_phone || '',
        venda_amount: venda?.amount || 0,
        venda_status: venda?.status || '',
        venda_service_type: venda?.service_type || '',
        venda_operator: venda?.operator || '',
      }
    })
    return NextResponse.json({ documentos: enriched })
  }

  const userDocs = getDocsByUser(user.id).map(d => ({ ...d, file_data: undefined }))
  return NextResponse.json({ documentos: userDocs })
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await req.json()
  const { venda_id, file_name, file_type, file_data, file_size } = body

  if (!venda_id || !file_name) {
    return NextResponse.json({ error: 'Campos obrigatorios: venda_id, file_name' }, { status: 400 })
  }

  const venda = getVendaById(venda_id)
  if (!venda) return NextResponse.json({ error: 'Venda nao encontrada' }, { status: 404 })
  if (user.role === 'parceiro' && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const doc = createDocumento({
    venda_id,
    file_name,
    file_type: file_type || 'application/pdf',
    file_size: file_size || 0,
    file_data: file_data || '',
    uploaded_by: user.id,
  })

  return NextResponse.json({ documento: { id: doc.id, venda_id: doc.venda_id, file_name: doc.file_name, file_type: doc.file_type, file_size: doc.file_size, created_at: doc.created_at } })
}
