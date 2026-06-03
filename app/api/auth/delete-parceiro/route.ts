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

  try {
    // 1. Limpar referências em todas as tabelas com foreign keys
    await Promise.all([
      svc.from('campaign_materials').delete().eq('uploaded_by', parceiro_id),
      svc.from('campaigns').delete().eq('created_by', parceiro_id),
      svc.from('chargebacks').delete().or(`parceiro_id.eq.${parceiro_id},criado_por.eq.${parceiro_id}`),
      svc.from('comissoes_operadora').delete().eq('parceiro_id', parceiro_id),
      svc.from('goals').delete().eq('user_id', parceiro_id),
      svc.from('leaderboard_points').delete().eq('user_id', parceiro_id),
      svc.from('notifications').delete().eq('user_id', parceiro_id),
      svc.from('sales_results').delete().or(`created_by.eq.${parceiro_id},seller_id.eq.${parceiro_id}`),
      svc.from('user_badges').delete().eq('user_id', parceiro_id),
      svc.from('user_presence').delete().eq('user_id', parceiro_id),
    ])

    // 2. Limpar auto-referências em profiles (created_by, responsavel_id)
    await Promise.all([
      svc.from('profiles').update({ created_by: null }).eq('created_by', parceiro_id),
      svc.from('profiles').update({ responsavel_id: null }).eq('responsavel_id', parceiro_id),
    ])

    // 3. Deletar o profile
    await svc.from('profiles').delete().eq('id', parceiro_id)

    // 4. Obter email antes de apagar
    const { data: authUser } = await svc.auth.admin.getUserById(parceiro_id)
    const emailToBlock = authUser?.user?.email

    // 5. Deletar o utilizador do Supabase Auth
    const { error } = await svc.auth.admin.deleteUser(parceiro_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 6. Registar email na lista de bloqueio para impedir re-registo
    if (emailToBlock) {
      await svc.from('deleted_emails').upsert(
        { email: emailToBlock.toLowerCase(), deleted_by: 'admin', reason: 'Parceiro removido pelo admin' },
        { onConflict: 'email' }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log('[v0] Error deleting user:', error)
    return NextResponse.json({ error: 'Erro ao deletar utilizador' }, { status: 500 })
  }
}
