import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Heartbeat - atualizar presença do utilizador
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()

  // Upsert presença
  await service.from('user_presence').upsert({
    user_id: user.id,
    last_seen: new Date().toISOString(),
    is_online: true
  }, { onConflict: 'user_id' })

  // Marcar como offline utilizadores sem atividade há mais de 2 minutos
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  await service
    .from('user_presence')
    .update({ is_online: false })
    .lt('last_seen', twoMinutesAgo)
    .eq('is_online', true)

  return NextResponse.json({ ok: true })
}

// Listar utilizadores online (só para admins)
export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins' }, { status: 403 })
  }

  const isAdminVIP = profile?.role === 'admin' && !profile?.is_superadmin

  // Marcar como offline utilizadores sem atividade há mais de 2 minutos
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  await service
    .from('user_presence')
    .update({ is_online: false })
    .lt('last_seen', twoMinutesAgo)
    .eq('is_online', true)

  // Buscar utilizadores online
  let query = service
    .from('user_presence')
    .select(`
      user_id,
      last_seen,
      is_online,
      profiles!inner(id, full_name, email, role, avatar_url, company_name, created_by)
    `)
    .eq('is_online', true)
    .order('last_seen', { ascending: false })

  const { data: onlineUsers } = await query

  // Filtrar se for Admin VIP (só vê parceiros que criou)
  let filtered = onlineUsers ?? []
  if (isAdminVIP) {
    filtered = filtered.filter((u: any) => 
      u.profiles?.created_by === user.id || u.profiles?.id === user.id
    )
  }

  // Formatar resposta
  const users = filtered.map((u: any) => ({
    id: u.profiles?.id,
    full_name: u.profiles?.full_name,
    email: u.profiles?.email,
    role: u.profiles?.role,
    avatar_url: u.profiles?.avatar_url,
    company_name: u.profiles?.company_name,
    last_seen: u.last_seen,
    is_online: u.is_online
  }))

  // Contar totais
  const { count: totalOnline } = await service
    .from('user_presence')
    .select('*', { count: 'exact', head: true })
    .eq('is_online', true)

  return NextResponse.json({ 
    users,
    total_online: isAdminVIP ? users.length : (totalOnline ?? 0)
  })
}

// Marcar como offline (logout)
export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  await service
    .from('user_presence')
    .update({ is_online: false })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
