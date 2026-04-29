'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface Venda { id: string; client_name: string; client_email: string; amount: number; status: string; contract_type: string; service_type: string; operator: string; created_at: string }

const stColors: Record<string, { bg: string; color: string }> = {
  pendente: { bg: '#fef3c7', color: '#92400e' }, em_revisao: { bg: '#dbeafe', color: '#1e40af' },
  ativa: { bg: '#d1fae5', color: '#065f46' },
  processado: { bg: '#ede9fe', color: '#6d28d9' }, pago: { bg: '#d1fae5', color: '#065f46' },
  cancelado: { bg: '#fee2e2', color: '#991b1b' },
}

export default function VendasPage() {
  const { user, loading: authLoading } = useAuth('parceiro')
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')

  useEffect(() => {
    if (!user) return
    fetch('/api/vendas', { credentials: 'include' }).then(r => r.json()).then(d => setVendas(d.vendas || [])).finally(() => setLoading(false))
  }, [user])

  const filtered = vendas.filter(v => {
    const m = v.client_name.toLowerCase().includes(search.toLowerCase()) || v.client_email.toLowerCase().includes(search.toLowerCase())
    return m && (filter === 'todos' || v.status === filter)
  })

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="flex-1 md:ml-64 pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Minhas Vendas</h1>
              <Link href="/vendas/novo">
                <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: '#4f46e5' }}>
                  <Plus size={16} /> Nova Venda
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 rounded-xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5" style={{ color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Procurar cliente..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none" style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }} />
              </div>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-sm outline-none" style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }}>
                <option value="todos">Todos os estados</option>
                <option value="pendente">Pendente</option>
                <option value="em_revisao">Em Revisao</option>
                <option value="ativa">Ativa</option>
                <option value="processado">Processado</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              {filtered.length === 0 ? (
                <div className="p-12 text-center"><p style={{ color: '#6b7280' }}>Nenhuma venda encontrada</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      {['Cliente', 'Servico', 'Operadora', 'Valor', 'Estado', 'Data'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-sm font-semibold" style={{ color: '#374151' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.map(v => {
                        const st = stColors[v.status] || stColors.pendente
                        return (
                          <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td className="px-5 py-4">
                              <p className="font-medium text-sm" style={{ color: '#111827' }}>{v.client_name}</p>
                              <p className="text-xs" style={{ color: '#6b7280' }}>{v.client_email}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: v.service_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: v.service_type === 'energia' ? '#92400e' : '#4338ca' }}>
                                {v.service_type === 'energia' ? 'Energia' : 'Telecom'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm font-medium" style={{ color: '#111827' }}>{v.operator || '-'}</td>
                            <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#111827' }}>{'\u20AC'}{v.amount?.toFixed(2)}</td>
                            <td className="px-5 py-4">
                              <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.color }}>
                                {v.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm" style={{ color: '#6b7280' }}>{new Date(v.created_at).toLocaleDateString('pt-PT')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
