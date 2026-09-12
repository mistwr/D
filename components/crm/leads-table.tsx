'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Phone, Mail, CalendarDays, UserRound } from 'lucide-react'
import { formatDate, fullName } from '@/lib/format'
import { SEGMENT_LABELS, LEAD_ORIGIN_LABELS } from '@/lib/constants'
import type { Segment, LeadOrigin } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const SEGMENT_COLORS: Record<string, string> = {
  energia: 'bg-amber-100 text-amber-800', telecom: 'bg-blue-100 text-blue-800', credito: 'bg-green-100 text-green-800', imobiliario: 'bg-violet-100 text-violet-800', seguros: 'bg-red-100 text-red-800',
}
const STATUS_COLORS: Record<string, string> = {
  nova: 'bg-blue-100 text-blue-800', contactar: 'bg-yellow-100 text-yellow-800', contactado: 'bg-green-100 text-green-800', perdida: 'bg-red-100 text-red-800',
}

interface Lead {
  id: string; name: string; email: string | null; phone: string | null; segment: string; origin: string; status: string; score: number | null; created_at: string
  profiles?: { first_name: string; last_name: string } | null
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch = !search || l.name.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.phone?.includes(search)
    return matchSearch && (segmentFilter === 'all' || l.segment === segmentFilter) && (statusFilter === 'all' || l.status === statusFilter)
  })
  const statuses = Array.from(new Set(leads.map((l) => l.status))).filter(Boolean)

  return (
    <div className="min-w-0">
      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px_170px] sm:gap-3">
        <div className="relative min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 pl-9 sm:h-10" />
        </div>
        <Select value={segmentFilter} onValueChange={(v) => v && setSegmentFilter(v)}><SelectTrigger className="h-11 w-full sm:h-10"><SelectValue placeholder="Segmento" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os segmentos</SelectItem>{Object.entries(SEGMENT_LABELS).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}><SelectTrigger className="h-11 w-full sm:h-10"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os estados</SelectItem>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</p>

      <div className="grid gap-3 md:hidden">
        {filtered.length === 0 && <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Nenhuma lead encontrada</div>}
        {filtered.map((lead) => (
          <article key={lead.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link href={`/crm/leads/${lead.id}`} className="block truncate text-base font-semibold text-foreground">{lead.name}</Link>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={cn('rounded-full px-2 py-1 text-[11px] font-medium', SEGMENT_COLORS[lead.segment] ?? 'bg-secondary')}>{SEGMENT_LABELS[lead.segment as Segment] ?? lead.segment}</span>
                  <span className={cn('rounded-full px-2 py-1 text-[11px] font-medium', STATUS_COLORS[lead.status] ?? 'bg-secondary')}>{lead.status}</span>
                </div>
              </div>
              {lead.score != null && <div className="shrink-0 rounded-lg bg-brand/10 px-2.5 py-1.5 text-xs font-bold text-brand">{lead.score}</div>}
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              {lead.phone && <a href={`tel:${lead.phone}`} className="flex min-h-10 items-center gap-2 rounded-lg bg-secondary px-3 text-foreground"><Phone size={15} className="text-brand" />{lead.phone}</a>}
              {lead.email && <a href={`mailto:${lead.email}`} className="flex min-h-10 min-w-0 items-center gap-2 rounded-lg bg-secondary px-3 text-foreground"><Mail size={15} className="shrink-0 text-brand" /><span className="truncate">{lead.email}</span></a>}
            </div>
            <div className="mt-4 grid gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-3"><span>Origem</span><span className="text-right font-medium text-foreground">{LEAD_ORIGIN_LABELS[lead.origin as LeadOrigin] ?? lead.origin}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-1"><UserRound size={13}/>Responsável</span><span className="truncate text-right">{lead.profiles ? fullName(lead.profiles) : '—'}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-1"><CalendarDays size={13}/>Data</span><span>{formatDate(lead.created_at)}</span></div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-secondary">{['Nome','Contacto','Segmento','Estado','Origem','Responsável','Data'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr></thead><tbody className="divide-y divide-border">{filtered.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Nenhuma lead encontrada</td></tr> : filtered.map((lead) => <tr key={lead.id} className="transition-colors hover:bg-secondary/50"><td className="px-4 py-3"><Link href={`/crm/leads/${lead.id}`} className="font-medium hover:text-brand">{lead.name}</Link></td><td className="px-4 py-3"><div className="flex flex-col gap-1">{lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand"><Phone size={11}/>{lead.phone}</a>}{lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand"><Mail size={11}/>{lead.email}</a>}</div></td><td className="px-4 py-3"><span className={cn('rounded-full px-2 py-1 text-xs font-medium', SEGMENT_COLORS[lead.segment] ?? 'bg-secondary')}>{SEGMENT_LABELS[lead.segment as Segment] ?? lead.segment}</span></td><td className="px-4 py-3"><span className={cn('rounded-full px-2 py-1 text-xs font-medium', STATUS_COLORS[lead.status] ?? 'bg-secondary')}>{lead.status}</span></td><td className="px-4 py-3 text-xs text-muted-foreground">{LEAD_ORIGIN_LABELS[lead.origin as LeadOrigin] ?? lead.origin}</td><td className="px-4 py-3 text-xs text-muted-foreground">{lead.profiles ? fullName(lead.profiles) : '—'}</td><td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(lead.created_at)}</td></tr>)}</tbody></table></div></div>
    </div>
  )
}
