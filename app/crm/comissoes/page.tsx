import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { ComissoesTable } from '@/components/crm/comissoes-table'
import { StatsCard } from '@/components/crm/stats-card'
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

export const metadata: Metadata = { title: 'Comissões — CRM PARCENDi' }

export default async function ComissoesPage() {
  const supabase = await createClient()

  const { data: commissions } = await supabase
    .from('commissions')
    .select(`
      id, gross_value, net_value, percentage, status, origin, created_at, paid_at,
      deals!commissions_deal_id_fkey (title, segment),
      profiles!commissions_profile_id_fkey (first_name, last_name)
    `)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = (commissions ?? []) as any[]
  const totalPaid = all.filter((c: any) => c.status === 'paga').reduce((s: number, c: any) => s + (c.net_value ?? 0), 0)
  const totalValidated = all.filter((c: any) => c.status === 'validada').reduce((s: number, c: any) => s + (c.net_value ?? 0), 0)
  const totalPrevista = all.filter((c: any) => c.status === 'prevista').reduce((s: number, c: any) => s + (c.net_value ?? 0), 0)
  const totalAll = all.reduce((s: number, c: any) => s + (c.net_value ?? 0), 0)

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Comissões"
        description="Acompanhamento de comissões por negócio"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Acumulado" value={formatCurrency(totalAll)} icon={DollarSign} iconColor="#0057FF" iconBg="#E8F0FF" />
        <StatsCard title="Pagas" value={formatCurrency(totalPaid)} icon={CheckCircle} iconColor="#10B981" iconBg="#ECFDF5" />
        <StatsCard title="Validadas" value={formatCurrency(totalValidated)} icon={TrendingUp} iconColor="#F59E0B" iconBg="#FFFBEB" />
        <StatsCard title="Previstas" value={formatCurrency(totalPrevista)} icon={Clock} iconColor="#8B5CF6" iconBg="#F5F3FF" />
      </div>

      <ComissoesTable commissions={all} />
    </div>
  )
}
