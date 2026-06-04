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
    console.log('[v0] Starting delete for user:', parceiro_id)
    
    // 1. Limpar referências em todas as tabelas com foreign keys
    const tables = [
      { table: 'campaign_materials', column: 'uploaded_by' },
      { table: 'campaigns', column: 'created_by' },
      { table: 'comissoes_operadora', column: 'parceiro_id' },
      { table: 'goals', column: 'user_id' },
      { table: 'leaderboard_points', column: 'user_id' },
      { table: 'notifications', column: 'user_id' },
      { table: 'user_badges', column: 'user_id' },
      { table: 'user_presence', column: 'user_id' },
    ]
    
    for (const { table, column } of tables) {
      try {
        await svc.from(table).delete().eq(column, parceiro_id)
      } catch (e) {
        console.log(`[v0] Could not delete from ${table}:`, e)
      }
    }
    
    // Chargebacks and sales_results with multiple columns
    try {
      const chargebacksRes = await svc.from('chargebacks').delete()
        .or(`parceiro_id.eq.${parceiro_id},criado_por.eq.${parceiro_id}`)
      console.log('[v0] Chargebacks deleted')
    } catch (e) {
      console.log('[v0] Could not delete chargebacks:', e)
    }
    
    try {
      const salesRes = await svc.from('sales_results').delete()
        .or(`created_by.eq.${parceiro_id},seller_id.eq.${parceiro_id}`)
      console.log('[v0] Sales results deleted')
    } catch (e) {
      console.log('[v0] Could not delete sales_results:', e)
    }

    // 2. Limpar auto-referências em profiles (created_by, responsavel_id)
    try {
      await svc.from('profiles').update({ created_by: null }).eq('created_by', parceiro_id)
      await svc.from('profiles').update({ responsavel_id: null }).eq('responsavel_id', parceiro_id)
      console.log('[v0] Profiles references cleaned')
    } catch (e) {
      console.log('[v0] Could not clean profile references:', e)
    }

    // 3. Deletar o profile
    try {
      await svc.from('profiles').delete().eq('id', parceiro_id)
      console.log('[v0] Profile deleted')
    } catch (e) {
      console.log('[v0] Could not delete profile:', e)
      throw e
    }

    // 4. Obter email antes de apagar
    let emailToBlock: string | undefined
    try {
      const { data: authUser } = await svc.auth.admin.getUserById(parceiro_id)
      emailToBlock = authUser?.user?.email
      console.log('[v0] Email found:', emailToBlock)
    } catch (e) {
      console.log('[v0] Could not get email:', e)
    }

    // 5. Deletar o utilizador do Supabase Auth
    try {
      const { error } = await svc.auth.admin.deleteUser(parceiro_id)
      if (error) {
        console.log('[v0] Auth delete error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      console.log('[v0] Auth user deleted')
    } catch (e) {
      console.log('[v0] Could not delete auth user:', e)
      throw e
    }

    // 6. Registar email na lista de bloqueio para impedir re-registo
    if (emailToBlock) {
      try {
        await svc.from('deleted_emails').upsert(
          { email: emailToBlock.toLowerCase(), deleted_by: 'admin', reason: 'Parceiro removido pelo admin' },
          { onConflict: 'email' }
        )
        console.log('[v0] Email blocked')
      } catch (e) {
        console.log('[v0] Could not block email:', e)
      }
    }

    console.log('[v0] Delete completed successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log('[v0] Error deleting user:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao deletar utilizador' }, { status: 500 })
  }
}
