'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, FileText, ExternalLink } from 'lucide-react'
import { formatDate, formatRelative, fullName } from '@/lib/format'
import { DOCUMENT_STATUS_LABELS } from '@/lib/constants'
import type { DocumentStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<DocumentStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  recebido: 'bg-blue-100 text-blue-700',
  validado: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-700',
  expirado: 'bg-gray-100 text-gray-600',
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

interface Doc {
  id: string
  name: string
  file_type: string | null
  file_size: number | null
  status: string
  expires_at: string | null
  created_at: string
  clients?: { name: string } | null
  deals?: { title: string } | null
  profiles?: { first_name: string; last_name: string } | null
}

export function DocumentosTable({ documents }: { documents: Doc[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = documents.filter((d) => {
    const q = search.toLowerCase()
    const matchSearch = !search || d.name.toLowerCase().includes(q) || d.clients?.name.toLowerCase().includes(q) || d.deals?.title.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false
    const diff = new Date(expiresAt).getTime() - Date.now()
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar documentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(DOCUMENT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{filtered.length} documento{filtered.length !== 1 ? 's' : ''}</p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Documento', 'Cliente / Negócio', 'Estado', 'Tamanho', 'Expira', 'Por', 'Adicionado'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Nenhum documento encontrado</td></tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate max-w-[200px]">{doc.name}</span>
                      </div>
                      {doc.file_type && (
                        <p className="text-xs text-muted-foreground mt-0.5 pl-5">{doc.file_type}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {doc.clients?.name ?? doc.deals?.title ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[doc.status as DocumentStatus] ?? 'bg-secondary text-foreground')}>
                        {DOCUMENT_STATUS_LABELS[doc.status as DocumentStatus] ?? doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatBytes(doc.file_size)}</td>
                    <td className="px-4 py-3 text-xs">
                      {doc.expires_at ? (
                        <span className={cn(isExpiringSoon(doc.expires_at) ? 'text-amber-600 font-medium' : 'text-muted-foreground')}>
                          {isExpiringSoon(doc.expires_at) && '⚠ '}
                          {formatDate(doc.expires_at)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{doc.profiles ? fullName(doc.profiles) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelative(doc.created_at)}</td>
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
