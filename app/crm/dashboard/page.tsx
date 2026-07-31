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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leads = (leadsResult.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deals = (dealsResult.data ?? []) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commissions = (commissionsResult.data ?? []) as any[]
  const pendingTasksCount = tasksResult.count ?? 0

  const totalLeads = leadsResult.count ?? 0
  const totalDeals = dealsResult.count ?? 0
  const closedDeals = deals.filter((d: any) => d.stage === 'fechado').length
  const totalCommissions = commissions
    .filter((c: any) => c.status === 'paga' || c.status === 'validada')
    .reduce((s: number, c: any) => s + (c.net_value ?? 0), 0)

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Dashboard"
        description="Visão geral do CRM PARCENDi"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total de Leads"
          value={totalLeads}
          icon={Users}
          iconColor="#0057FF"
          iconBg="#E8F0FF"
          trend={12}
          trendLabel="vs. mês anterior"
        />
        <StatsCard
          title="Negócios Ativos"
          value={totalDeals}
          icon={GitBranch}
          iconColor="#10B981"
          iconBg="#ECFDF5"
          trend={8}
          trendLabel="vs. mês anterior"
        />
        <StatsCard
          title="Negócios Fechados"
          value={closedDeals}
          icon={TrendingUp}
          iconColor="#F59E0B"
          iconBg="#FFFBEB"
          trend={5}
          trendLabel="vs. mês anterior"
        />
        <StatsCard
          title="Comissões Acumuladas"
          value={formatCurrency(totalCommissions)}
          icon={DollarSign}
          iconColor="#8B5CF6"
          iconBg="#F5F3FF"
        />
      </div>

      {/* Pending tasks alert */}
      {pendingTasksCount > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <CheckSquare size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            Tem <strong>{pendingTasksCount}</strong> {pendingTasksCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'}.{' '}
            <a href="/crm/tarefas" className="underline font-medium">Ver tarefas</a>
          </p>
        </div>
      )}

      {/* Charts & Recent */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts leads={leads} deals={deals} />
        </div>
        <div>
          <RecentActivity leads={leads.slice(0, 8)} deals={deals.slice(0, 8)} />
        </div>
      </div>
    </div>
  )
}
