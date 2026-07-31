'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { formatCurrency, formatDate, fullName } from '@/lib/format'
import { SEGMENT_LABELS, DEAL_STAGE_LABELS, SEGMENT_COLORS } from '@/lib/constants'
import type { Segment, DealStage } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const STAGE_COLORS: Record<string, string> = {
  nova_lead: 'bg-slate-100 text-slate-700',
  contactar: 'bg-yellow-100 text-yellow-800',
  contactado: 'bg-blue-100 text-blue-700',
  documentacao_solicitada: 'bg-cyan-100 text-cyan-700',
  documentacao_recebida: 'bg-teal-100 text-teal-700',
  em_analise: 'bg-amber-100 text-amber-800',
  proposta: 'bg-orange-100 text-orange-800',
  aguardar_cliente: 'bg-red-100 text-red-700',
  contrato_fechado: 'bg-blue-100 text-blue-800',
  aguardar_comissao: 'bg-indigo-100 text-indigo-700',
  comissao_recebida: 'bg-violet-100 text-violet-700',
  fechado: 'bg-green-100 text-green-800',
  perdido: 'bg-gray-100 text-gray-600',
}

interface Deal {
  id: string
  title: string
  segment: string
  stage: string
  value: number | null
  commission_value: number | null
  created_at: string
  clients?: { name: string } | null
  profiles?: { first_name: string; last_name: string } | null
}

export function NegociosTable({ deals }: { deals: Deal[] }) {
  const [search, setSearch] = useState('')
  const [segFilter, setSegFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')

  const filtered = deals.filter((d) => {
    const q = search.toLowerCase()
    const matchSearch = !search || d.title.toLowerCase().includes(q) || d.clients?.name.toLowerCase().includes(q)
    const matchSeg = segFilter === 'all' || d.segment === segFilter
    const matchStage = stageFilter === 'all' || d.stage === stageFilter
    return matchSearch && matchSeg && matchStage
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar negócios..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={segFilter} onValueChange={(v) => v && setSegFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Segmento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(SEGMENT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={(v) => v && setStageFilter(v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Fase" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fases</SelectItem>
            {Object.entries(DEAL_STAGE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{filtered.length} negócio{filtered.length !== 1 ? 's' : ''}</p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Título', 'Cliente', 'Segmento', 'Fase', 'Valor', 'Comissão', 'Responsável', 'Data'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhum negócio encontrado</td></tr>
              ) : (
                filtered.map((deal) => (
                  <tr key={deal.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/crm/negocios/${deal.id}`} className="font-medium hover:text-brand transition-colors">
                        {deal.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{deal.clients?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{ backgroundColor: SEGMENT_COLORS[deal.segment as Segment] ?? '#999' }}
                      />
                      <span className="text-xs">{SEGMENT_LABELS[deal.segment as Segment] ?? deal.segment}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STAGE_COLORS[deal.stage] ?? 'bg-secondary text-foreground')}>
                        {DEAL_STAGE_LABELS[deal.stage as DealStage] ?? deal.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{formatCurrency(deal.value)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatCurrency(deal.commission_value)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{deal.profiles ? fullName(deal.profiles) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(deal.created_at)}</td>
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
