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
  const [profileResult,notificationsResult,countResult]=await Promise.all([
    service.from('profiles').select('role').eq('id',user.id).single(),
    service.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20),
    service.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('read',false),
  ])
  if(notificationsResult.error||countResult.error)return NextResponse.json({error:'Não foi possível carregar as notificações.'},{status:500})
  return NextResponse.json({notifications:notificationsResult.data||[],unread_count:countResult.count||0,unreadCount:countResult.count||0,is_admin:profileResult.data?.role==='admin'},{headers:{'Cache-Control':'private, no-store'}})
}

// Marcar notificação como lida
export async function PATCH(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { id, mark_all, markAll } = await req.json()

  if (mark_all || markAll) {
    // Marcar todas como lidas
    const {error}=await service
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    if(error)return NextResponse.json({error:'Não foi possível atualizar as notificações.'},{status:500})
  } else if (id) {
    // Marcar uma específica
    const {error}=await service
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id)
    if(error)return NextResponse.json({error:'Não foi possível atualizar a notificação.'},{status:500})
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
