'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate, fullName } from '@/lib/format'
import { SEGMENT_LABELS } from '@/lib/constants'
import type { Segment, RenewalStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { Bell, BellOff } from 'lucide-react'

const RENEWAL_STATUS: Record<RenewalStatus, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  proximo: { label: 'Próximo', color: 'bg-amber-100 text-amber-700' },
  em_renovacao: { label: 'Em Renovação', color: 'bg-blue-100 text-blue-700' },
  renovado: { label: 'Renovado', color: 'bg-teal-100 text-teal-700' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500' },
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

interface Renewal {
  id: string
  segment: string
  status: string
  contract_end_date: string
  renewal_date: string | null
  notified_30d: boolean | null
  notified_60d: boolean | null
  created_at: string
  clients?: { name: string } | null
  deals?: { title: string } | null
  profiles?: { first_name: string; last_name: string } | null
}

export function RenovacoesTable({ renewals }: { renewals: Renewal[] }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [segFilter, setSegFilter] = useState('all')

  const filtered = renewals.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchSeg = segFilter === 'all' || r.segment === segFilter
    return matchStatus && matchSeg
  })

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <Select value={segFilter} onValueChange={(v) => v && setSegFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Segmento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(SEGMENT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.keys(RENEWAL_STATUS).map((v) => <SelectItem key={v} value={v}>{RENEWAL_STATUS[v as RenewalStatus].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground flex items-center">{filtered.length} renovaç{filtered.length !== 1 ? 'ões' : 'ão'}</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Cliente', 'Segmento', 'Fim Contrato', 'Dias', 'Estado', 'Notif. 30d', 'Notif. 60d', 'Responsável'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhuma renovação encontrada</td></tr>
              ) : (
                filtered.map((r) => {
                  const days = daysUntil(r.contract_end_date)
                  const st = RENEWAL_STATUS[r.status as RenewalStatus]
                  const urgent = days >= 0 && days <= 30
                  return (
                    <tr key={r.id} className={cn('hover:bg-secondary/50 transition-colors', urgent && 'bg-amber-50/30')}>
                      <td className="px-4 py-3 font-medium">{r.clients?.name ?? r.deals?.title ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{SEGMENT_LABELS[r.segment as Segment] ?? r.segment}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={cn(urgent ? 'text-amber-700 font-semibold' : 'text-muted-foreground')}>
                          {formatDate(r.contract_end_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs font-medium',
                          days < 0 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-muted-foreground',
                        )}>
                          {days < 0 ? `Expirado há ${Math.abs(days)}d` : `${days}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', st?.color ?? 'bg-secondary text-foreground')}>
                          {st?.label ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.notified_30d
                          ? <Bell size={14} className="text-green-500" />
                          : <BellOff size={14} className="text-muted-foreground" />}
                      </td>
                      <td className="px-4 py-3">
                        {r.notified_60d
                          ? <Bell size={14} className="text-green-500" />
                          : <BellOff size={14} className="text-muted-foreground" />}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.profiles ? fullName(r.profiles) : '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
