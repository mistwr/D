'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { formatCurrency, formatDate, fullName } from '@/lib/format'
import { SEGMENT_LABELS } from '@/lib/constants'
import type { Segment, CrossSellStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const CS_STATUS: Record<CrossSellStatus, { label: string; color: string }> = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-700' },
  em_progresso: { label: 'Em Progresso', color: 'bg-amber-100 text-amber-700' },
  convertido: { label: 'Convertido', color: 'bg-green-100 text-green-800' },
  perdido: { label: 'Perdido', color: 'bg-gray-100 text-gray-500' },
}

interface CrossSell {
  id: string
  segment: string
  status: string
  potential_value: number | null
  notes: string | null
  created_at: string
  clients?: { name: string } | null
  profiles?: { first_name: string; last_name: string } | null
}

export function CrossSellTable({ crossSells }: { crossSells: CrossSell[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = crossSells.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !search || c.clients?.name.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.keys(CS_STATUS).map((v) => <SelectItem key={v} value={v}>{CS_STATUS[v as CrossSellStatus].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{filtered.length} oportunidade{filtered.length !== 1 ? 's' : ''}</p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Cliente', 'Segmento', 'Estado', 'Valor Potencial', 'Responsável', 'Data'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Sem oportunidades de cross-sell</td></tr>
              ) : (
                filtered.map((cs) => {
                  const s = CS_STATUS[cs.status as CrossSellStatus]
                  return (
                    <tr key={cs.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{cs.clients?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{SEGMENT_LABELS[cs.segment as Segment] ?? cs.segment}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', s?.color ?? 'bg-secondary text-foreground')}>
                          {s?.label ?? cs.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{formatCurrency(cs.potential_value)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{cs.profiles ? fullName(cs.profiles) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(cs.created_at)}</td>
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
