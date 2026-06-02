import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/supabase/get-auth-user'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se e admin
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin === true
  if (!isAdmin) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const isSuperAdmin = profile?.is_superadmin === true
  const isAdminVIP = isAdmin && !isSuperAdmin

  const body = await req.json()
  const { parceiro_id, is_admin_vip, pode_criar_estrutura, pode_criar_parceiros } = body

  if (!parceiro_id) {
    return NextResponse.json({ error: 'parceiro_id obrigatorio' }, { status: 400 })
  }

  // Admin VIP so pode editar parceiros que ele criou
  if (isAdminVIP) {
    const { data: targetUser } = await service.from('profiles').select('created_by').eq('id', parceiro_id).single()
    if (targetUser?.created_by !== user.id) {
      return NextResponse.json({ error: 'Sem permissao para editar este parceiro' }, { status: 403 })
    }
    // Admin VIP nao pode dar is_admin_vip, apenas pode_criar_estrutura e pode_criar_parceiros
    if (typeof is_admin_vip === 'boolean') {
      return NextResponse.json({ error: 'Apenas SuperAdmin pode promover a Admin VIP' }, { status: 403 })
    }
  }

  // Construir objeto de update apenas com campos enviados
  const updates: Record<string, boolean> = {}
  if (typeof is_admin_vip === 'boolean') updates.is_admin_vip = is_admin_vip
  if (typeof pode_criar_estrutura === 'boolean') updates.pode_criar_estrutura = pode_criar_estrutura
  if (typeof pode_criar_parceiros === 'boolean') updates.pode_criar_parceiros = pode_criar_parceiros

  // Se is_admin_vip for true, tambem atualizar o role para admin
  // Se for false, voltar para parceiro
  if (typeof is_admin_vip === 'boolean') {
    if (is_admin_vip) {
      // Promover a admin (mas nao superadmin)
      Object.assign(updates, { role: 'admin' })
    } else {
      // Despromover para parceiro
      Object.assign(updates, { role: 'parceiro' })
    }
  }

  const { data, error } = await service
    .from('profiles')
    .update(updates)
    .eq('id', parceiro_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, profile: data })
}
