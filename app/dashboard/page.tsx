'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Plus, TrendingUp, Users, DollarSign, Clock, Calculator } from 'lucide-react'
import Link from 'next/link'

interface Venda { id: string; client_name: string; client_email: string; amount: number; status: string; created_at: string }
interface ComCalculo { energia: number; telecom: number; total: number }
interface Mensagem { mensagem: string; autor: string }
interface Chargeback { id: string; valor: number; motivo: string; created_at: string }

export default function DashboardPage() {
  const { user, loading: authLoading, authFetch } = useAuth('parceiro')
  const [vendas, setVendas] = useState<Venda[]>([])
  const [comCalc, setComCalc] = useState<ComCalculo | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [mensagemDia, setMensagemDia] = useState<Mensagem | null>(null)
  const [chargebacks, setChargebacks] = useState<Chargeback[]>([])

  useEffect(() => {
    if (!user) return // Espera que useAuth complete

    async function loadData() {
      try {
        const [vRes, cRes, mRes, chRes] = await Promise.all([
          authFetch('/api/vendas'),
          authFetch('/api/comissoes'),
          authFetch('/api/mensagens'),
          authFetch('/api/chargebacks')
        ])
        const vData = await vRes.json()
        const cData = await cRes.json()
        const mData = await mRes.json()
        const chData = await chRes.json()
        setVendas(vData.vendas || [])
        if (cData.calculo) setComCalc(cData.calculo)
        if (mData.mensagem) setMensagemDia(mData.mensagem)
        setChargebacks(chData.chargebacks || [])
      } catch {
        // silencioso
      }
      setDataLoading(false)
    }

    loadData()
  }, [user])

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" >
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
      </div>
    )
  }

  if (!user) {
    return <div>Erro de autenticação</div>
  }

  const totalVendido = vendas.reduce((s, v) => s + (v.amount || 0), 0)
  const pendentes = vendas.filter((v) => v.status === 'pendente')
  const totalChargebacks = chargebacks.reduce((s, c) => s + (c.valor || 0), 0)
  const comissaoBruta = comCalc?.total || 0
  const saldoFinal = comissaoBruta - totalChargebacks

  const metrics = [
    { label: 'Comissao Bruta', value: `\u20AC${comissaoBruta.toFixed(2)}`, icon: DollarSign, color: '#0ea5e9', bg: '#e0f2fe' },
    { label: 'Chargebacks', value: `-\u20AC${totalChargebacks.toFixed(2)}`, icon: Calculator, color: '#ef4444', bg: '#fee2e2' },
    { label: 'Saldo Liquido', value: `\u20AC${saldoFinal.toFixed(2)}`, icon: TrendingUp, color: '#22c55e', bg: '#dcfce7' },
    { label: 'Vendas', value: vendas.length, icon: Clock, color: '#f97316', bg: '#ffedd5' },
  ]

  const statusStyles: Record<string, { bg: string; color: string }> = {
    pendente: { bg: '#fef3c7', color: '#92400e' },
    em_revisao: { bg: '#dbeafe', color: '#1e40af' },
    processado: { bg: '#ede9fe', color: '#6d28d9' },
    pago: { bg: '#d1fae5', color: '#065f46' },
    cancelado: { bg: '#fee2e2', color: '#991b1b' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="flex-1 overflow-auto md:relative md:z-10 pt-20 md:pt-20 md:ml-64 w-full">
          <div className="p-3 sm:p-4 md:p-5 max-w-5xl mx-auto">
            {/* Mensagem Motivacional */}
            {mensagemDia && (
              <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-xl items-center justify-center text-2xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 18 ? '🌤️' : '🌙'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'}, {user?.full_name?.split(' ')[0]}!
                    </p>
                    <p className="text-sm sm:text-lg font-semibold text-white leading-relaxed">
                      {`"${mensagemDia.mensagem}"`}
                    </p>
                    {mensagemDia.autor && (
                      <p className="mt-2 text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>— {mensagemDia.autor}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#1e293b' }}>Dashboard</h1>
                <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Acompanhe o seu desempenho</p>
              </div>
              <Link href="/vendas/novo" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-5 sm:px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                  <Plus size={20} /> Nova Venda
                </button>
              </Link>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm transition-all hover:shadow-md" >
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl" style={{ background: m.bg }}>
                      <m.icon size={18} className="sm:hidden" style={{ color: m.color }} />
                      <m.icon size={22} className="hidden sm:block" style={{ color: m.color }} />
                    </div>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold" style={{ color: '#1e293b' }}>{m.value}</p>
                  <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 truncate" style={{ color: '#64748b' }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Vendas */}
            <div className="rounded-xl sm:rounded-2xl shadow-sm" >
              <div className="p-4 sm:p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h2 className="text-base sm:text-lg font-bold" style={{ color: '#1e293b' }}>Vendas Recentes</h2>
                <Link href="/vendas" className="text-xs sm:text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#0ea5e9' }}>Ver todas</Link>
              </div>
              {vendas.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center" >
                    <Clock size={24} className="sm:hidden" style={{ color: '#94a3b8' }} />
                    <Clock size={32} className="hidden sm:block" style={{ color: '#94a3b8' }} />
                  </div>
                  <p className="mb-4 text-sm sm:text-lg" style={{ color: '#64748b' }}>Nenhuma venda registrada ainda.</p>
                  <Link href="/vendas/novo">
                    <button className="rounded-xl px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>Registar Primeira Venda</button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr >
                        <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Cliente</th>
                        <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Valor</th>
                        <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Estado</th>
                        <th className="hidden sm:table-cell px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendas.slice(0, 10).map((v) => {
                        const st = statusStyles[v.status] || statusStyles.pendente
                        return (
                          <tr key={v.id} className="transition-colors hover:bg-slate-50" style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>{v.client_name}</p>
                              <p className="text-xs" style={{ color: '#64748b' }}>{v.client_email}</p>
                            </td>
                            <td className="px-5 py-4 font-bold text-sm" style={{ color: '#0ea5e9' }}>{'\u20AC'}{v.amount?.toFixed(2)}</td>
                            <td className="px-5 py-4">
                              <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: st.bg, color: st.color }}>
                                {v.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="hidden sm:table-cell px-5 py-4 text-sm" style={{ color: '#64748b' }}>
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
