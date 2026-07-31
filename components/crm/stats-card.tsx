import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: number
  trendLabel?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = '#0057FF',
  iconBg = '#E8F0FF',
  trend,
  trendLabel,
  className,
}: StatsCardProps) {
  const isPositive = trend !== undefined && trend >= 0

  return (
    <div className={cn('bg-card border border-border rounded-xl p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              {isPositive ? (
                <TrendingUp size={12} className="text-green-600" />
              ) : (
                <TrendingDown size={12} className="text-red-500" />
              )}
              <span className={cn('text-xs font-medium', isPositive ? 'text-green-600' : 'text-red-500')}>
                {isPositive ? '+' : ''}{trend}%
              </span>
              {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  )
}
