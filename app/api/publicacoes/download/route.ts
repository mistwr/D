import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const rawPath = req.nextUrl.searchParams.get('path') ?? ''
  const name = decodeURIComponent(req.nextUrl.searchParams.get('name') ?? 'documento.pdf')
  if (!rawPath) return NextResponse.json({ error: 'path obrigatorio' }, { status: 400 })

  const svc = service()

  // O file_path guardado na DB é "publicacoes/filename" — remover o prefixo do bucket
  const storagePath = rawPath.startsWith('publicacoes/') ? rawPath.slice('publicacoes/'.length) : rawPath

  const { data: fileData, error } = await svc.storage.from('publicacoes').download(storagePath)
  if (error || !fileData) {
    // Fallback: tentar no bucket 'documentos' com o path completo
    const docPath = rawPath.startsWith('documentos/') ? rawPath.slice('documentos/'.length) : rawPath
    const { data: fileData2, error: err2 } = await svc.storage.from('documentos').download(docPath)
    if (err2 || !fileData2) {
      return NextResponse.json({ error: 'Ficheiro nao encontrado' }, { status: 404 })
    }
    return buildResponse(fileData2, name)
  }

  return buildResponse(fileData, name)
}

function buildResponse(blob: Blob, name: string): NextResponse {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const contentType = getContentType(ext, blob.type)
  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  })
}

function getContentType(ext: string, fallback?: string): string {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  }
  return map[ext] ?? fallback ?? 'application/octet-stream'
}
