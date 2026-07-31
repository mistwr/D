import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { ParceirosTable } from '@/components/crm/parceiros-table'
import { NewParceiroButton } from '@/components/crm/new-parceiro-button'

export const metadata: Metadata = { title: 'Parceiros — CRM PARCENDi' }

export default async function ParceirosPage() {
  const supabase = await createClient()

  const [partnersRes, unitsRes] = await Promise.all([
    supabase
      .from('partners')
      .select(`id, name, email, phone, type, nif, commission_rate, is_active, created_at,
        units!partners_unit_id_fkey (name)`)
      .order('created_at', { ascending: false }),
    supabase.from('units').select('id, name').eq('is_active', true),
  ])

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Parceiros"
        description="Rede de parceiros e agentes"
        action={<NewParceiroButton units={unitsRes.data ?? []} />}
      />
      <ParceirosTable partners={partnersRes.data ?? []} />
    </div>
  )
}
