'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { AlertTriangle, Search, Trash2 } from 'lucide-react'

interface Chargeback {
  id: string
  valor: number
  motivo: string
  observacoes: string
  created_at: string
  venda: { id: string; client_name: string; service_type: string; operator: string } | null
  parceiro: { id: string; full_name: string; email: string } | null
  criador: { id: string; full_name: string } | null
}

export default function ChargebacksPage() {
  const { user, authFetch } = useAuth('admin')
  const [chargebacks, setChargebacks] = useState<Chargeback[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    authFetch('/api/chargebacks').then(r => r.json()).then(d => {
      setChargebacks(d.chargebacks || [])
      setLoading(false)
    })
  }, [user, authFetch])

  const filtered = chargebacks.filter(c =>
    c.parceiro?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.venda?.client_name.toLowerCase().includes(search.toLowerCase()) ||
    c.motivo.toLowerCase().includes(search.toLowerCase())
  )

  const total = chargebacks.reduce((s, c) => s + c.valor, 0)

  async function handleDelete(id: string) {
    setDeleting(id)
    await authFetch('/api/chargebacks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setChargebacks(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle size={28} style={{ color: '#7c2d12' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Chargebacks</h1>
                  <p className="text-sm" style={{ color: '#6b7280' }}>Gestao de estornos e debitos</p>
                </div>
              </div>
              <div className="rounded-xl px-5 py-3 shadow-sm" style={{ background: '#ffedd5', border: '1px solid #fed7aa' }}>
                <p className="text-xs font-medium" style={{ color: '#7c2d12' }}>Total Chargebacks</p>
                <p className="text-xl font-bold" style={{ color: '#7c2d12' }}>{total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} EUR</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: '#9ca3af' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar por parceiro, cliente ou motivo..."
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                style={{ background: '#fff', border: '1px solid #e5e7eb' }}
              />
            </div>

            {/* Table */}
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              {filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertTriangle size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                  <p style={{ color: '#6b7280' }}>Nenhum chargeback registado</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Parceiro</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Cliente</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Motivo</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Valor</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Data</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-sm" style={{ color: '#111827' }}>{c.parceiro?.full_name || '-'}</p>
                          <p className="text-xs" style={{ color: '#6b7280' }}>{c.parceiro?.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm" style={{ color: '#111827' }}>{c.venda?.client_name || '-'}</p>
                          <p className="text-xs" style={{ color: '#6b7280' }}>{c.venda?.operator}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm" style={{ color: '#111827' }}>{c.motivo}</p>
                          {c.observacoes && <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{c.observacoes}</p>}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="font-semibold text-sm" style={{ color: '#dc2626' }}>-{c.valor.toFixed(2)} EUR</p>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: '#6b7280' }}>
                          {new Date(c.created_at).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deleting === c.id}
                            className="p-2 rounded-lg transition hover:opacity-70 disabled:opacity-50"
                            style={{ background: '#fee2e2', color: '#dc2626' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
