'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Plus, TrendingUp, Users, DollarSign, Clock, Calculator } from 'lucide-react'
import Link from 'next/link'

interface Venda { id: string; client_name: string; client_email: string; amount: number; status: string; created_at: string }
interface ComCalculo { energia: number; telecom: number; total: number }

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth('parceiro')
  const [vendas, setVendas] = useState<Venda[]>([])
  const [comCalc, setComCalc] = useState<ComCalculo | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return // Espera que useAuth complete

    async function loadData() {
      try {
        console.log('[v0] Dashboard: Carregando dados do parceiro')
        const [vRes, cRes] = await Promise.all([
          fetch('/api/vendas', { credentials: 'include' }),
          fetch('/api/comissoes', { credentials: 'include' })
        ])
        const vData = await vRes.json()
        const cData = await cRes.json()
        console.log('[v0] Dashboard: Dados carregados')
        setVendas(vData.vendas || [])
        if (cData.calculo) setComCalc(cData.calculo)
      } catch (e) {
        console.log('[v0] Dashboard: Erro ao carregar dados:', e)
      }
      setDataLoading(false)
    }

    loadData()
  }, [user])

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
      </div>
    )
  }

  if (!user) {
    return <div>Erro de autenticação</div>
  }

  const totalVendido = vendas.reduce((s, v) => s + (v.amount || 0), 0)
  const pendentes = vendas.filter((v) => v.status === 'pendente')
  const clientes = new Set(vendas.map((v) => v.client_email)).size

  const metrics = [
    { label: 'Total Vendido', value: `\u20AC${totalVendido.toFixed(2)}`, icon: DollarSign, color: '#059669', bg: '#d1fae5' },
    { label: 'Comissoes', value: `\u20AC${(comCalc?.total || 0).toFixed(2)}`, icon: Calculator, color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Vendas', value: vendas.length, icon: TrendingUp, color: '#4f46e5', bg: '#e0e7ff' },
    { label: 'Pendentes', value: pendentes.length, icon: Clock, color: '#d97706', bg: '#fef3c7' },
  ]

  const statusStyles: Record<string, { bg: string; color: string }> = {
    pendente: { bg: '#fef3c7', color: '#92400e' },
    em_revisao: { bg: '#dbeafe', color: '#1e40af' },
    processado: { bg: '#ede9fe', color: '#6d28d9' },
    pago: { bg: '#d1fae5', color: '#065f46' },
    cancelado: { bg: '#fee2e2', color: '#991b1b' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="flex-1 md:ml-64 pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#111827' }}>Dashboard</h1>
                <p className="mt-1" style={{ color: '#6b7280' }}>Bem-vindo, {user?.full_name}!</p>
              </div>
              <Link href="/vendas/novo">
                <button className="flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white" style={{ background: '#4f46e5' }}>
                  <Plus size={18} /> Nova Venda
                </button>
              </Link>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: m.bg }}>
                      <m.icon size={20} style={{ color: m.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#111827' }}>{m.value}</p>
                  <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Vendas */}
            <div className="rounded-xl shadow-sm" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
              <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <h2 className="text-lg font-bold" style={{ color: '#111827' }}>Vendas Recentes</h2>
              </div>
              {vendas.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="mb-4" style={{ color: '#6b7280' }}>Nenhuma venda registrada ainda.</p>
                  <Link href="/vendas/novo">
                    <button className="rounded-lg px-5 py-2 text-sm font-medium text-white" style={{ background: '#4f46e5' }}>Registar Primeira Venda</button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: '#374151' }}>Cliente</th>
                        <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: '#374151' }}>Valor</th>
                        <th className="px-5 py-3 text-left text-sm font-semibold" style={{ color: '#374151' }}>Estado</th>
                        <th className="hidden sm:table-cell px-5 py-3 text-left text-sm font-semibold" style={{ color: '#374151' }}>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendas.slice(0, 10).map((v) => {
                        const st = statusStyles[v.status] || statusStyles.pendente
                        return (
                          <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td className="px-5 py-4">
                              <p className="font-medium text-sm" style={{ color: '#111827' }}>{v.client_name}</p>
                              <p className="text-xs" style={{ color: '#6b7280' }}>{v.client_email}</p>
                            </td>
                            <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#111827' }}>{'\u20AC'}{v.amount?.toFixed(2)}</td>
                            <td className="px-5 py-4">
                              <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.color }}>
                                {v.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="hidden sm:table-cell px-5 py-4 text-sm" style={{ color: '#6b7280' }}>
                              {new Date(v.created_at).toLocaleDateString('pt-PT')}
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
