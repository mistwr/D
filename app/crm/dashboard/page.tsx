import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { StatsCard } from '@/components/crm/stats-card'
import { DashboardCharts } from '@/components/crm/dashboard-charts'
import { RecentActivity } from '@/components/crm/recent-activity'
import { Users, GitBranch, DollarSign, CheckSquare, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

export const metadata: Metadata = { title: 'Dashboard — CRM PARCENDi' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const [leadsResult, dealsResult, commissionsResult, tasksResult] = await Promise.all([
    supabase.from('leads').select('id, segment, status, created_at', { count: 'exact' }),
    supabase.from('deals').select('id, segment, stage, value, commission_value, created_at', { count: 'exact' }),
    supabase.from('commissions').select('net_value, status'),
    supabase.from('tasks').select('id, status', { count: 'exact' }).eq('status', 'pendente'),
  ])

  const leads = (leadsResult.data ?? []) as any[]
  const deals = (dealsResult.data ?? []) as any[]
  const commissions = (commissionsResult.data ?? []) as any[]
  const pendingTasksCount = tasksResult.count ?? 0

  const totalLeads = leadsResult.count ?? 0
  const totalDeals = dealsResult.count ?? 0
  const closedDeals = deals.filter((d: any) => d.stage === 'fechado').length
  const totalCommissions = commissions
    .filter((c: any) => c.status === 'paga' || c.status === 'validada')
    .reduce((s: number, c: any) => s + (c.net_value ?? 0), 0)

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <PageHeader title="Dashboard" description="Visão geral do CRM PARCENDi" />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:mb-8 lg:grid-cols-4">
        <StatsCard title="Total de Leads" value={totalLeads} icon={Users} iconColor="#0057FF" iconBg="#E8F0FF" trend={12} trendLabel="vs. mês anterior" />
        <StatsCard title="Negócios Ativos" value={totalDeals} icon={GitBranch} iconColor="#10B981" iconBg="#ECFDF5" trend={8} trendLabel="vs. mês anterior" />
        <StatsCard title="Negócios Fechados" value={closedDeals} icon={TrendingUp} iconColor="#F59E0B" iconBg="#FFFBEB" trend={5} trendLabel="vs. mês anterior" />
        <StatsCard title="Comissões Acumuladas" value={formatCurrency(totalCommissions)} icon={DollarSign} iconColor="#8B5CF6" iconBg="#F5F3FF" />
      </div>

      {pendingTasksCount > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:items-center">
          <CheckSquare size={18} className="mt-0.5 shrink-0 text-amber-600 sm:mt-0" />
          <p className="text-sm leading-5 text-amber-800">
            Tem <strong>{pendingTasksCount}</strong> {pendingTasksCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'}.{' '}
            <a href="/crm/tarefas" className="font-medium underline">Ver tarefas</a>
          </p>
        </div>
      )}

      <div className="grid min-w-0 gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="min-w-0 lg:col-span-2"><DashboardCharts leads={leads} deals={deals} /></div>
        <div className="min-w-0"><RecentActivity leads={leads.slice(0, 8)} deals={deals.slice(0, 8)} /></div>
      </div>
    </div>
  )
}
