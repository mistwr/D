import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { NotificacoesPanel } from '@/components/crm/notificacoes-panel'

export const metadata: Metadata = { title: 'Notificações — CRM PARCENDi' }

export default async function NotificacoesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', user?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Notificações"
        description="As suas notificações e alertas"
      />
      <NotificacoesPanel notifications={notifications ?? []} />
    </div>
  )
}
