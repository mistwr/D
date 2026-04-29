import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (isAdmin) {
    const { data } = await supabase.from('publicacoes').select('*, profiles!created_by(full_name)').order('created_at', { ascending: false })
    return NextResponse.json({ publicacoes: data ?? [] })
  }

  const { data } = await supabase.from('publicacoes')
    .select('*')
    .or(`parceiro_id.eq.${user.id},parceiro_id.is.null`)
    .order('created_at', { ascending: false })
  return NextResponse.json({ publicacoes: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const parceiroIds: string[] = body.parceiro_ids || []

  // Se não especificou parceiros, vai para todos
  let targets = parceiroIds
  if (targets.length === 0) {
    const { data: parceiros } = await supabase.from('profiles').select('id').eq('role', 'parceiro')
    targets = (parceiros ?? []).map(p => p.id)
    // Também criar uma publicação global (sem parceiro_id)
    if (targets.length === 0) {
      const { data: pub } = await supabase.from('publicacoes').insert({
        title: body.title, message: body.message ?? '', document_name: body.document_name ?? '', created_by: user.id
      }).select().single()
      return NextResponse.json({ publicacoes: [pub] })
    }
  }

  // Usar service role para inserir notificações sem restrições de RLS
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const inserts = targets.map(pid => ({
    parceiro_id: pid,
    title: body.title,
    message: body.message ?? '',
    document_name: body.document_name ?? '',
    created_by: user.id,
  }))

  const { data: publicacoes } = await service.from('publicacoes').insert(inserts).select()

  // Criar notificações
  const notifs = targets.map(pid => ({
    user_id: pid,
    title: body.title,
    message: body.message ?? 'Nova publicação disponível',
  }))
  await service.from('notificacoes').insert(notifs)

  return NextResponse.json({ publicacoes: publicacoes ?? [] })
}
