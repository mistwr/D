'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Phone, Mail } from 'lucide-react'
import { formatDate, fullName } from '@/lib/format'
import { SEGMENT_LABELS, LEAD_ORIGIN_LABELS } from '@/lib/constants'
import type { Segment, LeadOrigin } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const SEGMENT_COLORS: Record<string, string> = {
  energia: 'bg-amber-100 text-amber-800',
  telecom: 'bg-blue-100 text-blue-800',
  credito: 'bg-green-100 text-green-800',
  imobiliario: 'bg-violet-100 text-violet-800',
  seguros: 'bg-red-100 text-red-800',
}

const STATUS_COLORS: Record<string, string> = {
  nova: 'bg-blue-100 text-blue-800',
  contactar: 'bg-yellow-100 text-yellow-800',
  contactado: 'bg-green-100 text-green-800',
  perdida: 'bg-red-100 text-red-800',
}

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  segment: string
  origin: string
  status: string
  score: number | null
  created_at: string
  profiles?: { first_name: string; last_name: string } | null
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = leads.filter((l) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.email?.toLowerCase().includes(search.toLowerCase())) ||
      (l.phone?.includes(search))
    const matchSegment = segmentFilter === 'all' || l.segment === segmentFilter
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchSegment && matchStatus
  })

  const statuses = Array.from(new Set(leads.map((l) => l.status)))

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={segmentFilter} onValueChange={(v) => v && setSegmentFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os segmentos</SelectItem>
            {Object.entries(SEGMENT_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Contacto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Segmento</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Origem</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Responsável</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhuma lead encontrada
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/crm/leads/${lead.id}`} className="font-medium hover:text-brand transition-colors">
                        {lead.name}
                      </Link>
                      {lead.score != null && (
                        <div className="w-16 h-1 bg-secondary rounded-full mt-1">
                          <div
                            className="h-full bg-brand rounded-full"
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand">
                            <Phone size={11} /> {lead.phone}
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand">
                            <Mail size={11} /> {lead.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', SEGMENT_COLORS[lead.segment] ?? 'bg-secondary text-foreground')}>
                        {SEGMENT_LABELS[lead.segment as Segment] ?? lead.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[lead.status] ?? 'bg-secondary text-foreground')}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {LEAD_ORIGIN_LABELS[lead.origin as LeadOrigin] ?? lead.origin}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {lead.profiles ? fullName(lead.profiles) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </td>
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
