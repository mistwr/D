import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { LeadsTable } from '@/components/crm/leads-table'
import { NewLeadButton } from '@/components/crm/new-lead-button'

export const metadata: Metadata = { title: 'Leads — CRM PARCENDi' }

export default async function LeadsPage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      profiles!leads_assigned_to_fkey(first_name, last_name),
      units(name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('is_active', true)

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Leads"
        description="Gestão de todas as leads por segmento"
        action={<NewLeadButton profiles={profiles ?? []} />}
      />
      <LeadsTable leads={leads ?? []} />
    </div>
  )
}
