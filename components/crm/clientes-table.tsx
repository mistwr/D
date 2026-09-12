'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Search, Phone, Mail, ShieldCheck, ShieldAlert, MapPin, CalendarDays, UserRound } from 'lucide-react'
import { formatDate, fullName } from '@/lib/format'

interface Cliente {
  id: string; name: string; email: string | null; phone: string | null; nif: string | null; city: string | null; rgpd_consent: boolean; is_active: boolean; created_at: string
  profiles?: { first_name: string; last_name: string } | null
}

export function ClientesTable({ clients }: { clients: Cliente[] }) {
  const [search, setSearch] = useState('')
  const filtered = clients.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q) || c.nif?.includes(q) || c.city?.toLowerCase().includes(q)
  })

  return (
    <div className="min-w-0">
      <div className="mb-4"><div className="relative w-full sm:max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Pesquisar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 pl-9 sm:h-10" /></div></div>
      <p className="mb-3 text-xs text-muted-foreground">{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}</p>

      <div className="grid gap-3 md:hidden">
        {filtered.length === 0 && <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</div>}
        {filtered.map((client) => (
          <article key={client.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/crm/clientes/${client.id}`} className="block truncate text-base font-semibold">{client.name}</Link><div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">{client.city && <span className="flex items-center gap-1"><MapPin size={12}/>{client.city}</span>}{!client.is_active && <span className="rounded-full bg-secondary px-2 py-0.5">Inativo</span>}</div></div><div className="shrink-0">{client.rgpd_consent ? <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700"><ShieldCheck size={12}/>RGPD</span> : <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-[11px] font-medium text-red-700"><ShieldAlert size={12}/>Sem RGPD</span>}</div></div>
            <div className="mt-4 grid gap-2">{client.phone && <a href={`tel:${client.phone}`} className="flex min-h-10 items-center gap-2 rounded-lg bg-secondary px-3 text-sm"><Phone size={15} className="text-brand"/>{client.phone}</a>}{client.email && <a href={`mailto:${client.email}`} className="flex min-h-10 min-w-0 items-center gap-2 rounded-lg bg-secondary px-3 text-sm"><Mail size={15} className="shrink-0 text-brand"/><span className="truncate">{client.email}</span></a>}</div>
            <div className="mt-4 grid gap-2 border-t border-border pt-3 text-xs text-muted-foreground"><div className="flex justify-between gap-3"><span>NIF</span><span className="font-medium text-foreground">{client.nif ?? '—'}</span></div><div className="flex justify-between gap-3"><span className="flex items-center gap-1"><UserRound size={13}/>Responsável</span><span className="truncate text-right">{client.profiles ? fullName(client.profiles) : '—'}</span></div><div className="flex justify-between gap-3"><span className="flex items-center gap-1"><CalendarDays size={13}/>Desde</span><span>{formatDate(client.created_at)}</span></div></div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-secondary">{['Nome','Contacto','NIF','Cidade','RGPD','Responsável','Desde'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr></thead><tbody className="divide-y divide-border">{filtered.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado</td></tr> : filtered.map((client) => <tr key={client.id} className="transition-colors hover:bg-secondary/50"><td className="px-4 py-3"><Link href={`/crm/clientes/${client.id}`} className="font-medium hover:text-brand">{client.name}</Link>{!client.is_active && <span className="ml-2 text-xs text-muted-foreground">(inativo)</span>}</td><td className="px-4 py-3"><div className="flex flex-col gap-1">{client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand"><Phone size={11}/>{client.phone}</a>}{client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand"><Mail size={11}/>{client.email}</a>}</div></td><td className="px-4 py-3 text-xs text-muted-foreground">{client.nif ?? '—'}</td><td className="px-4 py-3 text-xs text-muted-foreground">{client.city ?? '—'}</td><td className="px-4 py-3">{client.rgpd_consent ? <div className="flex items-center gap-1 text-xs text-green-600"><ShieldCheck size={13}/>Sim</div> : <div className="flex items-center gap-1 text-xs text-red-500"><ShieldAlert size={13}/>Não</div>}</td><td className="px-4 py-3 text-xs text-muted-foreground">{client.profiles ? fullName(client.profiles) : '—'}</td><td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(client.created_at)}</td></tr>)}</tbody></table></div></div>
    </div>
  )
}
