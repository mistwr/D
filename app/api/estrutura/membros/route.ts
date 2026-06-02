import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient } from '@supabase/supabase-js'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET - Buscar membros da estrutura do parceiro
export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar permissoes
  const { data: profile } = await service.from('profiles').select('pode_criar_estrutura, pode_criar_parceiros').eq('id', user.id).single()
  const canView = profile?.pode_criar_estrutura || profile?.pode_criar_parceiros
  
  if (!canView) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  // Buscar membros criados por este utilizador
  const { data, error } = await service
    .from('profiles')
    .select('id, full_name, email, company_name, phone, created_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ membros: data || [] })
}

// POST - Criar novo membro na estrutura
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar permissoes
  const { data: profile } = await service.from('profiles').select('pode_criar_estrutura, pode_criar_parceiros').eq('id', user.id).single()
  const canCreate = profile?.pode_criar_estrutura || profile?.pode_criar_parceiros
  
  if (!canCreate) {
    return NextResponse.json({ error: 'Sem permissao para criar membros' }, { status: 403 })
  }

  const body = await req.json()
  const { email, password, full_name, company_name, phone } = body

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Email, password e nome sao obrigatorios' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  // Criar utilizador no auth
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, company_name, phone }
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      return NextResponse.json({ error: 'Este email ja esta registado' }, { status: 400 })
    }
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'Erro ao criar utilizador' }, { status: 500 })
  }

  // Criar profile com created_by apontando para o parceiro que criou
  const { error: profileError } = await service.from('profiles').upsert({
    id: authData.user.id,
    email,
    full_name,
    company_name: company_name || '',
    phone: phone || '',
    role: 'parceiro',
    created_by: user.id,  // Importante: marca quem criou este membro
    is_superadmin: false,
    is_admin_vip: false,
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    user: { id: authData.user.id, email, full_name } 
  })
}

// DELETE - Remover membro da estrutura
export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar permissoes
  const { data: profile } = await service.from('profiles').select('pode_criar_estrutura, pode_criar_parceiros').eq('id', user.id).single()
  const canDelete = profile?.pode_criar_estrutura || profile?.pode_criar_parceiros
  
  if (!canDelete) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  const body = await req.json()
  const { id } = body

  if (!id) {
    return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })
  }

  // Verificar se o membro pertence a estrutura deste utilizador
  const { data: membro } = await service.from('profiles').select('created_by').eq('id', id).single()
  if (!membro || membro.created_by !== user.id) {
    return NextResponse.json({ error: 'Sem permissao para remover este membro' }, { status: 403 })
  }

  // Apagar do auth (o profile sera apagado automaticamente pelo cascade)
  const { error } = await service.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
