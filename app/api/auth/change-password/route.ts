import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const body = await req.json()

  // Admin a alterar password de outro utilizador (aceita target_user_id ou parceiro_id)
  const targetId = body.target_user_id || body.parceiro_id
  if (targetId && targetId !== user.id) {
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin pode alterar passwords de terceiros' }, { status: 403 })
    if (!body.new_password || body.new_password.length < 6) return NextResponse.json({ error: 'Password deve ter pelo menos 6 caracteres' }, { status: 400 })
    const svc = service()
    const { error } = await svc.auth.admin.updateUserById(targetId, { password: body.new_password })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Utilizador a alterar a propria password
  if (!body.new_password || body.new_password.length < 6) return NextResponse.json({ error: 'Password deve ter pelo menos 6 caracteres' }, { status: 400 })
  const { error } = await supabase.auth.updateUser({ password: body.new_password })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
