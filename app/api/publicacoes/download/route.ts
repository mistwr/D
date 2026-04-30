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
  const name = req.nextUrl.searchParams.get('name') ?? 'download'
  if (!path) return NextResponse.json({ error: 'path obrigatorio' }, { status: 400 })

  const svc = service()
  const { data, error } = await svc.storage.from('publicacoes').createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) return NextResponse.json({ error: 'Ficheiro nao encontrado' }, { status: 404 })

  // Redirect para URL assinada
  return NextResponse.redirect(data.signedUrl)
}
