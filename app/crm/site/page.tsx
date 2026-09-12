import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { SiteManagerV2 } from '@/components/crm/site-manager-v2'

export const metadata: Metadata = { title: 'Site e Branding — CRM PARCENDi' }

const ADMIN_ROLES = ['superadmin', 'admin', 'ceo', 'direcao']

export default async function SiteAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active || !ADMIN_ROLES.includes(profile.role)) {
    redirect('/crm/dashboard')
  }

  const [{ data: settings }, { data: campaigns }] = await Promise.all([
    (supabase.from('site_settings') as any).select('*').eq('id', 'main').maybeSingle(),
    (supabase.from('site_campaigns') as any).select('*').order('position').order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-4 pt-20 sm:p-6 md:pt-6 lg:p-8">
      <PageHeader
        title="Site e Branding"
        description="Gere cores, logótipo, conteúdos, campanhas e integrações sem mexer no código"
      />
      <SiteManagerV2 settings={settings ?? null} campaigns={campaigns ?? []} userId={user.id} />
    </div>
  )
}
