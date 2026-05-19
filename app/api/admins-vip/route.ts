import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient } from '@supabase/supabase-js'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se e admin/superadmin
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin === true
  if (!isAdmin) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  // Buscar todos os admins VIP (role=admin que nao sao superadmin)
  const { data: admins, error } = await service
    .from('profiles')
    .select('id, email, full_name, company_name, phone, created_at, created_by')
    .eq('role', 'admin')
    .eq('is_superadmin', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Contar parceiros de cada admin
  const adminsWithCount = await Promise.all(
    (admins || []).map(async (admin) => {
      const { count } = await service
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', admin.id)
        .eq('role', 'parceiro')
      
      return { ...admin, parceiros_count: count || 0 }
    })
  )

  return NextResponse.json(adminsWithCount)
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se e admin/superadmin
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin === true
  if (!isAdmin) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { email, password, full_name, company_name, phone } = await req.json()

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Email, password e nome sao obrigatorios' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  // Verificar se email ja existe
  const { data: existingUsers } = await service.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    u => u.email?.toLowerCase() === email.toLowerCase().trim()
  )
  if (existingUser) {
    if (existingUser.deleted_at || !existingUser.email) {
      await service.auth.admin.deleteUser(existingUser.id)
    } else {
      return NextResponse.json({ error: 'Email ja registado' }, { status: 409 })
    }
  }

  // Criar utilizador no auth
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role: 'admin',
      company_name: company_name ?? '',
      phone: phone ?? '',
    }
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Criar profile
  const { error: profileError } = await service.from('profiles').upsert({
    id: authData.user.id,
    email: email,
    full_name,
    role: 'admin',
    company_name: company_name ?? '',
    phone: phone ?? '',
    created_by: user.id,
    is_superadmin: false,
  }, { onConflict: 'id' })

  if (profileError) {
    // Rollback - apagar o auth user
    await service.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    id: authData.user.id,
    email,
    full_name,
    role: 'admin',
    company_name: company_name ?? '',
  })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se e admin/superadmin
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin === true
  if (!isAdmin) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })

  // Verificar se o admin a apagar nao e superadmin
  const { data: targetProfile } = await service.from('profiles').select('is_superadmin').eq('id', id).single()
  if (targetProfile?.is_superadmin) {
    return NextResponse.json({ error: 'Nao pode eliminar um superadmin' }, { status: 403 })
  }

  // Nao pode apagar a si mesmo
  if (id === user.id) {
    return NextResponse.json({ error: 'Nao pode eliminar a sua propria conta' }, { status: 400 })
  }

  // Transferir parceiros para o admin que esta a apagar (ou remover created_by)
  await service.from('profiles').update({ created_by: null }).eq('created_by', id)

  // Apagar profile
  await service.from('profiles').delete().eq('id', id)

  // Apagar do auth
  const { error } = await service.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
