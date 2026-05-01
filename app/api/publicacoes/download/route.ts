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

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const path = req.nextUrl.searchParams.get('path')
  const name = decodeURIComponent(req.nextUrl.searchParams.get('name') ?? 'documento.pdf')
  if (!path) return NextResponse.json({ error: 'path obrigatorio' }, { status: 400 })

  const svc = service()

  // Descarregar o ficheiro do storage no servidor e retornar como stream
  const { data: fileData, error } = await svc.storage.from('publicacoes').download(path)
  if (error || !fileData) return NextResponse.json({ error: 'Ficheiro nao encontrado' }, { status: 404 })

  const arrayBuffer = await fileData.arrayBuffer()

  // Detectar content-type pelo nome do ficheiro
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const contentTypeMap: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
  }
  const contentType = contentTypeMap[ext] ?? fileData.type ?? 'application/octet-stream'

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
      'Content-Length': String(arrayBuffer.byteLength),
    },
  })
}
