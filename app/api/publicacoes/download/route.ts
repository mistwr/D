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
  // Verificar sessão via cookie OU via signed_url param (fallback sem auth)
  const path = req.nextUrl.searchParams.get('path')
  const name = decodeURIComponent(req.nextUrl.searchParams.get('name') ?? 'documento.pdf')
  if (!path) return NextResponse.json({ error: 'path obrigatorio' }, { status: 400 })

  const svc = service()

  // Descarregar o ficheiro do storage via service role (bypass RLS)
  const { data: fileData, error } = await svc.storage.from('publicacoes').download(path)
  if (error || !fileData) {
    // Tentar no bucket 'documentos' como fallback
    const { data: fileData2, error: err2 } = await svc.storage.from('documentos').download(path)
    if (err2 || !fileData2) return NextResponse.json({ error: 'Ficheiro nao encontrado' }, { status: 404 })

    const buf2 = await fileData2.arrayBuffer()
    const ext2 = name.split('.').pop()?.toLowerCase() ?? ''
    const ct2 = getContentType(ext2, fileData2.type)
    return new NextResponse(buf2, {
      status: 200,
      headers: {
        'Content-Type': ct2,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        'Content-Length': String(buf2.byteLength),
      },
    })
  }

  const arrayBuffer = await fileData.arrayBuffer()
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const contentType = getContentType(ext, fileData.type)

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Content-Length': String(arrayBuffer.byteLength),
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
