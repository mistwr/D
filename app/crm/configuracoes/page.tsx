import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/crm/page-header'
import { ConfiguracoesPanel } from '@/components/crm/configuracoes-panel'
import { Settings2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Configurações — CRM PARCENDi' }
const ADMIN_ROLES = ['superadmin', 'admin', 'ceo', 'direcao']

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, configsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('commission_configs').select('*').eq('is_active', true).order('segment').order('role'),
  ])

  const isAdmin = Boolean(profileRes.data?.role && ADMIN_ROLES.includes(profileRes.data.role))

  return (
    <div className="p-4 pt-20 sm:p-6 md:pt-6 lg:p-8">
      <PageHeader title="Configurações" description="Perfil, comissões e autonomia do CRM" />

      {isAdmin && (
        <Link href="/crm/configuracoes/pipelines" className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-brand/50 hover:bg-secondary/30 sm:p-5">
          <div>
            <p className="font-semibold">Configurar pipelines</p>
            <p className="mt-1 text-sm text-muted-foreground">Criar, renomear, ordenar e alterar as cores das etapas de cada área.</p>
          </div>
          <Settings2 className="ml-4 shrink-0 text-brand" size={22} />
        </Link>
      )}

      <ConfiguracoesPanel profile={profileRes.data} commissionConfigs={configsRes.data ?? []} />
    </div>
  )
}
