import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { NegociosTable } from '@/components/crm/negocios-table'
import { NewNegocioButton } from '@/components/crm/new-negocio-button'

export const metadata: Metadata = { title: 'Negócios — CRM PARCENDi' }

export default async function NegociosPage() {
  const supabase = await createClient()

  const [dealsRes, clientsRes, profilesRes] = await Promise.all([
    supabase
      .from('deals')
      .select(`
        id, title, segment, stage, value, commission_value, created_at,
        clients!deals_client_id_fkey (id, name),
        profiles!deals_assigned_to_fkey (first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('clients').select('id, name').eq('is_active', true).limit(500),
    supabase.from('profiles').select('id, first_name, last_name').eq('is_active', true),
  ])

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Negócios"
        description="Todos os negócios em curso e fechados"
        action={<NewNegocioButton clients={clientsRes.data ?? []} profiles={profilesRes.data ?? []} />}
      />
      <NegociosTable deals={dealsRes.data ?? []} />
    </div>
  )
}
