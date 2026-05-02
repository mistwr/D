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

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)

  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const svc = service()
  const { data: profile } = await svc
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas o admin pode apagar parceiros' }, { status: 403 })
  }

  const { parceiro_id } = await req.json()
  if (!parceiro_id) return NextResponse.json({ error: 'parceiro_id obrigatório' }, { status: 400 })

  // Verificar que não é um admin
  const { data: targetProfile } = await svc
    .from('profiles')
    .select('role')
    .eq('id', parceiro_id)
    .single()

  if (targetProfile?.role === 'admin') {
    return NextResponse.json({ error: 'Não é possível apagar um admin' }, { status: 403 })
  }

  // Apagar utilizador do Supabase Auth (cascade apaga profiles, vendas, etc.)
  const { error } = await svc.auth.admin.deleteUser(parceiro_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
