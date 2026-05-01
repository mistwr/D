'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { DollarSign, TrendingUp, Users, Clock, Search } from 'lucide-react'

interface Venda {
  id: string; client_name: string; client_email: string; client_nif: string; amount: number
  status: string; parceiro_name: string; user_id: string; created_at: string
}

const ST: Record<string, { bg: string; color: string; label: string }> = {
  pendente:   { bg: '#fef3c7', color: '#92400e',  label: 'Pendente'   },
  em_revisao: { bg: '#dbeafe', color: '#1e40af',  label: 'Em Revisao' },
  ativa:      { bg: '#d1fae5', color: '#065f46',  label: 'Ativa'      },
  pago:       { bg: '#bbf7d0', color: '#065f46',  label: 'Pago'       },
  cancelado:  { bg: '#fee2e2', color: '#991b1b',  label: 'Cancelado'  },
  rejeitado:  { bg: '#fecaca', color: '#7f1d1d',  label: 'Rejeitado'  },
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth('admin')
  const [vendas, setVendas] = useState<Venda[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [filterParceiro, setFilterParceiro] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    if (!user) return
    async function loadData() {
      try {
        const v = await fetch('/api/vendas', { credentials: 'include' }).then(r => r.json()).catch(() => ({ vendas: [] }))
        setVendas(v.vendas || [])
      } catch (e) {
        console.log('[v0] Admin: Erro a carregar:', e)
      }
      setDataLoading(false)
    }
    loadData()
  }, [user])

  if (authLoading || dataLoading) {
    return <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} /></div>
  }

  if (!user) return <div>Erro de autenticação</div>

  async function changeStatus(vendaId: string, newStatus: string) {
    await fetch('/api/vendas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: vendaId, status: newStatus }) })
    setVendas(prev => prev.map(v => v.id === vendaId ? { ...v, status: newStatus } : v))
  }

  // Parceiros únicos para o dropdown
  const parceirosUnicos = [...new Set(vendas.map(v => v.parceiro_name).filter(Boolean))].sort()

  // Filtrar vendas
  const filtered = vendas.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (v.client_name || '').toLowerCase().includes(q) ||
      (v.client_nif || '').toLowerCase().includes(q) ||
      (v.parceiro_name || '').toLowerCase().includes(q)
    const matchParceiro = !filterParceiro || v.parceiro_name === filterParceiro
    const matchStatus = !filterStatus || v.status === filterStatus
    return matchSearch && matchParceiro && matchStatus
  })

  const total = vendas.reduce((s, v) => s + (v.amount || 0), 0)
  const pendentes = vendas.filter(v => v.status === 'pendente').length
  const pagos = vendas.filter(v => v.status === 'pago').length
  const parceiros = new Set(vendas.map(v => v.parceiro_name)).size

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-1" style={{ color: '#111827' }}>Painel Admin</h1>
            <p className="mb-8 text-sm" style={{ color: '#6b7280' }}>Visao geral de todas as vendas</p>

            {/* Metricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total',     value: `€${total.toFixed(2)}`,  icon: DollarSign,  color: '#059669', bg: '#d1fae5' },
                { label: 'Vendas',    value: vendas.length,            icon: TrendingUp,  color: '#4f46e5', bg: '#e0e7ff' },
                { label: 'Parceiros', value: parceiros,                icon: Users,       color: '#0891b2', bg: '#cffafe' },
                { label: 'Pendentes', value: pendentes,                icon: Clock,       color: '#d97706', bg: '#fef3c7' },
              ].map(m => (
                <div key={m.label} className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg mb-3" style={{ background: m.bg }}>
                    <m.icon size={20} style={{ color: m.color }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#111827' }}>{m.value}</p>
                  <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="rounded-xl p-4 mb-5 flex flex-wrap gap-3" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="relative flex-1 min-w-48">
                <Search size={16} className="absolute left-3 top-3" style={{ color: '#9ca3af' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar por cliente ou NIF..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #d1d5db', color: '#111827' }}
                />
              </div>
              <select
                value={filterParceiro}
                onChange={e => setFilterParceiro(e.target.value)}
                className="rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}
              >
                <option value="">Todos os parceiros</option>
                {parceirosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}
              >
                <option value="">Todos os estados</option>
                {Object.entries(ST).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
              {(search || filterParceiro || filterStatus) && (
                <button
                  onClick={() => { setSearch(''); setFilterParceiro(''); setFilterStatus('') }}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium"
                  style={{ background: '#fee2e2', color: '#991b1b' }}
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Tabela */}
            <div className="rounded-xl shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
                <p className="text-sm font-semibold" style={{ color: '#4f46e5' }}>
                  Total filtrado: €{filtered.reduce((s, v) => s + (v.amount || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      {['Cliente / NIF', 'Parceiro', 'Valor', 'Estado', 'Data'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: '#374151' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: '#9ca3af' }}>
                          Nenhuma venda encontrada com os filtros selecionados
                        </td>
                      </tr>
                    ) : (
                      filtered.map(v => (
                        <tr key={v.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                          <td className="px-4 py-3">
                            <p className="font-medium" style={{ color: '#111827' }}>{v.client_name}</p>
                            {v.client_nif && <p className="text-xs font-mono mt-0.5" style={{ color: '#6b7280' }}>NIF: {v.client_nif}</p>}
                          </td>
                          <td className="px-4 py-3" style={{ color: '#6b7280' }}>{v.parceiro_name}</td>
                          <td className="px-4 py-3 font-semibold" style={{ color: '#111827' }}>€{(v.amount || 0).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <select
                              onChange={e => changeStatus(v.id, e.target.value)}
                              value={v.status}
                              style={{
                                padding: '4px 8px', borderRadius: '4px',
                                background: ST[v.status]?.bg || '#f3f4f6',
                                color: ST[v.status]?.color || '#6b7280',
                                border: 'none', fontSize: '12px', fontWeight: '500',
                              }}
                            >
                              {Object.entries(ST).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3" style={{ color: '#6b7280' }}>
                            {new Date(v.created_at).toLocaleDateString('pt-PT')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
