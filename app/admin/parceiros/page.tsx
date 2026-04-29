'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  Users, ShoppingCart, Mail, Building2, Percent, Save, Zap, Flame,
  Plus, X, Eye, EyeOff, Trash2, AlertTriangle, KeyRound, Shield,
} from 'lucide-react'

const SERVICOS = ['energia', 'gas', 'seguros', 'telecom'] as const
const OPERADORAS: Record<string, string[]> = {
  energia:  ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Portologos'],
  gas:      ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Portologos'],
  seguros:  ['Fidelidade', 'Tranquilidade', 'Allianz', 'Generali', 'AXA', 'Zurich'],
  telecom:  ['MEO', 'NOS', 'Vodafone', 'NOWO', 'DIGI'],
}
const PLANOS_TELECOM = ['1P', '2P', '3P', '4P']
const SERVICO_LABEL: Record<string, string> = {
  energia: 'Energia', gas: 'Gas', seguros: 'Seguros', telecom: 'Telecom',
}

interface Parceiro { id: string; full_name: string; email: string; company_name: string }
interface Venda { id: string; user_id: string; client_name: string; amount: number; status: string; service_type: string; operator: string; plano?: string }
interface ComissaoOp { servico: string; operadora: string; plano: string; valor_comissao: number }
interface NovoForm { email: string; password: string; full_name: string; company_name: string; phone: string }

export default function ParceirosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<'vendas' | 'comissoes' | 'password'>('vendas')

  // Comissoes por operadora
  const [comOps, setComOps] = useState<ComissaoOp[]>([])
  const [comServico, setComServico] = useState<'energia' | 'gas' | 'seguros' | 'telecom'>('telecom')
  const [comOperadora, setComOperadora] = useState('MEO')
  const [comPlano, setComPlano] = useState('1P')
  const [comValor, setComValor] = useState('')
  const [comSaving, setComSaving] = useState(false)
  const [comSaved, setComSaved] = useState(false)
  const [comError, setComError] = useState('')

  // Novo parceiro
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState<NovoForm>({ email: '', password: '', full_name: '', company_name: '', phone: '' })
  const [novoLoading, setNovoLoading] = useState(false)
  const [novoError, setNovoError] = useState('')
  const [novoSuccess, setNovoSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Apagar
  const [confirmDelete, setConfirmDelete] = useState<Parceiro | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Alterar password
  const [newPass, setNewPass] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [passMsg, setPassMsg] = useState('')
  const [passError, setPassError] = useState('')

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

  async function loadComissoes(pid: string) {
    const res = await fetch(`/api/comissoes/operadora?parceiro_id=${pid}`, { credentials: 'include' }).then(r => r.json())
    setComOps(res.comissoes || [])
  }

  async function selectParceiro(pid: string) {
    setSelected(pid)
    setTab('vendas')
    setPassMsg(''); setPassError(''); setNewPass('')
    setComError(''); setComSaved(false)
    await loadComissoes(pid)
  }

  async function saveComissaoOp() {
    if (!selected || !comValor) return
    setComSaving(true); setComError(''); setComSaved(false)
    const isT = comServico === 'telecom'
    const body = {
      parceiro_id: selected,
      servico: comServico,
      operadora: comOperadora,
      plano: isT ? comPlano : '',
      valor_comissao: parseFloat(comValor) || 0,
    }
    const res = await fetch('/api/comissoes/operadora', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setComSaving(false)
    if (!res.ok) { setComError(data.error || 'Erro ao guardar'); return }
    setComSaved(true); setComValor('')
    await loadComissoes(selected)
    setTimeout(() => setComSaved(false), 3000)
  }

  async function deleteComissaoOp(item: ComissaoOp) {
    if (!selected) return
    await fetch('/api/comissoes/operadora', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ parceiro_id: selected, servico: item.servico, operadora: item.operadora, plano: item.plano }),
    })
    await loadComissoes(selected)
  }

  async function apagarParceiro(parceiro: Parceiro) {
    setDeleting(true); setDeleteError('')
    const res = await fetch(`/api/parceiros/${parceiro.id}`, { method: 'DELETE', credentials: 'include' })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) { setDeleteError(data.error || 'Erro ao apagar'); return }
    setConfirmDelete(null)
    if (selected === parceiro.id) setSelected(null)
    const p = await fetch('/api/vendas?parceiros=1', { credentials: 'include' }).then(r => r.json())
    setParceiros(p.parceiros || [])
  }

  async function criarParceiro() {
    setNovoError(''); setNovoSuccess('')
    if (!novoForm.email || !novoForm.password || !novoForm.full_name) {
      setNovoError('Email, password e nome sao obrigatorios'); return
    }
    setNovoLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoForm),
    })
    const data = await res.json()
    setNovoLoading(false)
    if (!res.ok) { setNovoError(data.error || 'Erro ao criar parceiro'); return }
    setNovoSuccess(`Parceiro ${data.user.full_name} criado!`)
    setNovoForm({ email: '', password: '', full_name: '', company_name: '', phone: '' })
    const p = await fetch('/api/vendas?parceiros=1', { credentials: 'include' }).then(r => r.json())
    setParceiros(p.parceiros || [])
    setTimeout(() => { setShowNovo(false); setNovoSuccess('') }, 2000)
  }

  async function alterarPassword() {
    if (!selected || !newPass || newPass.length < 6) {
      setPassError('Password deve ter pelo menos 6 caracteres'); return
    }
    setPassLoading(true); setPassMsg(''); setPassError('')
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ parceiro_id: selected, new_password: newPass }),
    })
    const data = await res.json()
    setPassLoading(false)
    if (!res.ok) { setPassError(data.error || 'Erro ao alterar password'); return }
    setPassMsg('Password alterada com sucesso!'); setNewPass('')
    setTimeout(() => setPassMsg(''), 4000)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  const getParceiroVendas = (pid: string) => vendas.filter(v => v.user_id === pid)
  const getTotal = (pid: string) => getParceiroVendas(pid).reduce((s, v) => s + (v.amount || 0), 0)
  const selectedParceiro = parceiros.find(p => p.id === selected)
  const selectedVendas = selected ? getParceiroVendas(selected) : []
  const inputStyle = { border: '1px solid #d1d5db', background: '#fff', color: '#111827' }

  const statusColor: Record<string, { bg: string; color: string }> = {
    ativo:      { bg: '#dcfce7', color: '#166534' },
    pago:       { bg: '#dbeafe', color: '#1e40af' },
    cancelado:  { bg: '#fee2e2', color: '#991b1b' },
    pendente:   { bg: '#fef9c3', color: '#92400e' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Users size={28} style={{ color: '#4338ca' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Parceiros</h1>
                  <p className="text-sm" style={{ color: '#6b7280' }}>{parceiros.length} parceiros registados</p>
                </div>
              </div>
              <button onClick={() => { setShowNovo(true); setNovoError(''); setNovoSuccess('') }}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
                style={{ background: '#4338ca' }}>
                <Plus size={16} /> Novo Parceiro
              </button>
            </div>

            {/* Modal Confirmar Apagar */}
            {confirmDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div className="w-full max-w-sm rounded-2xl shadow-2xl" style={{ background: '#fff' }}>
                  <div className="p-6 text-center">
                    <div className="mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-full" style={{ background: '#fef2f2' }}>
                      <AlertTriangle size={24} style={{ color: '#dc2626' }} />
                    </div>
                    <h2 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>Apagar Parceiro</h2>
                    <p className="text-sm mb-1" style={{ color: '#374151' }}>
                      Tem a certeza que quer apagar <strong>{confirmDelete.full_name}</strong>?
                    </p>
                    <p className="text-xs mb-5" style={{ color: '#6b7280' }}>
                      Esta acao e irreversivel e remove todas as vendas e dados associados.
                    </p>
                    {deleteError && (
                      <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{deleteError}</div>
                    )}
                    <div className="flex gap-3">
                      <button onClick={() => { setConfirmDelete(null); setDeleteError('') }}
                        className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium"
                        style={{ border: '1px solid #d1d5db', color: '#374151' }}>Cancelar</button>
                      <button onClick={() => apagarParceiro(confirmDelete)} disabled={deleting}
                        className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                        style={{ background: '#dc2626' }}>{deleting ? 'A apagar...' : 'Apagar'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Novo Parceiro */}
            {showNovo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: '#fff' }}>
                  <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <h2 className="text-lg font-bold" style={{ color: '#111827' }}>Criar Novo Parceiro</h2>
                    <button onClick={() => setShowNovo(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                      <X size={20} style={{ color: '#6b7280' }} />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {novoError && <div className="rounded-lg p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{novoError}</div>}
                    {novoSuccess && <div className="rounded-lg p-3 text-sm" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}>{novoSuccess}</div>}
                    {[
                      { label: 'Nome Completo *', key: 'full_name', type: 'text', ph: 'Joao Silva' },
                      { label: 'Email *', key: 'email', type: 'email', ph: 'joao@empresa.com' },
                      { label: 'Empresa', key: 'company_name', type: 'text', ph: 'Nome da empresa' },
                      { label: 'Telefone', key: 'phone', type: 'tel', ph: '+351 912 345 678' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>{f.label}</label>
                        <input type={f.type} value={(novoForm as any)[f.key]}
                          onChange={e => setNovoForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" placeholder={f.ph}
                          style={{ border: '1px solid #d1d5db', color: '#111827' }} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Password *</label>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} value={novoForm.password}
                          onChange={e => setNovoForm(f => ({ ...f, password: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none pr-10" placeholder="Minimo 6 caracteres"
                          style={{ border: '1px solid #d1d5db', color: '#111827' }} />
                        <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-2.5">
                          {showPass ? <EyeOff size={16} style={{ color: '#9ca3af' }} /> : <Eye size={16} style={{ color: '#9ca3af' }} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowNovo(false)} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium"
                        style={{ border: '1px solid #d1d5db', color: '#374151' }}>Cancelar</button>
                      <button onClick={criarParceiro} disabled={novoLoading}
                        className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                        style={{ background: '#4338ca' }}>{novoLoading ? 'A criar...' : 'Criar Parceiro'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {parceiros.length === 0 ? (
              <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <Users size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium" style={{ color: '#374151' }}>Nenhum parceiro registado</p>
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Clique em &quot;Novo Parceiro&quot; para adicionar o primeiro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista parceiros */}
                <div className="lg:col-span-1">
                  <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    <div className="p-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <h2 className="font-semibold text-sm" style={{ color: '#374151' }}>Selecionar Parceiro</h2>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                      {parceiros.map(p => {
                        const isActive = selected === p.id
                        return (
                          <div key={p.id} className="relative group"
                            style={{ borderBottom: '1px solid #f3f4f6', background: isActive ? '#eef2ff' : '#fff' }}>
                            <button onClick={() => selectParceiro(p.id)} className="w-full text-left p-4 pr-12">
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
                                <span className="text-xs font-medium" style={{ color: '#059669' }}>€{getTotal(p.id).toFixed(2)}</span>
                              </div>
                            </button>
                            <button onClick={e => { e.stopPropagation(); setDeleteError(''); setConfirmDelete(p) }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: '#fef2f2' }} title="Apagar parceiro">
                              <Trash2 size={15} style={{ color: '#dc2626' }} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Detalhe */}
                <div className="lg:col-span-2">
                  {!selected ? (
                    <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                      <Shield size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                      <p style={{ color: '#6b7280' }}>Selecione um parceiro para gerir vendas, comissoes e password</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Tabs */}
                      <div className="flex gap-2 flex-wrap">
                        {([
                          { key: 'vendas', label: `Vendas (${selectedVendas.length})`, icon: ShoppingCart },
                          { key: 'comissoes', label: 'Comissoes', icon: Percent },
                          { key: 'password', label: 'Password', icon: KeyRound },
                        ] as const).map(t => (
                          <button key={t.key} onClick={() => setTab(t.key)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                              background: tab === t.key ? '#4338ca' : '#fff',
                              color: tab === t.key ? '#fff' : '#374151',
                              border: '1px solid #e5e7eb',
                            }}>
                            <t.icon size={14} />{t.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab: Vendas */}
                      {tab === 'vendas' && (
                        <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                          <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <h2 className="font-bold" style={{ color: '#111827' }}>Vendas — {selectedParceiro?.full_name}</h2>
                          </div>
                          {selectedVendas.length === 0 ? (
                            <div className="p-8 text-center"><p style={{ color: '#6b7280' }}>Sem vendas registadas.</p></div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    {['Cliente', 'Servico', 'Operadora', 'Plano', 'Valor', 'Estado'].map(h => (
                                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedVendas.map(v => {
                                    const sc = statusColor[v.status] || { bg: '#f3f4f6', color: '#374151' }
                                    return (
                                      <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td className="px-4 py-3 text-sm font-medium" style={{ color: '#111827' }}>{v.client_name}</td>
                                        <td className="px-4 py-3">
                                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                                            background: v.service_type === 'telecom' ? '#e0e7ff' : v.service_type === 'seguros' ? '#fce7f3' : '#fef3c7',
                                            color: v.service_type === 'telecom' ? '#4338ca' : v.service_type === 'seguros' ? '#9d174d' : '#92400e',
                                          }}>
                                            {SERVICO_LABEL[v.service_type] || v.service_type}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm" style={{ color: '#374151' }}>{v.operator || '—'}</td>
                                        <td className="px-4 py-3 text-sm" style={{ color: '#374151' }}>{v.plano || '—'}</td>
                                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#111827' }}>€{(v.amount || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={sc}>{v.status}</span>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab: Comissoes por operadora */}
                      {tab === 'comissoes' && (
                        <div className="space-y-4">
                          {/* Adicionar comissao */}
                          <div className="rounded-xl shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                            <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                              <h2 className="font-bold" style={{ color: '#111827' }}>Definir Comissao — {selectedParceiro?.full_name}</h2>
                              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Valor fixo por venda, por operadora e plano</p>
                            </div>
                            <div className="p-5">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Servico</label>
                                  <select value={comServico} onChange={e => {
                                    const s = e.target.value as typeof SERVICOS[number]
                                    setComServico(s)
                                    setComOperadora(OPERADORAS[s]?.[0] ?? '')
                                    setComPlano(s === 'telecom' ? '1P' : '')
                                    setComValor('')
                                  }}
                                    className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                                    {SERVICOS.map(s => <option key={s} value={s}>{SERVICO_LABEL[s]}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Operadora</label>
                                  <select value={comOperadora} onChange={e => setComOperadora(e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                                    {OPERADORAS[comServico].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                                {comServico === 'telecom' && (
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Plano</label>
                                    <select value={comPlano} onChange={e => setComPlano(e.target.value)}
                                      className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                                      {PLANOS_TELECOM.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                  </div>
                                )}
                                <div>
                                  <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Valor (€)</label>
                                  <input type="number" min="0" step="0.5" value={comValor}
                                    onChange={e => setComValor(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
                                </div>
                              </div>
                              {comError && <p className="text-sm mb-3" style={{ color: '#dc2626' }}>{comError}</p>}
                              <div className="flex items-center gap-3">
                                <button onClick={saveComissaoOp} disabled={comSaving || !comValor}
                                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                                  style={{ background: '#4338ca' }}>
                                  <Save size={15} />{comSaving ? 'A guardar...' : 'Guardar'}
                                </button>
                                {comSaved && <span className="text-sm font-medium" style={{ color: '#059669' }}>Guardado!</span>}
                              </div>
                            </div>
                          </div>

                          {/* Tabela comissoes guardadas */}
                          {comOps.length > 0 && (
                            <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                              <div className="p-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <h3 className="font-semibold text-sm" style={{ color: '#374151' }}>Comissoes Definidas</h3>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                      {['Servico', 'Operadora', 'Plano', 'Valor', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {comOps.map((c, i) => (
                                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td className="px-4 py-3">
                                          <span className="flex items-center gap-1.5">
                                            {c.servico === 'telecom' ? <Zap size={14} style={{ color: '#4338ca' }} /> : <Flame size={14} style={{ color: '#d97706' }} />}
                                            <span className="text-sm" style={{ color: '#374151' }}>{SERVICO_LABEL[c.servico] || c.servico}</span>
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium" style={{ color: '#111827' }}>{c.operadora}</td>
                                        <td className="px-4 py-3 text-sm" style={{ color: '#374151' }}>{c.plano || '—'}</td>
                                        <td className="px-4 py-3 text-sm font-bold" style={{ color: '#059669' }}>€{c.valor_comissao.toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                          <button onClick={() => deleteComissaoOp(c)} className="rounded p-1 hover:bg-red-50">
                                            <X size={14} style={{ color: '#dc2626' }} />
                                          </button>
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

                      {/* Tab: Alterar Password */}
                      {tab === 'password' && (
                        <div className="rounded-xl shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                          <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                            <h2 className="font-bold" style={{ color: '#111827' }}>Alterar Password — {selectedParceiro?.full_name}</h2>
                            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{selectedParceiro?.email}</p>
                          </div>
                          <div className="p-5 max-w-sm space-y-4">
                            {passMsg && <div className="rounded-lg p-3 text-sm" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}>{passMsg}</div>}
                            {passError && <div className="rounded-lg p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{passError}</div>}
                            <div>
                              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Nova Password</label>
                              <div className="relative">
                                <input type={showNewPass ? 'text' : 'password'} value={newPass}
                                  onChange={e => { setNewPass(e.target.value); setPassError('') }}
                                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none pr-10" placeholder="Minimo 6 caracteres"
                                  style={{ border: '1px solid #d1d5db', color: '#111827' }} />
                                <button type="button" onClick={() => setShowNewPass(s => !s)} className="absolute right-3 top-2.5">
                                  {showNewPass ? <EyeOff size={16} style={{ color: '#9ca3af' }} /> : <Eye size={16} style={{ color: '#9ca3af' }} />}
                                </button>
                              </div>
                            </div>
                            <button onClick={alterarPassword} disabled={passLoading || !newPass}
                              className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                              style={{ background: '#4338ca' }}>
                              <KeyRound size={15} />{passLoading ? 'A alterar...' : 'Alterar Password'}
                            </button>
                          </div>
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
