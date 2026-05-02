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

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const svc = service()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  let rows: any[] = []
  if (isAdmin) {
    const { data } = await svc.from('publicacoes').select('*').order('created_at', { ascending: false })
    rows = data ?? []
  } else {
    const { data } = await svc.from('publicacoes')
      .select('*')
      .or(`parceiro_id.eq.${user.id},parceiro_id.is.null`)
      .order('created_at', { ascending: false })
    rows = data ?? []
  }

  // Gerar signed URLs para ficheiros
  const withUrls = await Promise.all(rows.map(async (p) => {
    const filePath = p.file_path || p.document_name || ''
    if (!filePath) return { ...p, signed_url: null }
    try {
      const bucket = p.bucket || 'publicacoes'
      const { data } = await svc.storage.from(bucket).createSignedUrl(filePath, 3600)
      return { ...p, signed_url: data?.signedUrl ?? null }
    } catch {
      return { ...p, signed_url: null }
    }
  }))

  return NextResponse.json({ publicacoes: withUrls })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const svc = service()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const { error } = await svc.from('publicacoes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const svc = service()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const parceiroIds: string[] = body.parceiro_ids || []

  // Se não especificou parceiros, vai para todos
  let targets = parceiroIds
  if (targets.length === 0) {
    const { data: parceiros } = await svc.from('profiles').select('id').eq('role', 'parceiro')
    targets = (parceiros ?? []).map((p: any) => p.id)
    if (targets.length === 0) {
      const { data: pub } = await svc.from('publicacoes').insert({
        title: body.title, message: body.message ?? '', document_name: body.document_name ?? '', created_by: user.id
      }).select().single()
      return NextResponse.json({ publicacoes: [pub] })
    }
  }

  const inserts = targets.map((pid: string) => ({
    parceiro_id: pid,
    title: body.title,
    message: body.message ?? '',
    document_name: body.document_name ?? '',
    created_by: user.id,
  }))

  const { data: publicacoes } = await svc.from('publicacoes').insert(inserts).select()

  // Criar notificações
  const notifs = targets.map((pid: string) => ({
    user_id: pid,
    title: body.title,
    message: body.message ?? 'Nova publicação disponível',
  }))
  await svc.from('notificacoes').insert(notifs)

  return NextResponse.json({ publicacoes: publicacoes ?? [] })
}
