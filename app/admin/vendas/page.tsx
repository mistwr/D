'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { ShoppingCart, Search, ChevronDown } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pendente:   { label: 'Pendente',   color: '#92400e', bg: '#fef3c7' },
  em_revisao: { label: 'Em Revisao', color: '#1e40af', bg: '#dbeafe' },
  ativa:      { label: 'Ativa',      color: '#065f46', bg: '#d1fae5' },
  processado: { label: 'Processado', color: '#5b21b6', bg: '#ede9fe' },
  pago:       { label: 'Pago',       color: '#065f46', bg: '#bbf7d0' },
  cancelado:  { label: 'Cancelado',  color: '#991b1b', bg: '#fee2e2' },
  rejeitado:  { label: 'Rejeitado',  color: '#7f1d1d', bg: '#fecaca' },
}

const STATUSES = Object.keys(STATUS_LABELS)

interface Venda {
  id: string; client_name: string; amount: number; status: string
  service_type: string; operator: string; plano: string
  created_at: string; parceiro_name: string; user_id: string
}

export default function AdminVendasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todas')
  const [filterServico, setFilterServico] = useState('todos')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).catch(() => null)
      if (!me?.user || me.user.role !== 'admin') { router.push('/login'); return }
      setUser(me.user)
      const res = await fetch('/api/vendas', { credentials: 'include' }).then(r => r.json())
      setVendas(res.vendas || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function changeStatus(id: string, status: string) {
    setUpdating(id)
    await fetch('/api/vendas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, status }),
    })
    setVendas(prev => prev.map(v => v.id === id ? { ...v, status } : v))
    setUpdating(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  const filtered = vendas.filter(v => {
    const matchSearch = !search || v.client_name.toLowerCase().includes(search.toLowerCase()) || v.parceiro_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'todas' || v.status === filterStatus
    const matchServico = filterServico === 'todos' || v.service_type === filterServico
    return matchSearch && matchStatus && matchServico
  })

  const totalFiltrado = filtered.reduce((s, v) => s + (v.amount || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart size={28} style={{ color: '#4338ca' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Gestao de Vendas</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>{vendas.length} vendas registadas</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="rounded-xl p-4 mb-5 flex flex-wrap gap-3" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="relative flex-1 min-w-48">
                <Search size={16} className="absolute left-3 top-3" style={{ color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar cliente ou parceiro..." className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #d1d5db', color: '#111827' }} />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="rounded-lg px-3 py-2.5 text-sm outline-none" style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}>
                <option value="todas">Todos os estados</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s].label}</option>)}
              </select>
              <select value={filterServico} onChange={e => setFilterServico(e.target.value)}
                className="rounded-lg px-3 py-2.5 text-sm outline-none" style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}>
                <option value="todos">Todos os servicos</option>
                <option value="telecom">Telecom</option>
                <option value="energia">Energia</option>
                <option value="gas">Gas</option>
                <option value="seguros">Seguros</option>
              </select>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {['pendente','ativa','pago','cancelado'].map(s => {
                const count = vendas.filter(v => v.status === s).length
                const st = STATUS_LABELS[s]
                return (
                  <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'todas' : s)}
                    className="rounded-xl p-4 text-left transition-all" style={{ background: filterStatus === s ? st.bg : '#fff', border: `1px solid ${filterStatus === s ? 'transparent' : '#e5e7eb'}` }}>
                    <p className="text-2xl font-bold" style={{ color: st.color }}>{count}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: '#6b7280' }}>{st.label}</p>
                  </button>
                )
              })}
            </div>

            {/* Tabela */}
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>{filtered.length} resultados</p>
                <p className="text-sm font-semibold" style={{ color: '#4338ca' }}>Total: {totalFiltrado.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} EUR</p>
              </div>
              {filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingCart size={40} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
                  <p className="text-sm" style={{ color: '#9ca3af' }}>Nenhuma venda encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        {['Cliente', 'Parceiro', 'Servico', 'Operadora', 'Valor', 'Data', 'Estado'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((v, i) => {
                        const st = STATUS_LABELS[v.status] || { label: v.status, color: '#374151', bg: '#f3f4f6' }
                        return (
                          <tr key={v.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                            <td className="px-4 py-3 font-medium" style={{ color: '#111827' }}>{v.client_name}</td>
                            <td className="px-4 py-3" style={{ color: '#6b7280' }}>{v.parceiro_name || '—'}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: '#eef2ff', color: '#4338ca' }}>
                                {v.service_type}{v.plano ? ` ${v.plano}` : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3" style={{ color: '#374151' }}>{v.operator || '—'}</td>
                            <td className="px-4 py-3 font-semibold" style={{ color: '#111827' }}>
                              {(v.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>
                              {new Date(v.created_at).toLocaleDateString('pt-PT')}
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative">
                                <select value={v.status} onChange={e => changeStatus(v.id, e.target.value)}
                                  disabled={updating === v.id}
                                  className="rounded-full px-3 py-1 text-xs font-semibold cursor-pointer outline-none appearance-none pr-6 disabled:opacity-50"
                                  style={{ background: st.bg, color: st.color, border: 'none' }}>
                                  {STATUSES.map(s => (
                                    <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
                                  ))}
                                </select>
                                <ChevronDown size={10} className="absolute right-1.5 top-1.5 pointer-events-none" style={{ color: st.color }} />
                              </div>
                            </td>
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
