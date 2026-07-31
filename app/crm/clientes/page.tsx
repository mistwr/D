import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { ClientesTable } from '@/components/crm/clientes-table'
import { NewClienteButton } from '@/components/crm/new-cliente-button'

export const metadata: Metadata = { title: 'Clientes — CRM PARCENDi' }

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id, name, email, phone, nif, city, rgpd_consent, is_active, created_at,
      profiles!clients_assigned_to_fkey (first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  const { count: dealsCount } = await supabase
    .from('deals')
    .select('client_id', { count: 'exact', head: true })

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Clientes"
        description={`${clients?.length ?? 0} clientes registados`}
        action={<NewClienteButton />}
      />
      <ClientesTable clients={clients ?? []} />
    </div>
  )
}
