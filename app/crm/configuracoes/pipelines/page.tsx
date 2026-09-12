import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { PipelineManager } from '@/components/crm/pipeline-manager'

export const metadata: Metadata = { title: 'Pipelines — CRM PARCENDi' }
const ADMIN_ROLES = ['superadmin', 'admin', 'ceo', 'direcao']

export default async function PipelineSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).single()
  if (!profile || !profile.is_active || !ADMIN_ROLES.includes(profile.role)) redirect('/crm/dashboard')

  const { data: stages } = await supabase.from('pipeline_stages').select('*').order('segment').order('position')

  return (
    <div className="p-4 pt-20 sm:p-6 md:pt-6 lg:p-8">
      <PageHeader title="Pipelines" description="Configura as etapas, cores e estados finais de cada área" />
      <PipelineManager initialStages={stages ?? []} />
    </div>
  )
}
