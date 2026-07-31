import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { CrossSellTable } from '@/components/crm/cross-sell-table'
import { NewCrossSellButton } from '@/components/crm/new-cross-sell-button'

export const metadata: Metadata = { title: 'Cross-sell — CRM PARCENDi' }

export default async function CrossSellPage() {
  const supabase = await createClient()

  const [csRes, clientsRes] = await Promise.all([
    supabase
      .from('cross_sells')
      .select(`
        id, segment, status, potential_value, notes, created_at,
        clients!cross_sells_client_id_fkey (name),
        profiles!cross_sells_assigned_to_fkey (first_name, last_name)
      `)
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').eq('is_active', true).limit(500),
  ])

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Cross-sell"
        description="Oportunidades de venda cruzada entre segmentos"
        action={<NewCrossSellButton clients={clientsRes.data ?? []} />}
      />
      <CrossSellTable crossSells={csRes.data ?? []} />
    </div>
  )
}
