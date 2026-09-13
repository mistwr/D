import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { SofiaLiveCoach } from '@/components/crm/sofia-live-coach'

export const metadata: Metadata = { title: 'Sofia em Direto — CRM PARCENDi' }

export default async function SofiaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,is_active')
    .eq('id', user.id)
    .single()

  if (!profile?.is_active) redirect('/auth/login')

  return (
    <div className="p-4 pt-20 sm:p-6 md:pt-6 lg:p-8">
      <PageHeader
        title="Sofia em Direto"
        description="Transcrição e coaching comercial em tempo real durante a chamada"
      />
      <SofiaLiveCoach />
    </div>
  )
}
