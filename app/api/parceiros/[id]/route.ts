import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  // Nao pode apagar a si proprio
  if (id === user.id) return NextResponse.json({ error: 'Nao pode apagar a sua propria conta aqui' }, { status: 400 })

  // Verificar que o alvo e parceiro (nao pode apagar outro admin)
  const { data: target } = await supabase.from('profiles').select('role, full_name').eq('id', id).single()
  if (!target) return NextResponse.json({ error: 'Parceiro nao encontrado' }, { status: 404 })
  if (target.role === 'admin') return NextResponse.json({ error: 'Nao pode apagar um administrador' }, { status: 403 })

  // Apagar dados relacionados com service role
  const adminClient = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Apagar dados do parceiro
  await adminClient.from('comissoes').delete().eq('parceiro_id', id)
  await adminClient.from('vendas').delete().eq('user_id', id)
  await adminClient.from('notificacoes').delete().eq('user_id', id)
  await adminClient.from('contratos').delete().eq('user_id', id)
  await adminClient.from('profiles').delete().eq('id', id)

  // Apagar utilizador do Supabase Auth
  const { error } = await adminClient.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, message: `Parceiro apagado com sucesso` })
}
