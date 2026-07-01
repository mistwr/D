'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  AlertTriangle, Zap, Wifi, Phone, PhoneOff, MessageSquare,
  RefreshCw, Check, CheckCheck, ShoppingBag
} from 'lucide-react'

interface VendaAlerta {
  id: string
  client_name: string
  operator?: string
  amount?: number
  created_at: string
  parceiro_name?: string
  data_contacto_energia?: string
  data_fidelizacao_telecom?: string
  service_type?: string
}

interface AlertaData {
  energia: VendaAlerta[]
  telecom: VendaAlerta[]
  pendente_chamada: VendaAlerta[]
  pendente_ativacao_sms: VendaAlerta[]
  cliente_nao_atende: VendaAlerta[]
  novas_hoje: VendaAlerta[]
  counts: Record<string, number>
}

const TABS = [
  { key: 'energia',             label: 'Energia a Contactar',    icon: Zap,           color: '#f97316', bg: '#fff7ed' },
  { key: 'telecom',             label: 'Telecom a Contactar',     icon: Wifi,          color: '#0ea5e9', bg: '#e0f2fe' },
  { key: 'pendente_chamada',    label: 'Pendentes de Chamada',    icon: Phone,         color: '#0e7490', bg: '#cffafe' },
  { key: 'pendente_ativacao_sms', label: 'Pendentes Ativacao SMS', icon: MessageSquare, color: '#6d28d9', bg: '#ede9fe' },
  { key: 'cliente_nao_atende',  label: 'Cliente Nao Atende',      icon: PhoneOff,      color: '#b45309', bg: '#fef3c7' },
  { key: 'novas_hoje',          label: 'Novas Vendas Hoje',       icon: ShoppingBag,   color: '#16a34a', bg: '#dcfce7' },
]

export default function AlertasPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [data, setData] = useState<AlertaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('energia')
  const [marking, setMarking] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await authFetch('/api/alertas')
      if (res.ok) setData(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [user])

  async function marcarContactado(vendaId: string) {
    setMarking(vendaId)
    await authFetch('/api/alertas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'fidelizacao', venda_id: vendaId }),
    })
    await fetchData()
    setMarking(null)
  }

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  }

  if (!user) return <div>Erro de autenticacao</div>

  const activeItems = data ? (data as any)[activeTab] as VendaAlerta[] : []
  const activeTab_ = TABS.find(t => t.key === activeTab)!

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 md:ml-64 pt-14 md:pt-16 pb-20 md:pb-8" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Centro de Alertas</h1>
                <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Clientes prioritarios por categoria</p>
              </div>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
                style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569' }}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {TABS.map(tab => {
                const count = data?.counts[tab.key] || 0
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="rounded-xl p-4 text-left transition-all"
                    style={{
                      background: activeTab === tab.key ? tab.bg : '#fff',
                      border: activeTab === tab.key ? `2px solid ${tab.color}` : '1px solid #e2e8f0',
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg mb-2" style={{ background: tab.bg }}>
                      <Icon size={16} style={{ color: tab.color }} />
                    </div>
                    <p className="text-xl font-bold" style={{ color: activeTab === tab.key ? tab.color : '#1e293b' }}>
                      {data?.counts[tab.key] ?? (loading ? '...' : 0)}
                    </p>
                    <p className="text-xs mt-0.5 leading-tight" style={{ color: '#64748b' }}>{tab.label}</p>
                  </button>
                )
              })}
            </div>

            {/* Active tab content */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #e2e8f0', background: activeTab_.bg }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: '#fff' }}>
                  <activeTab_.icon size={18} style={{ color: activeTab_.color }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold" style={{ color: activeTab_.color }}>{activeTab_.label}</h2>
                  <p className="text-xs" style={{ color: '#64748b' }}>{activeItems.length} registo{activeItems.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#0ea5e9' }} />
                </div>
              ) : activeItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <CheckCheck size={40} style={{ color: '#d1d5db' }} className="mb-3" />
                  <p className="font-medium" style={{ color: '#475569' }}>Nenhum alerta nesta categoria</p>
                  <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Tudo em dia!</p>
                </div>
              ) : (
                <div className="divide-y" style={{ divideColor: '#f1f5f9' }}>
                  {activeItems.map(item => {
                    const isFidelizacao = activeTab === 'energia' || activeTab === 'telecom'
                    const dataAlerta = activeTab === 'energia'
                      ? item.data_contacto_energia
                      : activeTab === 'telecom'
                      ? item.data_fidelizacao_telecom
                      : null

                    return (
                      <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-sm truncate" style={{ color: '#1e293b' }}>{item.client_name}</p>
                            {item.operator && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                                style={{ background: activeTab_.bg, color: activeTab_.color }}>
                                {item.operator}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: '#64748b' }}>
                            {item.parceiro_name && <span>Parceiro: {item.parceiro_name}</span>}
                            {item.amount != null && <span>€{item.amount.toFixed(2)}</span>}
                            {dataAlerta && (
                              <span className="font-medium" style={{ color: activeTab_.color }}>
                                Data: {new Date(dataAlerta).toLocaleDateString('pt-PT')}
                              </span>
                            )}
                            {!dataAlerta && (
                              <span>{new Date(item.created_at).toLocaleDateString('pt-PT')}</span>
                            )}
                          </div>
                        </div>
                        {isFidelizacao && (
                          <button
                            onClick={() => marcarContactado(item.id)}
                            disabled={marking === item.id}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium flex-shrink-0 disabled:opacity-50"
                            style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
                          >
                            <Check size={13} />
                            {marking === item.id ? '...' : 'Contactado'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
