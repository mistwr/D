'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Search, Phone, Mail, ShieldCheck, ShieldAlert } from 'lucide-react'
import { formatDate, fullName } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Cliente {
  id: string
  name: string
  email: string | null
  phone: string | null
  nif: string | null
  city: string | null
  rgpd_consent: boolean
  is_active: boolean
  created_at: string
  profiles?: { first_name: string; last_name: string } | null
}

export function ClientesTable({ clients }: { clients: Cliente[] }) {
  const [search, setSearch] = useState('')

  const filtered = clients.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.nif?.includes(q) ||
      c.city?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Contacto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">NIF</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Cidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">RGPD</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Responsável</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/crm/clientes/${client.id}`} className="font-medium hover:text-brand transition-colors">
                        {client.name}
                      </Link>
                      {!client.is_active && (
                        <span className="ml-2 text-xs text-muted-foreground">(inativo)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {client.phone && (
                          <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand">
                            <Phone size={11} /> {client.phone}
                          </a>
                        )}
                        {client.email && (
                          <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand">
                            <Mail size={11} /> {client.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{client.nif ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{client.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      {client.rgpd_consent ? (
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <ShieldCheck size={13} /> Sim
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-500 text-xs">
                          <ShieldAlert size={13} /> Não
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {client.profiles ? fullName(client.profiles) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(client.created_at)}
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
