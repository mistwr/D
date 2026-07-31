'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ADMIN_ROLES } from '@/lib/constants'
import type { UserRole } from '@/lib/supabase/types'

type ActionResult = { ok: true } | { ok: false; error: string }

const ALL_ROLES: UserRole[] = [
  'superadmin', 'admin', 'ceo', 'direcao', 'operadora',
  'especialista', 'unidade', 'franquia', 'parceiro',
]

// Ensure the caller is an admin-level user. Returns the caller profile or null.
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
  return profile as { id: string; role: UserRole }
}

// Only superadmin/admin may assign the two most privileged roles.
function canAssignRole(callerRole: UserRole, targetRole: UserRole) {
  if (targetRole === 'superadmin' || targetRole === 'admin') {
    return callerRole === 'superadmin' || callerRole === 'admin'
  }
  return true
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
  const caller = await requireAdmin()
  if (!caller) return { ok: false, error: 'Sem permissões para esta ação.' }

  if (!input.email.trim() || !input.password || !input.first_name.trim()) {
    return { ok: false, error: 'Nome, email e password são obrigatórios.' }
  }
  if (!ALL_ROLES.includes(input.role)) return { ok: false, error: 'Cargo inválido.' }
  if (!canAssignRole(caller.role, input.role)) {
    return { ok: false, error: 'Não tem permissão para atribuir este cargo.' }
  }

  const admin = createAdminClient()

  // Create the auth user with confirmed email.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
    user_metadata: { first_name: input.first_name.trim(), last_name: input.last_name.trim() },
  })
  if (createErr || !created.user) {
    return { ok: false, error: createErr?.message ?? 'Erro ao criar utilizador.' }
  }

  // Upsert the profile with role/unit (the trigger may have created a base row).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileErr } = await (admin.from('profiles') as any).upsert({
    id: created.user.id,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    email: input.email.trim(),
    phone: input.phone,
    role: input.role,
    unit_id: input.unit_id,
    is_active: true,
  }, { onConflict: 'id' })

  if (profileErr) {
    // Roll back the auth user so we don't leave an orphan.
    await admin.auth.admin.deleteUser(created.user.id)
    return { ok: false, error: profileErr.message }
  }

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
  const caller = await requireAdmin()
  if (!caller) return { ok: false, error: 'Sem permissões para esta ação.' }
  if (!canAssignRole(caller.role, input.role)) {
    return { ok: false, error: 'Não tem permissão para atribuir este cargo.' }
  }
  // Non-superadmins cannot demote/lock a superadmin.
  const admin = createAdminClient()
  const { data: target } = await admin.from('profiles').select('role').eq('id', input.id).single()
  if (target && (target as { role: UserRole }).role === 'superadmin' && caller.role !== 'superadmin') {
    return { ok: false, error: 'Apenas um Super Admin pode alterar outro Super Admin.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('profiles') as any).update({
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    role: input.role,
    unit_id: input.unit_id,
    phone: input.phone,
    is_active: input.is_active,
  }).eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/crm/utilizadores')
  return { ok: true }
}

export async function resetUserPassword(input: { id: string; password: string }): Promise<ActionResult> {
  const caller = await requireAdmin()
  if (!caller) return { ok: false, error: 'Sem permissões para esta ação.' }
  if (!input.password) return { ok: false, error: 'Password inválida.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(input.id, { password: input.password })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/crm/utilizadores')
  return { ok: true }
}

export async function toggleUserActive(input: { id: string; is_active: boolean }): Promise<ActionResult> {
  const caller = await requireAdmin()
  if (!caller) return { ok: false, error: 'Sem permissões para esta ação.' }

  const admin = createAdminClient()
  const { data: target } = await admin.from('profiles').select('role').eq('id', input.id).single()
  if (target && (target as { role: UserRole }).role === 'superadmin' && caller.role !== 'superadmin') {
    return { ok: false, error: 'Apenas um Super Admin pode alterar outro Super Admin.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('profiles') as any).update({ is_active: input.is_active }).eq('id', input.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/crm/utilizadores')
  return { ok: true }
}
