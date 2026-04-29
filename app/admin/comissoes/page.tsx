'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Percent, Plus, Trash2, X, Check, Zap, Flame, Shield, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'

const OPERADORAS: Record<string, string[]> = {
  energia:  ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Portologos'],
  gas:      ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Portologos'],
  seguros:  ['Fidelidade', 'Tranquilidade', 'Allianz', 'Generali', 'AXA', 'Zurich', 'Ageas'],
  telecom:  ['MEO', 'NOS', 'Vodafone', 'NOWO', 'DIGI'],
}
const PLANOS_TELECOM = ['1P', '2P', '3P', '4P']
const SERVICOS = ['energia', 'gas', 'seguros', 'telecom'] as const
type Servico = typeof SERVICOS[number]

interface Parceiro { id: string; full_name: string; email: string; company_name: string }
interface ComissaoOp { id: string; servico: string; operadora: string; plano: string; valor_comissao: number }
interface FormRow { servico: Servico; operadora: string; plano: string; valor_comissao: string }

export default function AdminComissoesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [selectedParceiro, setSelectedParceiro] = useState<string>('')
  const [comissoes, setComissoes] = useState<ComissaoOp[]>([])
  const [loadingCom, setLoadingCom] = useState(false)
  const [tab, setTab] = useState<Servico>('energia')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormRow>({ servico: 'energia', operadora: 'EDP', plano: '', valor_comissao: '' })
  const [saving, setSaving] = useState(false)

  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok')

  useEffect(() => {
    async function load() {
      const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).catch(() => null)
      if (!me?.user || me.user.role !== 'admin') { router.push('/login'); return }
      setUser(me.user)
      const res = await fetch('/api/vendas?parceiros=1', { credentials: 'include' }).then(r => r.json())
      setParceiros(res.parceiros ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function loadComissoes(pid: string) {
    if (!pid) { setComissoes([]); return }
    setLoadingCom(true)
    const res = await fetch(`/api/comissoes/operadora?parceiro_id=${pid}`, { credentials: 'include' }).then(r => r.json())
    setComissoes(res.comissoes ?? [])
    setLoadingCom(false)
  }

  async function handleSelectParceiro(pid: string) {
    setSelectedParceiro(pid)
    await loadComissoes(pid)
  }

  function flash(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg(text); setMsgType(type)
    setTimeout(() => setMsg(''), 4000)
  }

  function openForm() {
    setForm({ servico: tab, operadora: OPERADORAS[tab][0], plano: tab === 'telecom' ? '1P' : '', valor_comissao: '' })
    setShowForm(true)
  }

  async function saveRow() {
    if (!selectedParceiro) { flash('Selecione primeiro um parceiro', 'err'); return }
    if (!form.valor_comissao) { flash('Valor de comissao obrigatorio', 'err'); return }
    setSaving(true)
    const res = await fetch('/api/comissoes/operadora', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        parceiro_id: selectedParceiro,
        servico: form.servico,
        operadora: form.operadora,
        plano: form.servico === 'telecom' ? form.plano : '',
        valor_comissao: parseFloat(form.valor_comissao) || 0,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { flash(data.error || 'Erro ao guardar', 'err'); return }
    flash('Comissao guardada com sucesso')
    setShowForm(false)
    await loadComissoes(selectedParceiro)
  }

  async function deleteRow(item: ComissaoOp) {
    if (!selectedParceiro) return
    const res = await fetch('/api/comissoes/operadora', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ parceiro_id: selectedParceiro, servico: item.servico, operadora: item.operadora, plano: item.plano ?? '' }),
    })
    if (res.ok) {
      setComissoes(prev => prev.filter(c => c.id !== item.id))
      flash('Comissao removida')
    } else {
      const d = await res.json()
      flash(d.error || 'Erro ao apagar', 'err')
    }
  }

  const inputStyle = { border: '1px solid #d1d5db', background: '#fff', color: '#111827' }
  const tabColors: Record<Servico, { text: string; bg: string; border: string }> = {
    energia: { text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    gas:     { text: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
    seguros: { text: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
    telecom: { text: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
  }
  const tc = tabColors[tab]
  const tabData = comissoes.filter(c => c.servico === tab)
  const parceiroSelecionado = parceiros.find(p => p.id === selectedParceiro)

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4338ca' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8 max-w-5xl">

            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: '#4338ca' }}>
              <ArrowLeft size={16} /> Voltar
            </Link>

            <div className="flex items-center gap-3 mb-8">
              <Percent size={28} style={{ color: '#4338ca' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Comissoes por Parceiro</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>Selecione um parceiro e defina os valores por operadora e plano</p>
              </div>
            </div>

            {/* Flash message */}
            {msg && (
              <div className="mb-5 flex items-center gap-2 rounded-lg p-3 text-sm font-medium"
                style={{ background: msgType === 'ok' ? '#f0fdf4' : '#fef2f2', color: msgType === 'ok' ? '#166534' : '#b91c1c', border: `1px solid ${msgType === 'ok' ? '#86efac' : '#fecaca'}` }}>
                <Check size={15} /> {msg}
              </div>
            )}

            {/* Seletor de Parceiro */}
            <div className="rounded-xl p-6 mb-6 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} style={{ color: '#4338ca' }} />
                <h2 className="font-semibold" style={{ color: '#111827' }}>Selecionar Parceiro</h2>
              </div>
              {parceiros.length === 0 ? (
                <p className="text-sm" style={{ color: '#6b7280' }}>Nenhum parceiro encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {parceiros.map(p => {
                    const isActive = selectedParceiro === p.id
                    return (
                      <button key={p.id} onClick={() => handleSelectParceiro(p.id)}
                        className="text-left rounded-xl p-4 transition-all"
                        style={{
                          border: isActive ? '2px solid #4338ca' : '1px solid #e5e7eb',
                          background: isActive ? '#eef2ff' : '#fff',
                        }}>
                        <p className="font-semibold text-sm" style={{ color: '#111827' }}>{p.full_name}</p>
                        {p.company_name && <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{p.company_name}</p>}
                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{p.email}</p>
                        {isActive && (
                          <span className="mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#4338ca', color: '#fff' }}>
                            Selecionado
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Comissoes do Parceiro Selecionado */}
            {selectedParceiro && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <p className="text-sm font-medium" style={{ color: '#374151' }}>
                    Comissoes de <strong>{parceiroSelecionado?.full_name}</strong>
                  </p>
                  <button onClick={openForm}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                    style={{ background: '#4338ca' }}>
                    <Plus size={15} /> Adicionar Comissao
                  </button>
                </div>

                {/* Tabs de servico */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {SERVICOS.map(s => (
                    <button key={s} onClick={() => setTab(s)}
                      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition"
                      style={{
                        background: tab === s ? '#4338ca' : '#fff',
                        color: tab === s ? '#fff' : '#374151',
                        border: '1px solid #e5e7eb',
                      }}>
                      {s === 'energia' ? <Flame size={14} /> : s === 'telecom' ? <Zap size={14} /> : <Shield size={14} />}
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tabela */}
                <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="px-5 py-4 flex items-center justify-between" style={{ background: tc.bg, borderBottom: `1px solid ${tc.border}` }}>
                    <h3 className="font-bold text-sm" style={{ color: tc.text }}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)} — {tabData.length} {tabData.length === 1 ? 'comissao' : 'comissoes'}
                    </h3>
                  </div>

                  {loadingCom ? (
                    <div className="p-8 flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#4338ca' }} />
                    </div>
                  ) : tabData.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm" style={{ color: '#6b7280' }}>
                        Nenhuma comissao definida para {tab}. Clique em &quot;Adicionar Comissao&quot;.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Operadora</th>
                            {tab === 'telecom' && (
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Plano</th>
                            )}
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Valor (EUR)</th>
                            <th className="px-5 py-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {tabData.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td className="px-5 py-4 font-medium text-sm" style={{ color: '#111827' }}>{c.operadora}</td>
                              {tab === 'telecom' && (
                                <td className="px-5 py-4">
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                                    {c.plano || '-'}
                                  </span>
                                </td>
                              )}
                              <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#059669' }}>
                                {'\u20AC'}{(c.valor_comissao ?? 0).toFixed(2)}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button onClick={() => deleteRow(c)}
                                  className="rounded-lg p-1.5 transition hover:opacity-70"
                                  style={{ background: '#fef2f2' }}
                                  title="Apagar comissao">
                                  <Trash2 size={15} style={{ color: '#dc2626' }} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {!selectedParceiro && !loading && parceiros.length > 0 && (
              <div className="rounded-xl p-10 text-center" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <Percent size={36} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
                <p className="text-sm font-medium" style={{ color: '#6b7280' }}>Selecione um parceiro para ver e editar as suas comissoes</p>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modal Adicionar Comissao */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <h2 className="font-bold" style={{ color: '#111827' }}>Adicionar Comissao</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X size={18} style={{ color: '#6b7280' }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Servico</label>
                <select value={form.servico} onChange={e => {
                  const s = e.target.value as Servico
                  setForm(f => ({ ...f, servico: s, operadora: OPERADORAS[s][0], plano: s === 'telecom' ? '1P' : '' }))
                }} className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}>
                  <option value="energia">Energia</option>
                  <option value="gas">Gas</option>
                  <option value="seguros">Seguros</option>
                  <option value="telecom">Telecomunicacoes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Operadora</label>
                <select value={form.operadora} onChange={e => setForm(f => ({ ...f, operadora: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}>
                  {OPERADORAS[form.servico].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {form.servico === 'telecom' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Plano</label>
                  <select value={form.plano} onChange={e => setForm(f => ({ ...f, plano: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}>
                    {PLANOS_TELECOM.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Valor Fixo (EUR)</label>
                <input type="number" step="0.01" min="0" value={form.valor_comissao}
                  onChange={e => setForm(f => ({ ...f, valor_comissao: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}
                  placeholder="Ex: 25.00" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium"
                  style={{ border: '1px solid #d1d5db', color: '#374151' }}>Cancelar</button>
                <button onClick={saveRow} disabled={saving}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#4338ca' }}>{saving ? 'A guardar...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
