'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { DollarSign, TrendingUp, Users, Clock, Search, Filter, Calendar, Building2, Download, BarChart3, Target, Award } from 'lucide-react'

interface Venda {
  id: string; client_name: string; client_email: string; client_nif: string; amount: number
  status: string; parceiro_name: string; user_id: string; created_at: string
  operator?: string; service_type?: string
}
interface Unidade { id: string; nome: string }

const ST: Record<string, { bg: string; color: string; label: string }> = {
  pendente:   { bg: '#fef3c7', color: '#92400e',  label: 'Pendente'   },
  em_revisao: { bg: '#dbeafe', color: '#1e40af',  label: 'Em Revisao' },
  ativa:      { bg: '#d1fae5', color: '#065f46',  label: 'Ativa'      },
  pago:       { bg: '#bbf7d0', color: '#065f46',  label: 'Pago'       },
  cancelado:  { bg: '#fee2e2', color: '#991b1b',  label: 'Cancelado'  },
  rejeitado:  { bg: '#fecaca', color: '#7f1d1d',  label: 'Rejeitado'  },
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [vendas, setVendas] = useState<Venda[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [filterParceiro, setFilterParceiro] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterUnidade, setFilterUnidade] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('mes')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!user) return
    async function loadData() {
      try {
        const [vRes, uRes] = await Promise.all([
          authFetch('/api/vendas'),
          authFetch('/api/unidades')
        ])
        const vData = await vRes.json()
        setVendas(vData.vendas || [])
        if (uRes.ok) setUnidades(await uRes.json())
      } catch { /* silencioso */ }
      setDataLoading(false)
    }
    loadData()
  }, [user])

  // Calcular período
  const periodoFilter = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    
    return (date: string) => {
      const d = new Date(date)
      switch (filterPeriodo) {
        case 'hoje': return d.toDateString() === new Date().toDateString()
        case 'semana': return d >= startOfWeek
        case 'mes': return d >= startOfMonth
        case 'ano': return d >= startOfYear
        default: return true
      }
    }
  }, [filterPeriodo])

  // Parceiros e operadoras únicos
  const parceirosUnicos = [...new Set(vendas.map(v => v.parceiro_name).filter(Boolean))].sort()
  const operadorasUnicas = [...new Set(vendas.map(v => v.operator).filter(Boolean))].sort()

  // Filtrar vendas
  const filtered = useMemo(() => vendas.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (v.client_name || '').toLowerCase().includes(q) ||
      (v.client_nif || '').toLowerCase().includes(q) ||
      (v.parceiro_name || '').toLowerCase().includes(q)
    const matchParceiro = !filterParceiro || v.parceiro_name === filterParceiro
    const matchStatus = !filterStatus || v.status === filterStatus
    const matchTipo = !filterTipo || v.service_type === filterTipo
    const matchPeriodo = periodoFilter(v.created_at)
    return matchSearch && matchParceiro && matchStatus && matchTipo && matchPeriodo
  }), [vendas, search, filterParceiro, filterStatus, filterTipo, periodoFilter])

  // Métricas avançadas
  const metrics = useMemo(() => {
    const total = filtered.reduce((s, v) => s + (v.amount || 0), 0)
    const pendentes = filtered.filter(v => v.status === 'pendente').length
    const pagos = filtered.filter(v => v.status === 'pago').length
    const parceiros = new Set(filtered.map(v => v.parceiro_name)).size
    const telecom = filtered.filter(v => v.service_type === 'telecom').reduce((s, v) => s + (v.amount || 0), 0)
    const energia = filtered.filter(v => v.service_type === 'energia').reduce((s, v) => s + (v.amount || 0), 0)
    const taxaConversao = filtered.length > 0 ? ((filtered.filter(v => ['ativa', 'pago'].includes(v.status)).length / filtered.length) * 100).toFixed(1) : '0'
    
    // Top parceiro
    const parceiroVendas: Record<string, number> = {}
    filtered.forEach(v => {
      if (v.parceiro_name) parceiroVendas[v.parceiro_name] = (parceiroVendas[v.parceiro_name] || 0) + (v.amount || 0)
    })
    const topParceiro = Object.entries(parceiroVendas).sort((a, b) => b[1] - a[1])[0]

    return { total, pendentes, pagos, parceiros, telecom, energia, taxaConversao, topParceiro }
  }, [filtered])

  // Export CSV
  function exportCSV() {
    const headers = ['Cliente', 'NIF', 'Parceiro', 'Valor', 'Estado', 'Tipo', 'Data']
    const rows = filtered.map(v => [
      v.client_name, v.client_nif, v.parceiro_name, v.amount?.toFixed(2),
      ST[v.status]?.label || v.status, v.service_type || '', new Date(v.created_at).toLocaleDateString('pt-PT')
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (authLoading || dataLoading) {
    return <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} /></div>
  }

  if (!user) return <div>Erro de autenticacao</div>

  async function changeStatus(vendaId: string, newStatus: string) {
    await fetch('/api/vendas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: vendaId, status: newStatus }) })
    setVendas(prev => prev.map(v => v.id === vendaId ? { ...v, status: newStatus } : v))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 md:ml-64 pt-14 md:pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#1e293b' }}>Dashboard Enterprise</h1>
                <p style={{ color: '#64748b' }}>Visao completa do desempenho comercial</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-all"
                  style={{ background: showFilters ? '#0ea5e9' : '#ffffff', color: showFilters ? '#ffffff' : '#64748b', border: '1px solid #e2e8f0' }}>
                  <Filter size={18} /> Filtros
                </button>
                <button onClick={exportCSV}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                  <Download size={18} /> Exportar
                </button>
              </div>
            </div>

            {/* Período */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { key: 'hoje', label: 'Hoje' },
                { key: 'semana', label: 'Esta Semana' },
                { key: 'mes', label: 'Este Mes' },
                { key: 'ano', label: 'Este Ano' },
                { key: 'todos', label: 'Todos' },
              ].map(p => (
                <button key={p.key} onClick={() => setFilterPeriodo(p.key)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-all"
                  style={{ 
                    background: filterPeriodo === p.key ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : '#ffffff',
                    color: filterPeriodo === p.key ? '#ffffff' : '#64748b',
                    border: '1px solid #e2e8f0'
                  }}>
                  <Calendar size={14} /> {p.label}
                </button>
              ))}
            </div>

            {/* Métricas Principais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Volume Total', value: `€${metrics.total.toFixed(2)}`, icon: DollarSign, color: '#0ea5e9', bg: '#e0f2fe' },
                { label: 'Vendas', value: filtered.length, icon: BarChart3, color: '#8b5cf6', bg: '#ede9fe' },
                { label: 'Taxa Conversao', value: `${metrics.taxaConversao}%`, icon: Target, color: '#22c55e', bg: '#dcfce7' },
                { label: 'Parceiros Ativos', value: metrics.parceiros, icon: Users, color: '#f97316', bg: '#ffedd5' },
              ].map(m => (
                <div key={m.label} className="rounded-2xl p-5 shadow-sm transition-all hover:shadow-md" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: m.bg }}>
                      <m.icon size={22} style={{ color: m.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{m.value}</p>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Métricas Secundárias */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                <p className="text-sm text-white/80">Telecom</p>
                <p className="text-xl font-bold text-white">€{metrics.telecom.toFixed(2)}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                <p className="text-sm text-white/80">Energia</p>
                <p className="text-xl font-bold text-white">€{metrics.energia.toFixed(2)}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' }}>
                <p className="text-sm text-white/80">Pendentes</p>
                <p className="text-xl font-bold text-white">{metrics.pendentes}</p>
              </div>
              {metrics.topParceiro && (
                <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Award size={16} className="text-white/80" />
                    <p className="text-sm text-white/80">Top Parceiro</p>
                  </div>
                  <p className="font-bold text-white truncate">{metrics.topParceiro[0]}</p>
                  <p className="text-sm text-white/80">€{metrics.topParceiro[1].toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Filtros Expandidos */}
            {showFilters && (
              <div className="rounded-xl p-4 mb-5 flex flex-wrap gap-3" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="relative flex-1 min-w-48">
                  <Search size={16} className="absolute left-3 top-3" style={{ color: '#9ca3af' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Pesquisar cliente, NIF ou parceiro..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }} />
                </div>
                <select value={filterParceiro} onChange={e => setFilterParceiro(e.target.value)}
                  className="rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#1e293b', background: '#fff' }}>
                  <option value="">Todos os parceiros</option>
                  {parceirosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#1e293b', background: '#fff' }}>
                  <option value="">Todos os estados</option>
                  {Object.entries(ST).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
                <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
                  className="rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#1e293b', background: '#fff' }}>
                  <option value="">Todos os tipos</option>
                  <option value="telecom">Telecom</option>
                  <option value="energia">Energia</option>
                </select>
                {unidades.length > 0 && (
                  <select value={filterUnidade} onChange={e => setFilterUnidade(e.target.value)}
                    className="rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b', background: '#fff' }}>
                    <option value="">Todas as unidades</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                )}
                {(search || filterParceiro || filterStatus || filterTipo || filterUnidade) && (
                  <button onClick={() => { setSearch(''); setFilterParceiro(''); setFilterStatus(''); setFilterTipo(''); setFilterUnidade('') }}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium"
                    style={{ background: '#fee2e2', color: '#991b1b' }}>Limpar</button>
                )}
              </div>
            )}

            {/* Tabela */}
            <div className="rounded-2xl shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <p className="text-sm font-medium" style={{ color: '#64748b' }}>{filtered.length} venda{filtered.length !== 1 ? 's' : ''}</p>
                <p className="text-sm font-semibold" style={{ color: '#0ea5e9' }}>
                  Total: €{filtered.reduce((s, v) => s + (v.amount || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      {['Cliente', 'Parceiro', 'Valor', 'Tipo', 'Estado', 'Data'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center" style={{ color: '#94a3b8' }}>Nenhuma venda encontrada</td></tr>
                    ) : (
                      filtered.slice(0, 50).map(v => (
                        <tr key={v.id} className="transition-colors hover:bg-slate-50" style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td className="px-4 py-3">
                            <p className="font-semibold" style={{ color: '#1e293b' }}>{v.client_name}</p>
                            {v.client_nif && <p className="text-xs font-mono" style={{ color: '#64748b' }}>NIF: {v.client_nif}</p>}
                          </td>
                          <td className="px-4 py-3" style={{ color: '#64748b' }}>{v.parceiro_name}</td>
                          <td className="px-4 py-3 font-bold" style={{ color: '#0ea5e9' }}>€{(v.amount || 0).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{ background: v.service_type === 'telecom' ? '#e0f2fe' : '#ffedd5', color: v.service_type === 'telecom' ? '#0369a1' : '#c2410c' }}>
                              {v.service_type === 'telecom' ? 'Telecom' : v.service_type === 'energia' ? 'Energia' : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select onChange={e => changeStatus(v.id, e.target.value)} value={v.status}
                              className="px-2 py-1 rounded text-xs font-medium border-0"
                              style={{ background: ST[v.status]?.bg || '#f3f4f6', color: ST[v.status]?.color || '#6b7280' }}>
                              {Object.entries(ST).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3" style={{ color: '#64748b' }}>{new Date(v.created_at).toLocaleDateString('pt-PT')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filtered.length > 50 && (
                <div className="px-5 py-3 text-center text-sm" style={{ borderTop: '1px solid #e2e8f0', color: '#64748b' }}>
                  A mostrar 50 de {filtered.length} vendas. Use os filtros para refinar.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
