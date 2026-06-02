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
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  
  console.log('[v0] GET /api/parceiros - user:', user.id, 'profile:', JSON.stringify(profile))
  
  const isSuperAdmin = profile?.is_superadmin === true
  const isAdmin = profile?.role === 'admin'
  const isAdminVIP = isAdmin && !isSuperAdmin
  
  console.log('[v0] GET /api/parceiros - isSuperAdmin:', isSuperAdmin, 'isAdmin:', isAdmin, 'isAdminVIP:', isAdminVIP)
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }

  // Construir query baseado no tipo de admin
  // SuperAdmin vê todos os parceiros (incluindo admin VIP que não são superadmin)
  // Admin VIP só vê parceiros que ele criou
  let query = service.from('profiles').select('*')
  
  if (isSuperAdmin) {
    // SuperAdmin vê todos exceto outros superadmins
    query = query.eq('is_superadmin', false)
  } else if (isAdminVIP) {
    // Admin VIP só vê parceiros que ele criou
    query = query.eq('created_by', user.id)
  } else {
    // Outro admin sem permissões especiais - só parceiros normais
    query = query.eq('role', 'parceiro')
  }
  
  const { data: parceiros, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Obter emails do auth.users
  const { data: authUsers } = await service.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  authUsers?.users?.forEach(u => { emailMap[u.id] = u.email ?? '' })

  // Enriquecer com emails
  const enriched = (parceiros ?? []).map(p => ({
    ...p,
    email: emailMap[p.id] ?? ''
  }))

  return NextResponse.json({ parceiros: enriched })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  
  const isSuperAdmin = profile?.is_superadmin === true
  const isAdmin = profile?.role === 'admin'
  const isAdminVIP = isAdmin && !isSuperAdmin
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  // Admin VIP só pode apagar parceiros que ele criou
  if (isAdminVIP) {
    const { data: parceiro } = await service.from('profiles').select('created_by').eq('id', id).single()
    if (parceiro?.created_by !== user.id) {
      return NextResponse.json({ error: 'Sem permissao para apagar este parceiro' }, { status: 403 })
    }
  }

  // Apagar o utilizador (soft delete no auth)
  const { error: authError } = await service.auth.admin.deleteUser(id)
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Apagar profile
  await service.from('profiles').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
