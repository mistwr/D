'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Calculator, Flame, Zap, TrendingUp, DollarSign } from 'lucide-react'

interface Comissao { energia_percent: number; telecom_percent: number; energia_fixo: number; telecom_fixo: number }
interface Detalhe { venda_id: string; client_name: string; service_type: string; operator: string; amount: number; comissao: number; status: string }
interface Calculo { energia: number; telecom: number; total: number; detalhes: Detalhe[] }

export default function SimuladorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [comissao, setComissao] = useState<Comissao | null>(null)
  const [calculo, setCalculo] = useState<Calculo | null>(null)
  const [loading, setLoading] = useState(true)

  // Simulador
  const [simValor, setSimValor] = useState('')
  const [simTipo, setSimTipo] = useState<'energia' | 'telecom'>('telecom')

  useEffect(() => {
    async function load() {
      const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).catch(() => null)
      if (!me?.user || me.user.role !== 'parceiro') { router.push('/login'); return }
      setUser(me.user)
      const res = await fetch('/api/comissoes', { credentials: 'include' }).then(r => r.json())
      setComissao(res.comissao)
      setCalculo(res.calculo)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  const simResult = (() => {
    if (!comissao || !simValor) return 0
    const val = parseFloat(simValor) || 0
    if (simTipo === 'energia') return (val * comissao.energia_percent / 100) + comissao.energia_fixo
    return (val * comissao.telecom_percent / 100) + comissao.telecom_fixo
  })()

  const pagasCount = calculo?.detalhes.filter(d => d.status === 'pago').length || 0
  const pagasTotal = calculo?.detalhes.filter(d => d.status === 'pago').reduce((s, d) => s + d.comissao, 0) || 0
  const pendentesTotal = (calculo?.total || 0) - pagasTotal

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <Calculator size={28} style={{ color: '#4338ca' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Simulador de Comissoes</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>Simule os seus ganhos e veja quanto tem a receber</p>
              </div>
            </div>

            {!comissao ? (
              <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <Calculator size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium" style={{ color: '#374151' }}>Comissoes ainda nao definidas</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>O administrador precisa de definir as suas percentagens de comissao.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* As suas taxas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Flame size={20} style={{ color: '#d97706' }} />
                      <h3 className="font-bold" style={{ color: '#92400e' }}>Energia</h3>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-3xl font-bold" style={{ color: '#d97706' }}>{comissao.energia_percent}%</p>
                        <p className="text-xs" style={{ color: '#92400e' }}>sobre o valor</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold" style={{ color: '#d97706' }}>{'\u20AC'}{comissao.energia_fixo.toFixed(2)}</p>
                        <p className="text-xs" style={{ color: '#92400e' }}>fixo por venda</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl p-5 shadow-sm" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={20} style={{ color: '#4338ca' }} />
                      <h3 className="font-bold" style={{ color: '#3730a3' }}>Telecomunicacoes</h3>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-3xl font-bold" style={{ color: '#4338ca' }}>{comissao.telecom_percent}%</p>
                        <p className="text-xs" style={{ color: '#3730a3' }}>sobre o valor</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold" style={{ color: '#4338ca' }}>{'\u20AC'}{comissao.telecom_fixo.toFixed(2)}</p>
                        <p className="text-xs" style={{ color: '#3730a3' }}>fixo por venda</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulador */}
                <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: '#111827' }}>
                      <Calculator size={18} /> Simular Comissao
                    </h2>
                    <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Introduza um valor de venda para calcular a sua comissao</p>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Tipo de servico</label>
                        <select value={simTipo} onChange={e => setSimTipo(e.target.value as any)}
                          className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}>
                          <option value="telecom">Telecomunicacoes</option>
                          <option value="energia">Energia</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Valor da venda (EUR)</label>
                        <input type="number" step="0.01" min="0" value={simValor} onChange={e => setSimValor(e.target.value)} placeholder="1500.00"
                          className="w-full rounded-lg px-4 py-2.5 text-sm" style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }} />
                      </div>
                      <div className="rounded-lg p-3 text-center" style={{ background: '#d1fae5', border: '1px solid #6ee7b7' }}>
                        <p className="text-xs font-medium" style={{ color: '#065f46' }}>Comissao estimada</p>
                        <p className="text-2xl font-bold" style={{ color: '#059669' }}>{'\u20AC'}{simResult.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Quick sims */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs" style={{ color: '#6b7280' }}>Simulacao rapida:</span>
                      {[500, 1000, 2500, 5000, 10000].map(val => (
                        <button key={val} onClick={() => setSimValor(val.toString())}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                          style={{ background: simValor === val.toString() ? '#4338ca' : '#f3f4f6', color: simValor === val.toString() ? '#fff' : '#374151' }}>
                          {'\u20AC'}{val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Resumo total */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    <DollarSign size={20} style={{ color: '#059669' }} className="mb-2" />
                    <p className="text-2xl font-bold" style={{ color: '#059669' }}>{'\u20AC'}{(calculo?.total || 0).toFixed(2)}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>Total comissoes</p>
                  </div>
                  <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    <Flame size={20} style={{ color: '#d97706' }} className="mb-2" />
                    <p className="text-2xl font-bold" style={{ color: '#d97706' }}>{'\u20AC'}{(calculo?.energia || 0).toFixed(2)}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>Energia</p>
                  </div>
                  <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    <Zap size={20} style={{ color: '#4338ca' }} className="mb-2" />
                    <p className="text-2xl font-bold" style={{ color: '#4338ca' }}>{'\u20AC'}{(calculo?.telecom || 0).toFixed(2)}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>Telecom</p>
                  </div>
                  <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    <TrendingUp size={20} style={{ color: '#0891b2' }} className="mb-2" />
                    <p className="text-2xl font-bold" style={{ color: '#0891b2' }}>{calculo?.detalhes.length || 0}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>Vendas elegíveis</p>
                  </div>
                </div>

                {/* Detalhes por venda */}
                {calculo && calculo.detalhes.length > 0 && (
                  <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <h2 className="font-bold" style={{ color: '#111827' }}>Detalhe por Venda</h2>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: '#d1fae5', color: '#065f46' }}>
                          Pagas: {'\u20AC'}{pagasTotal.toFixed(2)} ({pagasCount})
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: '#fef3c7', color: '#92400e' }}>
                          Pendentes: {'\u20AC'}{pendentesTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          {['Cliente', 'Tipo', 'Operadora', 'Valor Venda', 'Comissao', 'Estado'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {calculo.detalhes.map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: '#111827' }}>{d.client_name}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: d.service_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: d.service_type === 'energia' ? '#92400e' : '#4338ca' }}>
                                  {d.service_type === 'energia' ? 'Energia' : 'Telecom'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: '#374151' }}>{d.operator}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: '#374151' }}>{'\u20AC'}{d.amount.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm font-bold" style={{ color: '#059669' }}>{'\u20AC'}{d.comissao.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: d.status === 'pago' ? '#d1fae5' : '#fef3c7', color: d.status === 'pago' ? '#065f46' : '#92400e' }}>
                                  {d.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
