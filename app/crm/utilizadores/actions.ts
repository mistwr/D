'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_ROLES } from '@/lib/constants'
import type { UserRole } from '@/lib/supabase/types'

type ActionResult = { ok: true } | { ok: false; error: string }

const ALL_ROLES: UserRole[] = [
  'superadmin', 'admin', 'ceo', 'direcao', 'operadora',
  'especialista', 'unidade', 'franquia', 'parceiro',
]

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()
  if (!profile || !ADMIN_ROLES.includes((profile as { role: UserRole }).role)) return null
  return { supabase, profile: profile as { id: string; role: UserRole } }
}

function canAssignRole(callerRole: UserRole, targetRole: UserRole) {
  if (targetRole === 'superadmin' || targetRole === 'admin') {
    return callerRole === 'superadmin' || callerRole === 'admin'
  }
  return true
}

async function invokeAdmin(body: Record<string, unknown>): Promise<ActionResult> {
  const ctx = await requireAdmin()
  if (!ctx) return { ok: false, error: 'Sem permissões para esta ação.' }

  const { data, error } = await ctx.supabase.functions.invoke('parcendi-admin-users', { body })
  if (error) return { ok: false, error: error.message || 'Erro ao executar a ação.' }
  if (data?.error) return { ok: false, error: String(data.error) }

  revalidatePath('/crm/utilizadores')
  return { ok: true }
}

export async function createUser(input: {
  first_name: string
  last_name: string
  email: string
  password: string
  role: UserRole
  unit_id: string | null
  phone: string | null
}): Promise<ActionResult> {
  const ctx = await requireAdmin()
  if (!ctx) return { ok: false, error: 'Sem permissões para esta ação.' }
  if (!input.email.trim() || !input.password || !input.first_name.trim() || !input.last_name.trim()) {
    return { ok: false, error: 'Nome, apelido, email e password são obrigatórios.' }
  }
  if (input.password.length < 8) return { ok: false, error: 'A password inicial deve ter pelo menos 8 caracteres.' }
  if (!ALL_ROLES.includes(input.role)) return { ok: false, error: 'Cargo inválido.' }
  if (!canAssignRole(ctx.profile.role, input.role)) return { ok: false, error: 'Não tem permissão para atribuir este cargo.' }

  const { data, error } = await ctx.supabase.functions.invoke('parcendi-admin-users', {
    body: { action: 'create', ...input },
  })
  if (error) return { ok: false, error: error.message || 'Erro ao criar utilizador.' }
  if (data?.error) return { ok: false, error: String(data.error) }
  revalidatePath('/crm/utilizadores')
  return { ok: true }
}

export async function updateUser(input: {
  id: string
  first_name: string
  last_name: string
  role: UserRole
  unit_id: string | null
  phone: string | null
  is_active: boolean
}): Promise<ActionResult> {
  const ctx = await requireAdmin()
  if (!ctx) return { ok: false, error: 'Sem permissões para esta ação.' }
  if (!canAssignRole(ctx.profile.role, input.role)) return { ok: false, error: 'Não tem permissão para atribuir este cargo.' }
  return invokeAdmin({ action: 'update', ...input })
}

export async function resetUserPassword(input: { id: string; password: string }): Promise<ActionResult> {
  if (!input.password || input.password.length < 8) return { ok: false, error: 'A nova password deve ter pelo menos 8 caracteres.' }
  return invokeAdmin({ action: 'set_password', ...input })
}

export async function toggleUserActive(input: { id: string; is_active: boolean }): Promise<ActionResult> {
  return invokeAdmin({ action: 'update', ...input })
}
