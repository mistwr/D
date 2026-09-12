'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, CalendarDays, UserRound } from 'lucide-react'
import { formatCurrency, formatDate, fullName } from '@/lib/format'
import { SEGMENT_LABELS, DEAL_STAGE_LABELS, SEGMENT_COLORS } from '@/lib/constants'
import type { Segment, DealStage } from '@/lib/supabase/types'

interface Deal {
  id: string; title: string; segment: string; stage: string; value: number | null; commission_value: number | null; created_at: string
  clients?: { name: string } | null
  profiles?: { first_name: string; last_name: string } | null
}

function stageLabel(stage: string) {
  return DEAL_STAGE_LABELS[stage as DealStage] ?? stage
}

export function NegociosTable({ deals }: { deals: Deal[] }) {
  const [search, setSearch] = useState('')
  const [segFilter, setSegFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const stages = Array.from(new Set(deals.map((d) => d.stage).filter(Boolean)))

  const filtered = deals.filter((d) => {
    const q = search.toLowerCase()
    const matchSearch = !search || d.title.toLowerCase().includes(q) || d.clients?.name?.toLowerCase().includes(q)
    return matchSearch && (segFilter === 'all' || d.segment === segFilter) && (stageFilter === 'all' || d.stage === stageFilter)
  })

  return (
    <div className="min-w-0">
      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px_190px] sm:gap-3">
        <div className="relative min-w-0"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Pesquisar negócios..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 pl-9 sm:h-10" /></div>
        <Select value={segFilter} onValueChange={(v) => v && setSegFilter(v)}><SelectTrigger className="h-11 w-full sm:h-10"><SelectValue placeholder="Segmento" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{Object.entries(SEGMENT_LABELS).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
        <Select value={stageFilter} onValueChange={(v) => v && setStageFilter(v)}><SelectTrigger className="h-11 w-full sm:h-10"><SelectValue placeholder="Fase" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as fases</SelectItem>{stages.map((s) => <SelectItem key={s} value={s}>{stageLabel(s)}</SelectItem>)}</SelectContent></Select>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{filtered.length} negócio{filtered.length !== 1 ? 's' : ''}</p>

      <div className="grid gap-3 md:hidden">
        {filtered.length === 0 && <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Nenhum negócio encontrado</div>}
        {filtered.map((deal) => (
          <article key={deal.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/crm/negocios/${deal.id}`} className="block truncate text-base font-semibold">{deal.title}</Link><p className="mt-1 truncate text-sm text-muted-foreground">{deal.clients?.name ?? 'Sem cliente associado'}</p></div><span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">{stageLabel(deal.stage)}</span></div>
            <div className="mt-3 flex items-center gap-2 text-xs"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[deal.segment as Segment] ?? '#999' }} /><span>{SEGMENT_LABELS[deal.segment as Segment] ?? deal.segment}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg bg-secondary p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Valor</p><p className="mt-1 font-semibold">{formatCurrency(deal.value)}</p></div><div className="rounded-lg bg-secondary p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Comissão</p><p className="mt-1 font-semibold">{formatCurrency(deal.commission_value)}</p></div></div>
            <div className="mt-4 grid gap-2 border-t border-border pt-3 text-xs text-muted-foreground"><div className="flex justify-between gap-3"><span className="flex items-center gap-1"><UserRound size={13}/>Responsável</span><span className="truncate text-right">{deal.profiles ? fullName(deal.profiles) : '—'}</span></div><div className="flex justify-between gap-3"><span className="flex items-center gap-1"><CalendarDays size={13}/>Data</span><span>{formatDate(deal.created_at)}</span></div></div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-secondary">{['Título','Cliente','Segmento','Fase','Valor','Comissão','Responsável','Data'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr></thead><tbody className="divide-y divide-border">{filtered.length === 0 ? <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">Nenhum negócio encontrado</td></tr> : filtered.map((deal) => <tr key={deal.id} className="transition-colors hover:bg-secondary/50"><td className="px-4 py-3"><Link href={`/crm/negocios/${deal.id}`} className="font-medium hover:text-brand">{deal.title}</Link></td><td className="px-4 py-3 text-sm text-muted-foreground">{deal.clients?.name ?? '—'}</td><td className="px-4 py-3"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[deal.segment as Segment] ?? '#999' }} /><span className="text-xs">{SEGMENT_LABELS[deal.segment as Segment] ?? deal.segment}</span></td><td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">{stageLabel(deal.stage)}</span></td><td className="px-4 py-3 text-xs font-medium">{formatCurrency(deal.value)}</td><td className="px-4 py-3 text-xs text-muted-foreground">{formatCurrency(deal.commission_value)}</td><td className="px-4 py-3 text-xs text-muted-foreground">{deal.profiles ? fullName(deal.profiles) : '—'}</td><td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(deal.created_at)}</td></tr>)}</tbody></table></div></div>
    </div>
  )
}
