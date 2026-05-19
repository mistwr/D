// API para parceiros gerirem a sua equipa (sub-parceiros)
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

// GET - Listar membros da equipa do parceiro
export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Obter perfil do utilizador actual
  const { data: profile } = await service.from('profiles').select('id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })

  // Buscar membros da equipa (onde responsavel_id = user.id)
  const { data: equipa, error } = await service
    .from('profiles')
    .select('id, full_name, email, phone, company_name, role, created_at, cargo_id, cargos(nome)')
    .eq('responsavel_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(equipa || [])
}

// POST - Criar novo membro da equipa (sub-parceiro)
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar perfil do utilizador (parceiro ou admin pode criar)
  const { data: profile } = await service.from('profiles').select('id, role, cargo_id, unidade_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })
  
  // Apenas parceiros e admin podem criar sub-parceiros
  if (!['admin', 'parceiro'].includes(profile.role || '')) {
    return NextResponse.json({ error: 'Sem permissao para criar membros de equipa' }, { status: 403 })
  }

  const { email, password, full_name, phone, company_name, cargo_id } = await req.json()

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Email, password e nome sao obrigatorios' }, { status: 400 })
  }

  // Verificar se email ja existe
  const { data: existingUsers } = await service.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    u => u.email?.toLowerCase() === email.toLowerCase().trim()
  )
  
  if (existingUser) {
    if (existingUser.deleted_at) {
      await service.auth.admin.deleteUser(existingUser.id)
    } else {
      return NextResponse.json({ error: 'Email ja registado' }, { status: 409 })
    }
  }

  // Criar utilizador no Supabase Auth
  const { data: newUser, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role: 'parceiro',
      phone: phone ?? '',
      company_name: company_name ?? '',
    }
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Criar/actualizar perfil com hierarquia
  const { error: profileError } = await service.from('profiles').upsert({
    id: newUser.user.id,
    email,
    full_name,
    role: 'parceiro',
    phone: phone ?? '',
    company_name: company_name ?? '',
    responsavel_id: user.id, // O criador e o responsavel
    cargo_id: cargo_id || null,
    unidade_id: profile.unidade_id || null, // Herda a unidade do responsavel
  }, { onConflict: 'id' })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    id: newUser.user.id,
    email: newUser.user.email,
    full_name,
    role: 'parceiro',
  })
}

// DELETE - Remover membro da equipa
export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('id')
  if (!memberId) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })

  const service = svc()
  
  // Verificar se o membro pertence a equipa do utilizador
  const { data: membro } = await service
    .from('profiles')
    .select('id, responsavel_id')
    .eq('id', memberId)
    .single()

  if (!membro) return NextResponse.json({ error: 'Membro nao encontrado' }, { status: 404 })
  
  // Verificar permissao (admin pode remover qualquer, parceiro so a sua equipa)
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  
  if (profile?.role !== 'admin' && membro.responsavel_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissao para remover este membro' }, { status: 403 })
  }

  // Soft delete - remover da equipa (limpar responsavel_id)
  // Nao apagamos o utilizador, apenas removemos da hierarquia
  const { error } = await service
    .from('profiles')
    .update({ responsavel_id: null })
    .eq('id', memberId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
