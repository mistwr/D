import Link from 'next/link'
import { Users, GitBranch } from 'lucide-react'
import { formatRelative } from '@/lib/format'
import { SEGMENT_LABELS, DEAL_STAGE_LABELS } from '@/lib/constants'
import type { Segment, DealStage } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface Props {
  leads: { id: string; segment: string; created_at: string; status: string; name?: string }[]
  deals: { id: string; segment: string; stage: string; title?: string; created_at: string }[]
}

export function RecentActivity({ leads, deals }: Props) {
  const activities = [
    ...leads.map((l) => ({
      id: l.id,
      type: 'lead' as const,
      label: 'Nova lead',
      sublabel: SEGMENT_LABELS[l.segment as Segment] ?? l.segment,
      date: l.created_at,
      href: `/crm/leads`,
    })),
    ...deals.map((d) => ({
      id: d.id,
      type: 'deal' as const,
      label: 'Negócio',
      sublabel: DEAL_STAGE_LABELS[d.stage as DealStage] ?? d.stage,
      date: d.created_at,
      href: `/crm/negocios`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Atividade Recente</h3>
        <Link href="/crm/leads" className="text-xs text-brand hover:underline">Ver tudo</Link>
      </div>
      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((a) => (
            <Link key={`${a.type}-${a.id}`} href={a.href} className="flex items-start gap-3 group">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                a.type === 'lead' ? 'bg-blue-100' : 'bg-green-100',
              )}>
                {a.type === 'lead'
                  ? <Users size={13} className="text-blue-600" />
                  : <GitBranch size={13} className="text-green-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium group-hover:text-brand transition-colors">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.sublabel}</p>
              </div>
              <p className="text-xs text-muted-foreground shrink-0">{formatRelative(a.date)}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Sem atividade recente</p>
      )}
    </div>
  )
}
