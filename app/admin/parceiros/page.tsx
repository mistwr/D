'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Users, ShoppingCart, Mail, Building2, Percent, Save, Zap, Flame } from 'lucide-react'

interface Parceiro { id: string; full_name: string; email: string; company_name: string }
interface Venda { id: string; user_id: string; client_name: string; amount: number; status: string; service_type: string; operator: string }
interface Comissao { energia_percent: number; telecom_percent: number; energia_fixo: number; telecom_fixo: number }
interface Calculo { energia: number; telecom: number; total: number; detalhes: any[] }

export default function ParceirosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<'vendas' | 'comissoes'>('vendas')
  const [comForm, setComForm] = useState<Comissao>({ energia_percent: 0, telecom_percent: 0, energia_fixo: 0, telecom_fixo: 0 })
  const [calculo, setCalculo] = useState<Calculo | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).catch(() => null)
      if (!me?.user || me.user.role !== 'admin') { router.push('/login'); return }
      setUser(me.user)
      const [p, v] = await Promise.all([
        fetch('/api/vendas?parceiros=1', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/vendas', { credentials: 'include' }).then(r => r.json()),
      ])
      setParceiros(p.parceiros || [])
      setVendas(v.vendas || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function loadComissao(pid: string) {
    const res = await fetch(`/api/comissoes?parceiro_id=${pid}`, { credentials: 'include' }).then(r => r.json())
    if (res.comissao) {
      setComForm({ energia_percent: res.comissao.energia_percent, telecom_percent: res.comissao.telecom_percent, energia_fixo: res.comissao.energia_fixo, telecom_fixo: res.comissao.telecom_fixo })
    } else {
      setComForm({ energia_percent: 0, telecom_percent: 0, energia_fixo: 0, telecom_fixo: 0 })
    }
    setCalculo(res.calculo || null)
  }

  async function selectParceiro(pid: string) {
    setSelected(pid)
    setTab('vendas')
    setSaved(false)
    await loadComissao(pid)
  }

  async function saveComissao() {
    if (!selected) return
    setSaving(true)
    await fetch('/api/comissoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ parceiro_id: selected, ...comForm }),
    })
    await loadComissao(selected)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  const getParceiroVendas = (pid: string) => vendas.filter(v => v.user_id === pid)
  const getTotal = (pid: string) => getParceiroVendas(pid).reduce((s, v) => s + v.amount, 0)
  const selectedParceiro = parceiros.find(p => p.id === selected)
  const selectedVendas = selected ? getParceiroVendas(selected) : []

  const inputStyle = { border: '1px solid #d1d5db', background: '#fff', color: '#111827' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <Users size={28} style={{ color: '#4338ca' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Parceiros</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>{parceiros.length} parceiros registados - Definir comissoes por parceiro</p>
              </div>
            </div>

            {parceiros.length === 0 ? (
              <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <Users size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium" style={{ color: '#374151' }}>Nenhum parceiro registado</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>Os parceiros aparecem aqui quando se registam na plataforma.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista */}
                <div className="lg:col-span-1">
                  <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    <div className="p-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <h2 className="font-semibold text-sm" style={{ color: '#374151' }}>Selecionar Parceiro</h2>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {parceiros.map(p => {
                        const isActive = selected === p.id
                        return (
                          <button key={p.id} onClick={() => selectParceiro(p.id)} className="w-full text-left p-4 transition-colors"
                            style={{ borderBottom: '1px solid #f3f4f6', background: isActive ? '#eef2ff' : '#fff' }}>
                            <p className="font-medium text-sm" style={{ color: '#111827' }}>{p.full_name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Mail size={12} style={{ color: '#9ca3af' }} />
                              <span className="text-xs" style={{ color: '#6b7280' }}>{p.email}</span>
                            </div>
                            {p.company_name && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Building2 size={12} style={{ color: '#9ca3af' }} />
                                <span className="text-xs" style={{ color: '#6b7280' }}>{p.company_name}</span>
                              </div>
                            )}
                            <div className="flex gap-3 mt-2">
                              <span className="text-xs font-medium" style={{ color: '#4338ca' }}>{getParceiroVendas(p.id).length} vendas</span>
                              <span className="text-xs font-medium" style={{ color: '#059669' }}>{'\u20AC'}{getTotal(p.id).toFixed(2)}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Detalhe */}
                <div className="lg:col-span-2">
                  {!selected ? (
                    <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                      <Percent size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                      <p style={{ color: '#6b7280' }}>Selecione um parceiro para ver vendas e definir comissoes</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Tab Switcher */}
                      <div className="flex gap-2">
                        <button onClick={() => setTab('vendas')} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{ background: tab === 'vendas' ? '#4338ca' : '#fff', color: tab === 'vendas' ? '#fff' : '#374151', border: '1px solid #e5e7eb' }}>
                          <ShoppingCart size={14} className="inline mr-1.5" />Vendas ({selectedVendas.length})
                        </button>
                        <button onClick={() => setTab('comissoes')} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          style={{ background: tab === 'comissoes' ? '#4338ca' : '#fff', color: tab === 'comissoes' ? '#fff' : '#374151', border: '1px solid #e5e7eb' }}>
                          <Percent size={14} className="inline mr-1.5" />Comissoes
                        </button>
                      </div>

                      {/* Tab: Vendas */}
                      {tab === 'vendas' && (
                        <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                          <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <h2 className="font-bold" style={{ color: '#111827' }}>Vendas de {selectedParceiro?.full_name}</h2>
                          </div>
                          {selectedVendas.length === 0 ? (
                            <div className="p-8 text-center"><p style={{ color: '#6b7280' }}>Este parceiro ainda nao tem vendas.</p></div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                  {['Cliente', 'Servico', 'Operadora', 'Valor', 'Estado'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>{h}</th>
                                  ))}
                                </tr></thead>
                                <tbody>
                                  {selectedVendas.map(v => (
                                    <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                      <td className="px-4 py-3 text-sm font-medium" style={{ color: '#111827' }}>{v.client_name}</td>
                                      <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: v.service_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: v.service_type === 'energia' ? '#92400e' : '#4338ca' }}>
                                          {v.service_type === 'energia' ? 'Energia' : 'Telecom'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm" style={{ color: '#111827' }}>{v.operator || '-'}</td>
                                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#111827' }}>{'\u20AC'}{v.amount?.toFixed(2)}</td>
                                      <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: '#eef2ff', color: '#4338ca' }}>{v.status}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab: Comissoes */}
                      {tab === 'comissoes' && (
                        <div className="space-y-4">
                          {/* Formulario */}
                          <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                            <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                              <h2 className="font-bold" style={{ color: '#111827' }}>Definir Comissoes - {selectedParceiro?.full_name}</h2>
                              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Percentagem sobre o valor da venda + valor fixo por venda</p>
                            </div>
                            <div className="p-5 space-y-5">
                              {/* Energia */}
                              <div className="rounded-lg p-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                                <div className="flex items-center gap-2 mb-3">
                                  <Flame size={18} style={{ color: '#d97706' }} />
                                  <h3 className="font-semibold text-sm" style={{ color: '#92400e' }}>Energia</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#92400e' }}>Percentagem (%)</label>
                                    <input type="number" step="0.1" min="0" max="100" value={comForm.energia_percent}
                                      onChange={e => setComForm(f => ({ ...f, energia_percent: parseFloat(e.target.value) || 0 }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#92400e' }}>Fixo por venda (EUR)</label>
                                    <input type="number" step="0.5" min="0" value={comForm.energia_fixo}
                                      onChange={e => setComForm(f => ({ ...f, energia_fixo: parseFloat(e.target.value) || 0 }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                                  </div>
                                </div>
                              </div>

                              {/* Telecom */}
                              <div className="rounded-lg p-4" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                                <div className="flex items-center gap-2 mb-3">
                                  <Zap size={18} style={{ color: '#4338ca' }} />
                                  <h3 className="font-semibold text-sm" style={{ color: '#3730a3' }}>Telecomunicacoes</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#3730a3' }}>Percentagem (%)</label>
                                    <input type="number" step="0.1" min="0" max="100" value={comForm.telecom_percent}
                                      onChange={e => setComForm(f => ({ ...f, telecom_percent: parseFloat(e.target.value) || 0 }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#3730a3' }}>Fixo por venda (EUR)</label>
                                    <input type="number" step="0.5" min="0" value={comForm.telecom_fixo}
                                      onChange={e => setComForm(f => ({ ...f, telecom_fixo: parseFloat(e.target.value) || 0 }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button onClick={saveComissao} disabled={saving}
                                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity"
                                  style={{ background: '#4338ca', opacity: saving ? 0.7 : 1 }}>
                                  <Save size={16} /> {saving ? 'A guardar...' : 'Guardar Comissoes'}
                                </button>
                                {saved && <span className="text-sm font-medium" style={{ color: '#059669' }}>Guardado com sucesso!</span>}
                              </div>
                            </div>
                          </div>

                          {/* Resumo calculado */}
                          {calculo && (
                            <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                              <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb', background: '#f0fdf4' }}>
                                <h2 className="font-bold" style={{ color: '#065f46' }}>Comissoes Estimadas</h2>
                              </div>
                              <div className="p-5">
                                <div className="grid grid-cols-3 gap-4 mb-5">
                                  <div className="rounded-lg p-4 text-center" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                                    <p className="text-xs font-medium" style={{ color: '#92400e' }}>Energia</p>
                                    <p className="text-xl font-bold mt-1" style={{ color: '#d97706' }}>{'\u20AC'}{calculo.energia.toFixed(2)}</p>
                                  </div>
                                  <div className="rounded-lg p-4 text-center" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                                    <p className="text-xs font-medium" style={{ color: '#3730a3' }}>Telecom</p>
                                    <p className="text-xl font-bold mt-1" style={{ color: '#4338ca' }}>{'\u20AC'}{calculo.telecom.toFixed(2)}</p>
                                  </div>
                                  <div className="rounded-lg p-4 text-center" style={{ background: '#d1fae5', border: '1px solid #6ee7b7' }}>
                                    <p className="text-xs font-medium" style={{ color: '#065f46' }}>Total</p>
                                    <p className="text-xl font-bold mt-1" style={{ color: '#059669' }}>{'\u20AC'}{calculo.total.toFixed(2)}</p>
                                  </div>
                                </div>
                                {calculo.detalhes.length > 0 && (
                                  <table className="w-full">
                                    <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                      {['Cliente', 'Tipo', 'Operadora', 'Venda', 'Comissao'].map(h => (
                                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>{h}</th>
                                      ))}
                                    </tr></thead>
                                    <tbody>
                                      {calculo.detalhes.map((d: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                          <td className="px-3 py-2 text-sm" style={{ color: '#111827' }}>{d.client_name}</td>
                                          <td className="px-3 py-2">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: d.service_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: d.service_type === 'energia' ? '#92400e' : '#4338ca' }}>
                                              {d.service_type === 'energia' ? 'Energia' : 'Telecom'}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-sm" style={{ color: '#374151' }}>{d.operator}</td>
                                          <td className="px-3 py-2 text-sm" style={{ color: '#374151' }}>{'\u20AC'}{d.amount.toFixed(2)}</td>
                                          <td className="px-3 py-2 text-sm font-bold" style={{ color: '#059669' }}>{'\u20AC'}{d.comissao.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
