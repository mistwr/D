import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { UtilizadoresPanel } from '@/components/crm/utilizadores-panel'
import { ADMIN_ROLES } from '@/lib/constants'
import type { UserRole } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Utilizadores e Permissões — CRM PARCENDi' }

export default async function UtilizadoresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const callerRole = (caller as { role: UserRole } | null)?.role
  if (!callerRole || !ADMIN_ROLES.includes(callerRole)) {
    redirect('/crm/dashboard')
  }

  const [usersRes, unitsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, unit_id, phone, is_active, created_at')
      .neq('role', 'superadmin')
      .order('created_at', { ascending: false }),
    supabase.from('units').select('id, name').eq('is_active', true).order('name'),
  ])

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Utilizadores e Permissões"
        description="Crie contas, atribua cargos e associe utilizadores a unidades"
      />
      <UtilizadoresPanel
        users={usersRes.data ?? []}
        units={unitsRes.data ?? []}
        callerRole={callerRole}
      />
    </div>
  )
}
