'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Calculator, Flame, Zap, TrendingUp, DollarSign, Wifi, Shield } from 'lucide-react'

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
interface Comissao { energia_percent: number; telecom_percent: number; energia_fixo: number; telecom_fixo: number }
interface Detalhe { venda_id: string; client_name: string; service_type: string; operator: string; amount: number; comissao: number; status: string }
interface Calculo { energia: number; telecom: number; total: number; detalhes: Detalhe[] }

const SERVICO_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  telecom:  { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
  energia:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  gas:      { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  seguros:  { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
}

function ServicoIcon({ s }: { s: string }) {
  if (s === 'telecom') return <Wifi size={14} style={{ color: '#4338ca' }} />
  if (s === 'energia') return <Zap size={14} style={{ color: '#d97706' }} />
  if (s === 'gas') return <Flame size={14} style={{ color: '#dc2626' }} />
  return <Shield size={14} style={{ color: '#059669' }} />
}

export default function SimuladorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [comissao, setComissao] = useState<Comissao | null>(null)
  const [comissoesOp, setComissoesOp] = useState<ComissaoOp[]>([])
  const [calculo, setCalculo] = useState<Calculo | null>(null)
  const [loading, setLoading] = useState(true)

  // Simulador
  const [simValor, setSimValor] = useState('')
  const [simMensalidade, setSimMensalidade] = useState('')
  const [simTipo, setSimTipo] = useState<'energia' | 'telecom'>('telecom')
  const [simOperadora, setSimOperadora] = useState('')

  useEffect(() => {
    async function load() {
      const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).catch(() => null)
      if (!me?.user || me.user.role !== 'parceiro') { router.push('/login'); return }
      setUser(me.user)
      const res = await fetch('/api/comissoes', { credentials: 'include' }).then(r => r.json())
      setComissao(res.comissao ?? null)
      setComissoesOp(res.comissoesOp ?? [])
      setCalculo(res.calculo ?? null)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  // Encontrar comissao especifica para operadora/tipo selecionado
  const opRow = simOperadora
    ? comissoesOp.find(o => o.operadora === simOperadora && o.servico === simTipo)
    : null

  const simResult = (() => {
    const val = parseFloat(simValor) || 0
    const mens = parseFloat(simMensalidade) || 0
    if (opRow) {
      if (opRow.modelo === 'mensalidade') {
        // mensalidades × valor_mensal
        const m = mens > 0 ? mens : (opRow.num_mensalidades || 0)
        return m * (opRow.valor_mensal || 0)
      }
      if (opRow.modelo === 'percentagem') return val * (opRow.percentagem || 0) / 100
      return opRow.valor_comissao || 0
    }
    if (!comissao || !val) return 0
    if (simTipo === 'energia') return (val * comissao.energia_percent / 100) + comissao.energia_fixo
    return (val * comissao.telecom_percent / 100) + comissao.telecom_fixo
  })()

  const pagasTotal = calculo?.detalhes.filter(d => d.status === 'pago').reduce((s, d) => s + d.comissao, 0) || 0
  const pendentesTotal = (calculo?.total || 0) - pagasTotal

  // Operadoras disponiveis para o tipo selecionado no simulador
  const opsDisponiveis = [...new Set(comissoesOp.filter(o => o.servico === simTipo).map(o => o.operadora))]

  // Agrupar comissoes por servico
  const grouped: Record<string, ComissaoOp[]> = {}
  for (const c of comissoesOp) {
    if (!grouped[c.servico]) grouped[c.servico] = []
    grouped[c.servico].push(c)
  }
  const hasData = comissoesOp.length > 0 || comissao

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
                <p className="text-sm" style={{ color: '#6b7280' }}>Simule os seus ganhos com base nas suas tabelas de comissao</p>
              </div>
            </div>

            {!hasData ? (
              <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <Calculator size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium" style={{ color: '#374151' }}>Comissoes ainda nao definidas</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>O administrador precisa de definir as suas taxas de comissao.</p>
              </div>
            ) : (
              <div className="space-y-6">

                {/* SIMULADOR */}
                <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="px-5 py-4" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <h2 className="font-bold flex items-center gap-2" style={{ color: '#111827' }}>
                      <Calculator size={18} /> Simular Comissao
                    </h2>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Tipo de servico</label>
                        <div className="flex gap-2">
                          {(['telecom', 'energia'] as const).map(t => (
                            <button key={t} type="button"
                              onClick={() => { setSimTipo(t); setSimOperadora('') }}
                              className="flex-1 rounded-lg py-2.5 text-sm font-semibold border transition"
                              style={{
                                background: simTipo === t ? '#4f46e5' : '#f9fafb',
                                color: simTipo === t ? '#fff' : '#374151',
                                border: simTipo === t ? '1px solid #4f46e5' : '1px solid #e5e7eb',
                              }}>
                              {t === 'telecom' ? 'Telecom' : 'Energia'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {opsDisponiveis.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Operadora</label>
                          <select value={simOperadora} onChange={e => setSimOperadora(e.target.value)}
                            className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}>
                            <option value="">-- Todas / Geral --</option>
                            {opsDisponiveis.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      )}

                      {/* Se modelo mensalidade: mostrar campos mensalidade */}
                      {opRow?.modelo === 'mensalidade' ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Mensalidade (€/mes)</label>
                            <input type="number" step="0.01" min="0"
                              value={simMensalidade || opRow.valor_mensal}
                              onChange={e => setSimMensalidade(e.target.value)}
                              className="w-full rounded-lg px-3 py-2.5 text-sm"
                              style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}
                              placeholder={opRow.valor_mensal.toFixed(2)} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Num. mensalidades</label>
                            <input type="number" step="0.5" min="0.5"
                              value={simMensalidade ? '' : ''}
                              onChange={e => setSimMensalidade(e.target.value)}
                              className="w-full rounded-lg px-3 py-2.5 text-sm"
                              style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}
                              placeholder={String(opRow.num_mensalidades)} />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Valor da venda (€)</label>
                          <input type="number" step="0.01" min="0" value={simValor}
                            onChange={e => setSimValor(e.target.value)} placeholder="Ex: 1500.00"
                            className="w-full rounded-lg px-3 py-2.5 text-sm"
                            style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }} />
                        </div>
                      )}

                      <div className="rounded-xl p-4 text-center" style={{ background: '#d1fae5', border: '1px solid #6ee7b7' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: '#065f46' }}>Comissao estimada</p>
                        <p className="text-3xl font-bold" style={{ color: '#059669' }}>€{simResult.toFixed(2)}</p>
                        {opRow && (
                          <p className="text-xs mt-1" style={{ color: '#065f46' }}>
                            {opRow.modelo === 'mensalidade'
                              ? `${opRow.num_mensalidades} × €${opRow.valor_mensal}/mes`
                              : opRow.modelo === 'percentagem'
                              ? `${opRow.percentagem}% do valor`
                              : `Fixo: €${opRow.valor_comissao}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick sims valores */}
                    {(!opRow || opRow.modelo !== 'mensalidade') && (
                      <div className="mt-4 flex flex-wrap gap-2 items-center">
                        <span className="text-xs" style={{ color: '#6b7280' }}>Valores rapidos:</span>
                        {[500, 1000, 2500, 5000, 10000].map(val => (
                          <button key={val} type="button" onClick={() => setSimValor(String(val))}
                            className="px-3 py-1 rounded-full text-xs font-medium transition"
                            style={{
                              background: simValor === String(val) ? '#4338ca' : '#f3f4f6',
                              color: simValor === String(val) ? '#fff' : '#374151',
                            }}>
                            €{val}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* TABELA DE COMISSOES POR OPERADORA */}
                {Object.keys(grouped).length > 0 && (
                  <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    <div className="px-5 py-4" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <h2 className="font-bold" style={{ color: '#111827' }}>As Suas Tabelas de Comissao</h2>
                      <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Definidas pelo administrador por operadora e servico</p>
                    </div>
                    <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                      {Object.entries(grouped).map(([servico, items]) => {
                        const st = SERVICO_STYLE[servico] || SERVICO_STYLE.telecom
                        return (
                          <div key={servico} className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                                <ServicoIcon s={servico} />
                                {servico.charAt(0).toUpperCase() + servico.slice(1)}
                              </span>
                              <span className="text-xs" style={{ color: '#9ca3af' }}>{items.length} entrada{items.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    {['Operadora', 'Plano', 'Modelo', 'Comissao'].map(h => (
                                      <th key={h} className="pb-2 text-left text-xs font-semibold uppercase" style={{ color: '#9ca3af' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((c, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                                      <td className="py-2.5 font-semibold" style={{ color: '#111827' }}>{c.operadora}</td>
                                      <td className="py-2.5" style={{ color: '#6b7280' }}>{c.plano || '—'}</td>
                                      <td className="py-2.5">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#f3f4f6', color: '#374151' }}>
                                          {c.modelo === 'mensalidade' ? 'Mensalidade' : c.modelo === 'percentagem' ? 'Percentagem' : 'Fixo'}
                                        </span>
                                      </td>
                                      <td className="py-2.5 font-bold" style={{ color: '#059669' }}>
                                        {c.modelo === 'mensalidade'
                                          ? `${c.num_mensalidades}x €${(c.valor_mensal || 0).toFixed(2)}/mes = €${((c.num_mensalidades || 0) * (c.valor_mensal || 0)).toFixed(2)}`
                                          : c.modelo === 'percentagem'
                                          ? `${c.percentagem}%`
                                          : `€${(c.valor_comissao || 0).toFixed(2)}`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Resumo total */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total comissoes', val: calculo?.total || 0, icon: <DollarSign size={20} style={{ color: '#059669' }} />, color: '#059669', bg: '#d1fae5' },
                    { label: 'Energia', val: calculo?.energia || 0, icon: <Zap size={20} style={{ color: '#d97706' }} />, color: '#d97706', bg: '#fef3c7' },
                    { label: 'Telecom', val: calculo?.telecom || 0, icon: <Wifi size={20} style={{ color: '#4338ca' }} />, color: '#4338ca', bg: '#eef2ff' },
                    { label: 'Ja pagas', val: pagasTotal, icon: <TrendingUp size={20} style={{ color: '#0891b2' }} />, color: '#0891b2', bg: '#e0f2fe' },
                  ].map(({ label, val, icon, color, bg }) => (
                    <div key={label} className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: bg }}>{icon}</div>
                      <p className="text-2xl font-bold" style={{ color }}>€{val.toFixed(2)}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Detalhes por venda */}
                {calculo && calculo.detalhes.length > 0 && (
                  <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    <div className="px-5 py-4" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <h2 className="font-bold" style={{ color: '#111827' }}>Detalhe por Venda</h2>
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#d1fae5', color: '#065f46' }}>
                          Pagas: €{pagasTotal.toFixed(2)}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#fef3c7', color: '#92400e' }}>
                          Pendentes: €{pendentesTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            {['Cliente', 'Tipo', 'Operadora', 'Valor Venda', 'Comissao', 'Estado'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {calculo.detalhes.map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td className="px-4 py-3 text-sm font-medium" style={{ color: '#111827' }}>{d.client_name}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ background: d.service_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: d.service_type === 'energia' ? '#92400e' : '#4338ca' }}>
                                  {d.service_type === 'energia' ? 'Energia' : 'Telecom'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: '#374151' }}>{d.operator}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: '#374151' }}>€{(d.amount || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 font-bold text-sm" style={{ color: '#059669' }}>€{(d.comissao || 0).toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={{ background: d.status === 'pago' ? '#d1fae5' : '#fef3c7', color: d.status === 'pago' ? '#065f46' : '#92400e' }}>
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
