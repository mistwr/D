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

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  // Buscar notificações do utilizador
  const { data: notifications } = await service
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Contar não lidas
  const { count } = await service
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return NextResponse.json({ 
    notifications: notifications ?? [], 
    unread_count: count ?? 0,
    is_admin: isAdmin
  })
}

// Marcar notificação como lida
export async function PATCH(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { id, mark_all } = await req.json()

  if (mark_all) {
    // Marcar todas como lidas
    await service
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  } else if (id) {
    // Marcar uma específica
    await service
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true })
}

// Criar notificação (usado internamente)
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  
  // Só admins podem criar notificações manualmente
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  const { user_id, title, message, type } = await req.json()

  const { data, error } = await service.from('notifications').insert({
    user_id,
    title,
    message,
    type: type || 'info',
    read: false
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notification: data })
}
