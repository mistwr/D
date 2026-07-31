import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { UnidadesGrid } from '@/components/crm/unidades-grid'

export const metadata: Metadata = { title: 'Unidades — CRM PARCENDi' }

export default async function UnidadesCRMPage() {
  const supabase = await createClient()

  const { data: units } = await supabase
    .from('units')
    .select(`
      id, name, code, type, city, email, phone, is_active, created_at,
      profiles!units_manager_fk (first_name, last_name)
    `)
    .order('name')

  // Count leads and deals per unit
  const { data: leadCounts } = await supabase
    .from('leads')
    .select('unit_id')
    .not('unit_id', 'is', null)

  const { data: dealCounts } = await supabase
    .from('deals')
    .select('unit_id')
    .not('unit_id', 'is', null)

  const leadsByUnit: Record<string, number> = {}
  const dealsByUnit: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((leadCounts ?? []) as any[]).forEach((l: any) => { if (l.unit_id) leadsByUnit[l.unit_id] = (leadsByUnit[l.unit_id] ?? 0) + 1 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((dealCounts ?? []) as any[]).forEach((d: any) => { if (d.unit_id) dealsByUnit[d.unit_id] = (dealsByUnit[d.unit_id] ?? 0) + 1 })

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Unidades"
        description="Rede de unidades e agências PARCENDi"
      />
      <UnidadesGrid units={units ?? []} leadsByUnit={leadsByUnit} dealsByUnit={dealsByUnit} />
    </div>
  )
}
