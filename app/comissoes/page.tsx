'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Percent, Zap, Flame, Shield, Wifi } from 'lucide-react'

interface ComissaoOp {
  id: string
  servico: string
  operadora: string
  plano: string
  modelo: string
  valor_comissao: number
  num_mensalidades: number
  valor_mensal: number
  percentagem: number
}

const SERVICO_LABEL: Record<string, string> = {
  energia: 'Energia', gas: 'Gas', seguros: 'Seguros', telecom: 'Telecom',
}

function ServicoIcon({ servico }: { servico: string }) {
  if (servico === 'telecom') return <Wifi size={15} style={{ color: '#0ea5e9' }} />
  if (servico === 'energia') return <Zap size={15} style={{ color: '#d97706' }} />
  if (servico === 'gas')    return <Flame size={15} style={{ color: '#dc2626' }} />
  return <Shield size={15} style={{ color: '#059669' }} />
}

const SERVICO_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  telecom:  { bg: '#eef2ff', color: '#0ea5e9', border: '#c7d2fe' },
  energia:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  gas:      { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  seguros:  { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
}

export default function ComissoesPage() {
  const { user, loading: authLoading, authFetch } = useAuth('parceiro')
  const [comissoes, setComissoes] = useState<ComissaoOp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    authFetch('/api/comissoes/operadora')
      .then(r => r.json())
      .then(d => setComissoes(d.comissoes || []))
      .finally(() => setLoading(false))
  }, [user, authFetch])

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )

  // Agrupar por servico
  const grouped: Record<string, ComissaoOp[]> = {}
  for (const c of comissoes) {
    if (!grouped[c.servico]) grouped[c.servico] = []
    grouped[c.servico].push(c)
  }

  // Para mensalidades telecom o valor e dinamico (depende da mensalidade do cliente), nao somamos aqui
  const totalPorServico = (items: ComissaoOp[]) => items.reduce((s, c) => {
    if (c.modelo === 'mensalidade') return s
    return s + (c.valor_comissao || 0)
  }, 0)

  function labelMensalidades(n: number): string {
    if (n === 0.5) return 'meia mensalidade'
    if (n === 1) return '1 mensalidade'
    if (n === 1.5) return '1.5 mensalidades'
    if (Number.isInteger(n)) return `${n} mensalidades`
    return `${n}x mensalidades`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="w-full lg:ml-64 pt-16">
          <div className="p-4 md:p-5 max-w-7xl mx-auto w-full">

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <Percent size={28} style={{ color: '#0ea5e9' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>As Minhas Comissoes</h1>
                <p className="text-sm" style={{ color: '#64748b' }}>
                  {comissoes.length === 0
                    ? 'Ainda nao tem comissoes definidas'
                    : `${comissoes.length} comissao(oes) definidas pelo administrador`}
                </p>
              </div>
            </div>

            {comissoes.length === 0 ? (
              <div className="rounded-xl p-16 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <Percent size={48} className="mx-auto mb-4" style={{ color: '#d1d5db' }} />
                <p className="text-base font-medium" style={{ color: '#475569' }}>Nenhuma comissao atribuida</p>
                <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>O administrador ainda nao definiu as suas comissoes. Contacte o suporte.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([servico, items]) => {
                  const st = SERVICO_STYLE[servico] || { bg: '#f3f4f6', color: '#475569', border: '#d1d5db' }
                  return (
                    <div key={servico} className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                      {/* Cabecalho do servico */}
                      <div className="flex items-center justify-between px-6 py-4" style={{ background: st.bg, borderBottom: `1px solid ${st.border}` }}>
                        <div className="flex items-center gap-2">
                          <ServicoIcon servico={servico} />
                          <h2 className="font-bold text-base" style={{ color: st.color }}>
                            {SERVICO_LABEL[servico] || servico}
                          </h2>
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.border, color: st.color }}>
                            {items.length} entrada{items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: st.color }}>
                          Total: €{totalPorServico(items).toFixed(2)}
                        </span>
                      </div>

                      {/* Tabela */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e2e8f0' }}>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>Operadora</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>Plano</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>Modelo</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>Comissao</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((c, i) => {
                              const comissaoLabel = (() => {
                                if (c.modelo === 'mensalidade') {
                                  const n = c.num_mensalidades || 0
                                  const label = labelMensalidades(n)
                                  // telecom: valor calculado dinamicamente (mensalidade do cliente × nº mensalidades)
                                  return (
                                    <div>
                                      <span className="text-base font-bold" style={{ color: '#0ea5e9' }}>x{n}</span>
                                      <span className="ml-2 text-sm font-medium" style={{ color: '#475569' }}>{label}</span>
                                      <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                                        valor calculado com base na mensalidade do cliente
                                      </p>
                                    </div>
                                  )
                                }
                                if (c.modelo === 'percentagem') {
                                  return <span className="text-base font-bold" style={{ color: '#059669' }}>{c.percentagem}%</span>
                                }
                                return <span className="text-base font-bold" style={{ color: '#059669' }}>€{Number(c.valor_comissao).toFixed(2)}</span>
                              })()
                              return (
                                <tr key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                  <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#1e293b' }}>{c.operadora}</td>
                                  <td className="px-5 py-3.5">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.color }}>
                                      {c.plano || '—'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#f8fafc', color: '#475569' }}>
                                      {c.modelo === 'mensalidade' ? 'Mensalidade' : c.modelo === 'percentagem' ? 'Percentagem' : 'Fixo'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5">{comissaoLabel}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
