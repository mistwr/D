'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { formatCurrency, formatDate, formatPercent, fullName } from '@/lib/format'
import { COMMISSION_STATUS_LABELS, SEGMENT_LABELS } from '@/lib/constants'
import type { CommissionStatus, Segment } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<CommissionStatus, string> = {
  prevista: 'bg-slate-100 text-slate-700',
  parceiro: 'bg-violet-100 text-violet-700',
  recebida: 'bg-blue-100 text-blue-700',
  validada: 'bg-amber-100 text-amber-700',
  paga: 'bg-green-100 text-green-800',
  cancelada: 'bg-gray-100 text-gray-500',
}

interface Commission {
  id: string
  gross_value: number
  net_value: number
  percentage: number
  status: string
  origin: string | null
  created_at: string
  paid_at: string | null
  deals?: { title: string; segment: string } | null
  profiles?: { first_name: string; last_name: string } | null
}

export function ComissoesTable({ commissions }: { commissions: Commission[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = commissions.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      c.deals?.title.toLowerCase().includes(q) ||
      (c.profiles && fullName(c.profiles).toLowerCase().includes(q))
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar comissões..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(COMMISSION_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{filtered.length} comissão{filtered.length !== 1 ? 'ões' : ''}</p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Negócio', 'Especialista', 'Segmento', 'Bruto', 'Líquido', '%', 'Estado', 'Data Pagamento'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhuma comissão encontrada</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{c.deals?.title ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.profiles ? fullName(c.profiles) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.deals?.segment ? SEGMENT_LABELS[c.deals.segment as Segment] : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{formatCurrency(c.gross_value)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-brand">{formatCurrency(c.net_value)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatPercent(c.percentage)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[c.status as CommissionStatus] ?? 'bg-secondary text-foreground')}>
                        {COMMISSION_STATUS_LABELS[c.status as CommissionStatus] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.paid_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
