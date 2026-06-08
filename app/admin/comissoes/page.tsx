'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import Image from 'next/image'
import { Percent, Plus, Trash2, X, Check, Zap, Flame, Shield, ArrowLeft, Users, Pencil } from 'lucide-react'
import Link from 'next/link'

const OPERADORAS: Record<string, string[]> = {
  energia:  ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Portologos'],
  gas:      ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Portologos'],
  seguros:  ['Fidelidade', 'Tranquilidade', 'Allianz', 'Generali', 'AXA', 'Zurich', 'Ageas'],
  telecom:  ['MEO', 'NOS', 'Vodafone', 'NOWO', 'DIGI'],
}
const LOGOS: Record<string, string> = {
  MEO: '/operadoras/meo.jpg',
  NOS: '/operadoras/nos.jpg',
  Vodafone: '/operadoras/vodafone.jpg',
  NOWO: '/operadoras/nowo.jpg',
  DIGI: '/operadoras/digi.jpg',
}
const PLANOS_TELECOM = ['1P', '2P', '3P', '4P']
const SERVICOS = ['energia', 'gas', 'seguros', 'telecom'] as const
type Servico = typeof SERVICOS[number]
type Modelo = 'fixo' | 'mensalidade' | 'percentagem'

interface Parceiro { id: string; full_name: string; email: string; company_name: string }
interface ComissaoOp { id: string; servico: string; operadora: string; plano: string; valor_comissao: number; modelo: Modelo; num_mensalidades: number; valor_mensal: number; percentagem: number }
interface FormRow { servico: Servico; operadora: string; plano: string; modelo: Modelo; valor_comissao: string; num_mensalidades: string; valor_mensal: string; percentagem: string }

export default function AdminComissoesPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [loading, setLoading] = useState(true)
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [selectedParceiro, setSelectedParceiro] = useState<string>('')
  const [comissoes, setComissoes] = useState<ComissaoOp[]>([])
  const [loadingCom, setLoadingCom] = useState(false)
  const [tab, setTab] = useState<Servico>('energia')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormRow>({ servico: 'energia', operadora: 'EDP', plano: '', modelo: 'fixo', valor_comissao: '', num_mensalidades: '3', valor_mensal: '', percentagem: '' })
  const [saving, setSaving] = useState(false)

  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok')

  useEffect(() => {
    if (!user) return
    authFetch('/api/vendas?parceiros=1').then(r => r.json()).then(res => {
      setParceiros(res.parceiros ?? [])
      setLoading(false)
    })
  }, [user, authFetch])

  async function loadComissoes(pid: string) {
    if (!pid) { setComissoes([]); return }
    setLoadingCom(true)
    const res = await authFetch(`/api/comissoes/operadora?parceiro_id=${pid}`).then(r => r.json())
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
    setForm({ servico: tab, operadora: OPERADORAS[tab][0], plano: tab === 'telecom' ? '1P' : '', modelo: 'fixo', valor_comissao: '', num_mensalidades: '3', valor_mensal: '', percentagem: '' })
    setShowForm(true)
  }

  async function saveRow() {
    if (!selectedParceiro) { flash('Selecione primeiro um parceiro', 'err'); return }
    const modelo: Modelo = form.servico === 'telecom' ? form.modelo : 'fixo'
    const isMensalidade = modelo === 'mensalidade'
    const isPercentagem = modelo === 'percentagem'
    // Para telecom mensalidade: apenas nº mensalidades (o valor € vem da mensalidade do cliente na venda)
    if (isMensalidade && !form.num_mensalidades) { flash('Preencha o numero de mensalidades por contrato', 'err'); return }
    if (isPercentagem && !form.percentagem) { flash('Preencha a percentagem', 'err'); return }
    if (!isMensalidade && !isPercentagem && !form.valor_comissao) { flash('Valor de comissao obrigatorio', 'err'); return }
    setSaving(true)
    const res = await authFetch('/api/comissoes/operadora', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parceiro_id: selectedParceiro,
        servico: form.servico,
        operadora: form.operadora,
        plano: form.servico === 'telecom' ? form.plano : '',
        modelo,
        valor_comissao: (!isMensalidade && !isPercentagem) ? (parseFloat(form.valor_comissao) || 0) : 0,
        num_mensalidades: isMensalidade ? (parseFloat(form.num_mensalidades) || 0) : 0,
        valor_mensal: 0, // nao usado — o valor vem da mensalidade do cliente na venda
        percentagem: isPercentagem ? (parseFloat(form.percentagem) || 0) : 0,
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
    const res = await authFetch('/api/comissoes/operadora', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
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

  const inputStyle = { border: '1px solid #d1d5db', background: '#fff', color: '#1e293b' }
  const tabColors: Record<Servico, { text: string; bg: string; border: string }> = {
    energia: { text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    gas:     { text: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
    seguros: { text: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
    telecom: { text: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
  }
  const tc = tabColors[tab]
  const tabData = comissoes.filter(c => c.servico === tab)
  const parceiroSelecionado = parceiros.find(p => p.id === selectedParceiro)

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" >
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4338ca' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="w-full lg:ml-64 pt-16">
          <div className="p-4 md:p-5 max-w-7xl mx-auto w-full">

            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: '#0ea5e9' }}>
              <ArrowLeft size={16} /> Voltar
            </Link>

            <div className="flex items-center gap-3 mb-8">
              <Percent size={28} style={{ color: '#0ea5e9' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Comissoes por Parceiro</h1>
                <p className="text-sm" style={{ color: '#64748b' }}>Selecione um parceiro e defina os valores por operadora e plano</p>
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
            <div className="rounded-xl p-6 mb-6 shadow-sm" >
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} style={{ color: '#0ea5e9' }} />
                <h2 className="font-semibold" style={{ color: '#1e293b' }}>Selecionar Parceiro</h2>
              </div>
              {parceiros.length === 0 ? (
                <p className="text-sm" style={{ color: '#64748b' }}>Nenhum parceiro encontrado.</p>
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
                        <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>{p.full_name}</p>
                        {p.company_name && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{p.company_name}</p>}
                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{p.email}</p>
                        {isActive && (
                          <span className="mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: '#fff' }}>
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
                  <p className="text-sm font-medium" style={{ color: '#475569' }}>
                    Comissoes de <strong>{parceiroSelecionado?.full_name}</strong>
                  </p>
                  <button onClick={openForm}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
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
                        border: '1px solid #e2e8f0',
                      }}>
                      {s === 'energia' ? <Flame size={14} /> : s === 'telecom' ? <Zap size={14} /> : <Shield size={14} />}
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tabela */}
                <div className="rounded-xl shadow-sm overflow-hidden" >
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
                      <p className="text-sm" style={{ color: '#64748b' }}>
                        Nenhuma comissao definida para {tab}. Clique em &quot;Adicionar Comissao&quot;.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr >
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Operadora</th>
                            {tab === 'telecom' && <>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Plano</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Modelo</th>
                            </>}
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Valor</th>
                            <th className="px-5 py-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {tabData.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                  {LOGOS[c.operadora] && (
                                    <div className="h-7 w-7 rounded overflow-hidden flex-shrink-0">
                                      <Image src={LOGOS[c.operadora]} alt={c.operadora} width={28} height={28} className="object-cover w-full h-full" />
                                    </div>
                                  )}
                                  <span className="font-medium text-sm" style={{ color: '#1e293b' }}>{c.operadora}</span>
                                </div>
                              </td>
                              {tab === 'telecom' && <>
                                <td className="px-5 py-4">
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" >
                                    {c.plano || '-'}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  {c.modelo === 'mensalidade' && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" >Mensalidades</span>
                                  )}
                                  {c.modelo === 'percentagem' && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" >Percentagem</span>
                                  )}
                                  {(!c.modelo || c.modelo === 'fixo') && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" >Fixo</span>
                                  )}
                                </td>
                              </>}
                              <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#059669' }}>
                                {c.modelo === 'mensalidade' && c.num_mensalidades > 0
                                  ? <span className="font-bold">x{c.num_mensalidades}<span className="font-normal text-xs ml-1.5" style={{ color: '#64748b' }}>mensalidades / contrato</span></span>
                                  : c.modelo === 'percentagem'
                                  ? <span>{(c.percentagem ?? 0).toFixed(2)}%</span>
                                  : <span>{'\u20AC'}{(c.valor_comissao ?? 0).toFixed(2)}</span>
                                }
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setForm({
                                        servico: c.servico as any,
                                        operadora: c.operadora,
                                        plano: c.plano ?? '',
                                        modelo: (c.modelo as any) || 'fixo',
                                        valor_comissao: c.valor_comissao > 0 ? String(c.valor_comissao) : '',
                                        num_mensalidades: c.num_mensalidades > 0 ? String(c.num_mensalidades) : '3',
                                        valor_mensal: c.valor_mensal > 0 ? String(c.valor_mensal) : '',
                                        percentagem: c.percentagem > 0 ? String(c.percentagem) : '',
                                      })
                                      setShowForm(true)
                                    }}
                                    className="rounded-lg p-1.5 transition hover:opacity-70"
                                    
                                    title="Editar comissao">
                                    <Pencil size={15} style={{ color: '#0ea5e9' }} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Apagar comissao de ${c.operadora}${c.plano ? ` (${c.plano})` : ''}? Esta acao nao pode ser revertida.`)) {
                                        deleteRow(c)
                                      }
                                    }}
                                    className="rounded-lg p-1.5 transition hover:opacity-70"
                                    
                                    title="Apagar comissao">
                                    <Trash2 size={15} style={{ color: '#dc2626' }} />
                                  </button>
                                </div>
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
              <div className="rounded-xl p-10 text-center" >
                <Percent size={36} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
                <p className="text-sm font-medium" style={{ color: '#64748b' }}>Selecione um parceiro para ver e editar as suas comissoes</p>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modal Adicionar Comissao */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" >
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <h2 className="font-bold" style={{ color: '#1e293b' }}>Adicionar Comissao</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X size={18} style={{ color: '#64748b' }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Servico</label>
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Operadora</label>
                <select value={form.operadora} onChange={e => setForm(f => ({ ...f, operadora: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}>
                  {OPERADORAS[form.servico].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {form.servico === 'telecom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Plano</label>
                    <select value={form.plano} onChange={e => setForm(f => ({ ...f, plano: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}>
                      {PLANOS_TELECOM.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Modelo de comissao</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: 'fixo', label: 'Valor Fixo' },
                        { value: 'mensalidade', label: 'Mensalidades' },
                        { value: 'percentagem', label: 'Percentagem' },
                      ] as { value: Modelo; label: string }[]).map(m => (
                        <button key={m.value} type="button"
                          onClick={() => setForm(f => ({ ...f, modelo: m.value }))}
                          className="rounded-lg px-2 py-2.5 text-xs font-medium border transition"
                          style={{ background: form.modelo === m.value ? '#4338ca' : '#fff', color: form.modelo === m.value ? '#fff' : '#374151', border: form.modelo === m.value ? '1px solid #4338ca' : '1px solid #d1d5db' }}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Campos condicionais por modelo */}
              {form.servico === 'telecom' && form.modelo === 'mensalidade' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Mensalidades por contrato</label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].map(n => {
                        const val = String(n)
                        const selected = form.num_mensalidades === val
                        return (
                          <button key={n} type="button"
                            onClick={() => setForm(f => ({ ...f, num_mensalidades: val }))}
                            className="rounded-lg py-2 text-xs font-bold border transition"
                            style={{
                              background: selected ? '#4338ca' : '#fff',
                              color: selected ? '#fff' : '#374151',
                              border: selected ? '1px solid #4338ca' : '1px solid #d1d5db',
                            }}>
                            x{n}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="rounded-lg p-3 text-xs" >
                    {(() => {
                      const mens = parseFloat(form.num_mensalidades) || 0
                      const label = mens === 1 ? '1 mensalidade' : `${mens} mensalidades`
                      return <>Por cada contrato fechado o parceiro recebe <strong>{label}</strong> da mensalidade do cliente. O valor € e calculado automaticamente na venda.</>
                    })()}
                  </div>
                </div>
              ) : form.servico === 'telecom' && form.modelo === 'percentagem' ? (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Percentagem (%)</label>
                  <div className="relative">
                    <input type="number" step="0.01" min="0" max="100" value={form.percentagem}
                      onChange={e => setForm(f => ({ ...f, percentagem: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2.5 pr-8 text-sm" style={inputStyle}
                      placeholder="Ex: 5.00" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#64748b' }}>%</span>
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: '#64748b' }}>O parceiro recebe esta percentagem do valor total do contrato</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Valor fixo por contrato (EUR)</label>
                  <input type="number" step="0.01" min="0" value={form.valor_comissao}
                    onChange={e => setForm(f => ({ ...f, valor_comissao: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}
                    placeholder="Ex: 25.00" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium"
                  style={{ border: '1px solid #d1d5db', color: '#475569' }}>Cancelar</button>
                <button onClick={saveRow} disabled={saving}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>{saving ? 'A guardar...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
