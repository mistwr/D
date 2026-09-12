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
      parcendi_profiles!parcendi_clients_assigned_to_fkey (first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  const normalized = (clients ?? []).map((client: any) => ({ ...client, profiles: client.parcendi_profiles ?? null }))

  return (
    <div className="min-w-0 p-4 pt-20 sm:p-6 md:pt-6 lg:p-8">
      <PageHeader title="Clientes" description={`${normalized.length} clientes registados`} action={<NewClienteButton />} />
      <ClientesTable clients={normalized} />
    </div>
  )
}
