'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDatetime, fullName } from '@/lib/format'
import { cn } from '@/lib/utils'

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  SELECT: 'bg-gray-100 text-gray-600',
  AUTH: 'bg-amber-100 text-amber-700',
}

interface Log {
  id: string
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
  profiles?: { first_name: string; last_name: string } | null
}

function LogRow({ log }: { log: Log }) {
  const [expanded, setExpanded] = useState(false)
  const hasData = log.old_data || log.new_data

  return (
    <>
      <tr className="hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="px-4 py-3">
          <span className={cn('px-2 py-0.5 rounded text-xs font-mono font-medium', ACTION_COLORS[log.action] ?? 'bg-secondary text-foreground')}>
            {log.action}
          </span>
        </td>
        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{log.table_name}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground font-mono truncate max-w-[120px]">
          {log.record_id ? log.record_id.slice(0, 8) + '...' : '—'}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{log.profiles ? fullName(log.profiles) : '—'}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDatetime(log.created_at)}</td>
        <td className="px-4 py-3">
          {hasData && (
            <button className="text-muted-foreground">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </td>
      </tr>
      {expanded && hasData && (
        <tr>
          <td colSpan={6} className="px-4 pb-3">
            <div className="grid grid-cols-2 gap-3 mt-1">
              {log.old_data && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Antes</p>
                  <pre className="text-xs bg-red-50 border border-red-100 rounded p-2 overflow-auto max-h-36 text-red-900">
                    {JSON.stringify(log.old_data, null, 2)}
                  </pre>
                </div>
              )}
              {log.new_data && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Depois</p>
                  <pre className="text-xs bg-green-50 border border-green-100 rounded p-2 overflow-auto max-h-36 text-green-900">
                    {JSON.stringify(log.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function AuditLogsTable({ logs }: { logs: Log[] }) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [tableFilter, setTableFilter] = useState('all')

  const tables = Array.from(new Set(logs.map((l) => l.table_name))).sort()
  const actions = Array.from(new Set(logs.map((l) => l.action))).sort()

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch = !search || l.table_name.includes(q) || l.action.includes(q) ||
      (l.profiles && fullName(l.profiles).toLowerCase().includes(q)) ||
      l.record_id?.includes(q)
    const matchAction = actionFilter === 'all' || l.action === actionFilter
    const matchTable = tableFilter === 'all' || l.table_name === tableFilter
    return matchSearch && matchAction && matchTable
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={actionFilter} onValueChange={(v) => v && setActionFilter(v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tableFilter} onValueChange={(v) => v && setTableFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tabela" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as tabelas</SelectItem>
            {tables.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{filtered.length} registo{filtered.length !== 1 ? 's' : ''}</p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Ação', 'Tabela', 'Registo', 'Utilizador', 'Data/Hora', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Nenhum log encontrado</td></tr>
              ) : (
                filtered.map((log) => <LogRow key={log.id} log={log} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
