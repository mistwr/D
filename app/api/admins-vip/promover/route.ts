import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/supabase/get-auth-user'

const svc = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// POST - Promover parceiro a Admin VIP
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se é superadmin
  const { data: profile } = await service.from('profiles').select('is_superadmin').eq('id', user.id).single()
  if (!profile?.is_superadmin) {
    return NextResponse.json({ error: 'Apenas SuperAdmins podem promover parceiros' }, { status: 403 })
  }

  const body = await req.json()
  const { parceiro_id } = body

  if (!parceiro_id) {
    return NextResponse.json({ error: 'ID do parceiro é obrigatório' }, { status: 400 })
  }

  // Verificar se o parceiro existe e é realmente parceiro
  const { data: parceiro, error: parceiroError } = await service
    .from('profiles')
    .select('id, email, full_name, role, is_superadmin')
    .eq('id', parceiro_id)
    .single()

  if (parceiroError || !parceiro) {
    return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 })
  }

  if (parceiro.role === 'admin') {
    return NextResponse.json({ error: 'Este utilizador já é um admin' }, { status: 400 })
  }

  // Promover a Admin VIP (role = admin, is_superadmin = false)
  const { error: updateError } = await service
    .from('profiles')
    .update({ 
      role: 'admin', 
      is_superadmin: false,
      created_by: user.id // Marca quem promoveu
    })
    .eq('id', parceiro_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Criar notificação para o novo Admin VIP
  await service.from('notifications').insert({
    user_id: parceiro_id,
    type: 'promocao',
    title: 'Parabéns! Foi promovido a Admin VIP',
    message: 'Agora pode criar e gerir os seus próprios parceiros. Aceda ao painel de administração para começar.',
    data: { promoted_by: user.id }
  })

  return NextResponse.json({ 
    success: true, 
    message: `${parceiro.full_name} foi promovido a Admin VIP`
  })
}

// DELETE - Despromover Admin VIP para parceiro
export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se é superadmin
  const { data: profile } = await service.from('profiles').select('is_superadmin').eq('id', user.id).single()
  if (!profile?.is_superadmin) {
    return NextResponse.json({ error: 'Apenas SuperAdmins podem despromover admins' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const adminId = searchParams.get('id')

  if (!adminId) {
    return NextResponse.json({ error: 'ID do admin é obrigatório' }, { status: 400 })
  }

  // Verificar se o admin existe e não é superadmin
  const { data: admin, error: adminError } = await service
    .from('profiles')
    .select('id, email, full_name, role, is_superadmin')
    .eq('id', adminId)
    .single()

  if (adminError || !admin) {
    return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
  }

  if (admin.is_superadmin) {
    return NextResponse.json({ error: 'Não pode despromover um SuperAdmin' }, { status: 400 })
  }

  if (admin.role !== 'admin') {
    return NextResponse.json({ error: 'Este utilizador não é um admin' }, { status: 400 })
  }

  // Despromover para parceiro
  const { error: updateError } = await service
    .from('profiles')
    .update({ 
      role: 'parceiro', 
      is_superadmin: false
    })
    .eq('id', adminId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Atualizar os parceiros criados por este admin - passam a ser "orfãos" (sem created_by)
  // Ou podem ser transferidos para o SuperAdmin que fez a ação
  // Por agora, mantemos como estão mas removemos a ligação
  
  return NextResponse.json({ 
    success: true, 
    message: `${admin.full_name} foi despromovido para parceiro`
  })
}
