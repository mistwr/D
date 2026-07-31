import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { DocumentosTable } from '@/components/crm/documentos-table'

export const metadata: Metadata = { title: 'Documentos — CRM PARCENDi' }

export default async function DocumentosPage() {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('documents')
    .select(`
      id, name, file_type, file_size, status, expires_at, created_at,
      clients!documents_client_id_fkey (name),
      deals!documents_deal_id_fkey (title),
      profiles!documents_uploaded_by_fkey (first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Documentos"
        description="Gestão documental de clientes e negócios"
      />
      <DocumentosTable documents={documents ?? []} />
    </div>
  )
}
