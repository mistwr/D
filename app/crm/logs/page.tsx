import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/crm/page-header'
import { AuditLogsTable } from '@/components/crm/audit-logs-table'

export const metadata: Metadata = { title: 'Audit Logs — CRM PARCENDi' }

export default async function LogsPage() {
  const supabase = await createClient()

  // Only admins can view logs
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!profile || !['superadmin', 'admin', 'ceo', 'direcao'].includes((profile as any).role)) {
    redirect('/crm/dashboard')
  }

  const { data: logs } = await supabase
    .from('audit_logs')
    .select(`
      id, action, table_name, record_id, old_data, new_data, created_at,
      profiles!audit_logs_profile_id_fkey (first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Audit Logs"
        description="Registo de todas as ações no sistema"
      />
      <AuditLogsTable logs={logs ?? []} />
    </div>
  )
}
