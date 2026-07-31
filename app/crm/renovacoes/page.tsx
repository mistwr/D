import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { RenovacoesTable } from '@/components/crm/renovacoes-table'

export const metadata: Metadata = { title: 'Renovações — CRM PARCENDi' }

export default async function RenovacoesPage() {
  const supabase = await createClient()

  const { data: renewals } = await supabase
    .from('renewals')
    .select(`
      id, segment, status, contract_end_date, renewal_date, notified_30d, notified_60d, created_at,
      clients!renewals_client_id_fkey (name),
      deals!renewals_deal_id_fkey (title),
      profiles!renewals_assigned_to_fkey (first_name, last_name)
    `)
    .order('contract_end_date', { ascending: true })

  const today = new Date()
  const in30 = new Date(today); in30.setDate(today.getDate() + 30)
  const in60 = new Date(today); in60.setDate(today.getDate() + 60)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcomingSoon = ((renewals ?? []) as any[]).filter((r: any) => {
    const d = new Date(r.contract_end_date)
    return d >= today && d <= in30
  }).length

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Renovações"
        description={
          upcomingSoon > 0
            ? `${upcomingSoon} contrato${upcomingSoon !== 1 ? 's' : ''} a renovar nos próximos 30 dias`
            : 'Gestão de renovações de contratos'
        }
      />
      <RenovacoesTable renewals={renewals ?? []} />
    </div>
  )
}
