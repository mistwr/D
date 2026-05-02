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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const svc = service()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  if (id === user.id) return NextResponse.json({ error: 'Nao pode apagar a sua propria conta aqui' }, { status: 400 })

  const { data: target } = await svc.from('profiles').select('role, full_name').eq('id', id).single()
  if (!target) return NextResponse.json({ error: 'Parceiro nao encontrado' }, { status: 404 })
  if (target.role === 'admin') return NextResponse.json({ error: 'Nao pode apagar um administrador' }, { status: 403 })

  await svc.from('comissoes').delete().eq('parceiro_id', id)
  await svc.from('vendas').delete().eq('user_id', id)
  await svc.from('notificacoes').delete().eq('user_id', id)
  await svc.from('contratos').delete().eq('user_id', id)
  await svc.from('profiles').delete().eq('id', id)

  const { error } = await svc.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, message: `Parceiro apagado com sucesso` })
}
