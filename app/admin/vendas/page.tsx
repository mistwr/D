'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  ShoppingCart, Search, ChevronDown, Trash2, X, FileText,
  User, Package, Paperclip, ExternalLink, Download, Upload, RefreshCw, Edit3
} from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pendente:      { label: 'Pendente',       color: '#92400e', bg: '#fef3c7' },
  em_revisao:    { label: 'Em Revisão',     color: '#1e40af', bg: '#dbeafe' },
  em_ativacao:   { label: 'Em Ativação',    color: '#7c2d12', bg: '#fed7aa' },
  ativa:         { label: 'Ativa',          color: '#065f46', bg: '#d1fae5' },
  pago:          { label: 'Pago',           color: '#065f46', bg: '#bbf7d0' },
  cancelado:     { label: 'Cancelado',      color: '#991b1b', bg: '#fee2e2' },
  rejeitado:     { label: 'Rejeitado',      color: '#7f1d1d', bg: '#fecaca' },
  chargeback:    { label: 'Chargeback',     color: '#7c2d12', bg: '#ffedd5' },
}

const STATUSES = Object.keys(STATUS_LABELS)

const TIPO_PROCESSO_LABELS: Record<string, string> = {
  ED: 'Entrada Direta',
  AT: 'Alteracao Titularidade',
  MC: 'Mudanca Comercializadora',
}

interface Venda {
  id: string
  client_name: string; client_email: string; client_phone: string
  client_nif: string; client_cc: string; client_iban: string
  client_address: string
  amount: number; status: string; service_type: string
  operator: string; plano: string; description: string
  notes: string; is_dual: boolean; energia_tipo: string
  energia_tipo_processo: string
  cpe: string; cui: string; potencia: string; escalao: string
  gas_escalao: string; cpes: string[]; cuis: string[]
  telco_numeros: {numero: string; cvp: string}[]
  telco_fixo: string; telco_fixo_cvp: string
  admin_feedback: string
  created_at: string; parceiro_name: string; user_id: string
}

interface Doc {
  id: string; file_name: string; file_type: string
  file_size: number; created_at: string; signed_url: string | null
  uploader_name: string; venda_id: string | null
  _orphan?: boolean
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-xs font-medium mb-0.5" style={{ color: '#9ca3af' }}>{label}</p>
      <p className="text-sm font-medium break-all" style={{ color: '#1e293b' }}>{String(value)}</p>
    </div>
  )
}

function DocIcon({ type }: { type: string }) {
  const colors: Record<string, string> = { pdf: '#dc2626', doc: '#2563eb', docx: '#2563eb', xls: '#16a34a', xlsx: '#16a34a', png: '#7c3aed', jpg: '#7c3aed', jpeg: '#7c3aed' }
  return <FileText size={16} style={{ color: colors[type] ?? '#6b7280' }} />
}

function fmtSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function AdminVendasPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todas')
  const [filterServico, setFilterServico] = useState('todos')
  const [filterParceiro, setFilterParceiro] = useState('todos')
  const [updating, setUpdating] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Painel de detalhe
  const [selected, setSelected] = useState<Venda | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  // Feedback do admin
  const [feedback, setFeedback] = useState('')
  const [savingFeedback, setSavingFeedback] = useState(false)

  // Editar dados do cliente
  const [editingClient, setEditingClient] = useState(false)
  const [clientForm, setClientForm] = useState({
    client_name: '',
    client_nif: '',
    client_cc: '',
    client_phone: '',
    client_email: '',
    client_iban: '',
    client_address: '',
  })
  const [savingClient, setSavingClient] = useState(false)

  // Editar dados do produto
  const [editingProduct, setEditingProduct] = useState(false)
  const [productForm, setProductForm] = useState({
    service_type: '',
    operator: '',
    plano: '',
    amount: '',
    description: '',
    notes: '',
    // Energia
    energia_tipo: '',
    energia_tipo_processo: '',
    is_dual: false,
    cpe: '',
    cui: '',
    potencia: '',
    escalao: '',
    gas_escalao: '',
    // Telco
    telco_numeros: [] as { numero: string; cvp: string }[],
    telco_fixo: '',
    telco_fixo_cvp: '',
  })
  const [savingProduct, setSavingProduct] = useState(false)

  // Chargeback
  const [showChargebackForm, setShowChargebackForm] = useState(false)
  const [chargebackValor, setChargebackValor] = useState('')
  const [chargebackMotivo, setChargebackMotivo] = useState('')
  const [chargebackObs, setChargebackObs] = useState('')
  const [savingChargeback, setSavingChargeback] = useState(false)

  useEffect(() => {
    if (!user) return
    authFetch('/api/vendas').then(r => r.json()).then(d => {
      setVendas(d.vendas || [])
      setLoading(false)
    })
  }, [user, authFetch])

  const loadDocs = useCallback(async (vendaId: string) => {
    setDocsLoading(true)
    setDocs([])
    const d = await authFetch(`/api/documentos?venda_id=${vendaId}`).then(r => r.json())
    setDocs(d.documentos || [])
    setDocsLoading(false)
  }, [authFetch])

  function openDetail(v: Venda) {
    setSelected(v)
    setUploadErr('')
    setFeedback(v.admin_feedback || '')
    setClientForm({
      client_name: v.client_name || '',
      client_nif: v.client_nif || '',
      client_cc: v.client_cc || '',
      client_phone: v.client_phone || '',
      client_email: v.client_email || '',
      client_iban: v.client_iban || '',
      client_address: v.client_address || '',
    })
    setEditingClient(false)
    setProductForm({
      service_type: v.service_type || '',
      operator: v.operator || '',
      plano: v.plano || '',
      amount: v.amount?.toString() || '',
      description: v.description || '',
      notes: v.notes || '',
      energia_tipo: v.energia_tipo || '',
      energia_tipo_processo: v.energia_tipo_processo || '',
      is_dual: v.is_dual || false,
      cpe: v.cpe || '',
      cui: v.cui || '',
      potencia: v.potencia || '',
      escalao: v.escalao || '',
      gas_escalao: v.gas_escalao || '',
      telco_numeros: v.telco_numeros || [],
      telco_fixo: v.telco_fixo || '',
      telco_fixo_cvp: v.telco_fixo_cvp || '',
    })
    setEditingProduct(false)
    loadDocs(v.id)
  }

  function closeDetail() {
    setSelected(null)
    setDocs([])
    setUploadErr('')
    setFeedback('')
    setClientForm({
      client_name: '',
      client_nif: '',
      client_cc: '',
      client_phone: '',
      client_email: '',
      client_iban: '',
      client_address: '',
    })
    setEditingClient(false)
    setProductForm({
      service_type: '',
      operator: '',
      plano: '',
      amount: '',
      description: '',
      notes: '',
      energia_tipo: '',
      energia_tipo_processo: '',
      is_dual: false,
      cpe: '',
      cui: '',
      potencia: '',
      escalao: '',
      gas_escalao: '',
      telco_numeros: [],
      telco_fixo: '',
      telco_fixo_cvp: '',
    })
    setEditingProduct(false)
    setShowChargebackForm(false)
    setChargebackValor('')
    setChargebackMotivo('')
    setChargebackObs('')
  }

  async function createChargeback() {
    if (!selected || !chargebackValor || !chargebackMotivo) return
    setSavingChargeback(true)
    const res = await authFetch('/api/chargebacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venda_id: selected.id,
        parceiro_id: selected.user_id,
        valor: parseFloat(chargebackValor),
        motivo: chargebackMotivo,
        observacoes: chargebackObs,
      }),
    })
    if (res.ok) {
      setVendas(prev => prev.map(v => v.id === selected.id ? { ...v, status: 'chargeback' } : v))
      setSelected(prev => prev ? { ...prev, status: 'chargeback' } : prev)
      setShowChargebackForm(false)
      setChargebackValor('')
      setChargebackMotivo('')
      setChargebackObs('')
    }
    setSavingChargeback(false)
  }

  async function saveFeedback() {
    if (!selected) return
    setSavingFeedback(true)
    const res = await authFetch('/api/vendas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, admin_feedback: feedback }),
    })
    if (res.ok) {
      setVendas(prev => prev.map(v => v.id === selected.id ? { ...v, admin_feedback: feedback } : v))
      setSelected(prev => prev ? { ...prev, admin_feedback: feedback } : prev)
    }
    setSavingFeedback(false)
  }

  async function saveClientData() {
    if (!selected) return
    setSavingClient(true)
    const res = await authFetch('/api/vendas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: selected.id, 
        client_name: clientForm.client_name,
        client_nif: clientForm.client_nif,
        client_cc: clientForm.client_cc,
        client_phone: clientForm.client_phone,
        client_email: clientForm.client_email,
        client_iban: clientForm.client_iban,
        client_address: clientForm.client_address,
      }),
    })
    if (res.ok) {
      const updatedData = {
        ...selected,
        client_name: clientForm.client_name,
        client_nif: clientForm.client_nif,
        client_cc: clientForm.client_cc,
        client_phone: clientForm.client_phone,
        client_email: clientForm.client_email,
        client_iban: clientForm.client_iban,
        client_address: clientForm.client_address,
      }
      setVendas(prev => prev.map(v => v.id === selected.id ? { ...v, ...updatedData } : v))
      setSelected(updatedData)
      setEditingClient(false)
    }
    setSavingClient(false)
  }

  async function saveProductData() {
    if (!selected) return
    setSavingProduct(true)
    const res = await authFetch('/api/vendas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: selected.id, 
        service_type: productForm.service_type,
        operator: productForm.operator,
        plano: productForm.plano,
        amount: productForm.amount ? parseFloat(productForm.amount) : null,
        description: productForm.description,
        notes: productForm.notes,
        energia_tipo: productForm.energia_tipo,
        energia_tipo_processo: productForm.energia_tipo_processo,
        is_dual: productForm.is_dual,
        cpe: productForm.cpe,
        cui: productForm.cui,
        potencia: productForm.potencia,
        escalao: productForm.escalao,
        gas_escalao: productForm.gas_escalao,
        telco_numeros: productForm.telco_numeros,
        telco_fixo: productForm.telco_fixo,
        telco_fixo_cvp: productForm.telco_fixo_cvp,
      }),
    })
    if (res.ok) {
      const updatedData = {
        ...selected,
        service_type: productForm.service_type,
        operator: productForm.operator,
        plano: productForm.plano,
        amount: productForm.amount ? parseFloat(productForm.amount) : null,
        description: productForm.description,
        notes: productForm.notes,
        energia_tipo: productForm.energia_tipo,
        energia_tipo_processo: productForm.energia_tipo_processo,
        is_dual: productForm.is_dual,
        cpe: productForm.cpe,
        cui: productForm.cui,
        potencia: productForm.potencia,
        escalao: productForm.escalao,
        gas_escalao: productForm.gas_escalao,
        telco_numeros: productForm.telco_numeros,
        telco_fixo: productForm.telco_fixo,
        telco_fixo_cvp: productForm.telco_fixo_cvp,
      }
      setVendas(prev => prev.map(v => v.id === selected.id ? { ...v, ...updatedData } : v))
      setSelected(updatedData)
      setEditingProduct(false)
    }
    setSavingProduct(false)
  }

  async function changeStatus(id: string, status: string) {
    setUpdating(id)
    await authFetch('/api/vendas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setVendas(prev => prev.map(v => v.id === id ? { ...v, status } : v))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev)
    setUpdating(null)
  }

  async function deleteVenda(id: string) {
    setDeleting(id)
    const res = await authFetch('/api/vendas', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setVendas(prev => prev.filter(v => v.id !== id))
      if (selected?.id === id) closeDetail()
    }
    setDeleting(null)
    setConfirmDelete(null)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || !e.target.files?.[0]) return
    const file = e.target.files[0]
    setUploadingDoc(true)
    setUploadErr('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('venda_id', selected.id)
    try {
      const res = await authFetch('/api/documentos', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setUploadErr(data.error || `Erro ${res.status} ao carregar`)
      } else {
        await loadDocs(selected.id)
      }
    } catch (err: any) {
      setUploadErr('Erro de ligacao: ' + (err?.message || 'desconhecido'))
    }
    setUploadingDoc(false)
    e.target.value = ''
  }

  async function deleteDoc(docId: string) {
    await authFetch('/api/documentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: docId }),
    })
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )

  const parceirosUnicos = [...new Set(vendas.map(v => v.parceiro_name).filter(Boolean))].sort()

  const filtered = vendas.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q || v.client_name?.toLowerCase().includes(q) || (v.client_nif || '').toLowerCase().includes(q) || (v.operator || '').toLowerCase().includes(q) || (v.parceiro_name || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todas' || v.status === filterStatus
    const matchServico = filterServico === 'todos' || v.service_type === filterServico
    const matchParceiro = filterParceiro === 'todos' || v.parceiro_name === filterParceiro
    return matchSearch && matchStatus && matchServico && matchParceiro
  })

  const totalFiltrado = filtered.reduce((s, v) => s + (v.amount || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f4f8 100%)' }}>
      <Navbar user={user} />
      <div>
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="w-full lg:ml-64 pt-16 lg:pt-16">
          <div className="p-4 md:p-5 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <ShoppingCart size={32} style={{ color: '#0066cc' }} />
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#003d99' }}>Gestão de Vendas</h1>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#475569' }}>{vendas.length} vendas registadas</p>
              </div>
            </div>

            <div className="flex gap-5">
              {/* Lista */}
              <div className="flex-1 min-w-0">
                {/* Filtros */}
                <div className="rounded-2xl p-4 sm:p-5 md:p-6 mb-6 flex flex-wrap gap-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f9ff 100%)', border: '1px solid #d0e8ff', borderTop: '2px solid #0066cc' }}>
                  <div className="relative flex-1 min-w-44">
                    <Search size={16} className="absolute left-3 top-3" style={{ color: '#0066cc' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Cliente, NIF, operadora, parceiro..." className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition"
                      style={{ border: '2px solid #d0e8ff', color: '#003d99', background: 'rgba(255,255,255,0.9)' }}
                      onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                      onBlur={(e) => e.target.style.borderColor = '#d0e8ff'} />
                  </div>
                  <select value={filterParceiro} onChange={e => setFilterParceiro(e.target.value)}
                    className="rounded-lg px-4 py-2.5 text-sm outline-none transition font-medium" style={{ border: '2px solid #d0e8ff', color: '#003d99', background: 'rgba(255,255,255,0.9)' }}
                    onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                    onBlur={(e) => e.target.style.borderColor = '#d0e8ff'}>
                    <option value="todos">Todos os parceiros</option>
                    {parceirosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-lg px-4 py-2.5 text-sm outline-none transition font-medium" style={{ border: '2px solid #d0e8ff', color: '#003d99', background: 'rgba(255,255,255,0.9)' }}
                    onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                    onBlur={(e) => e.target.style.borderColor = '#d0e8ff'}>
                    <option value="todas">Todos os estados</option>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s].label}</option>)}
                  </select>
                  <select value={filterServico} onChange={e => setFilterServico(e.target.value)}
                    className="rounded-lg px-4 py-2.5 text-sm outline-none transition font-medium" style={{ border: '2px solid #d0e8ff', color: '#003d99', background: 'rgba(255,255,255,0.9)' }}
                    onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                    onBlur={(e) => e.target.style.borderColor = '#d0e8ff'}>
                    <option value="todos">Todos os serviços</option>
                    <option value="telecom">Telecom</option>
                    <option value="energia">Energia</option>
                    <option value="gas">Gás</option>
                    <option value="seguros">Seguros</option>
                  </select>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                  {['pendente', 'em_revisao', 'em_ativacao', 'ativa', 'pago'].map(s => {
                    const count = vendas.filter(v => v.status === s).length
                    const st = STATUS_LABELS[s]
                    return (
                      <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'todas' : s)}
                        className="rounded-2xl p-4 text-left transition-all shadow-lg hover:shadow-xl"
                        style={{ 
                          background: filterStatus === s ? st.bg : 'linear-gradient(135deg, #ffffff 0%, #f5f9ff 100%)',
                          border: `2px solid ${filterStatus === s ? st.color : '#d0e8ff'}`,
                          borderTop: '3px solid ' + st.color
                        }}>
                        <p className="text-2xl font-bold" style={{ color: st.color }}>{count}</p>
                        <p className="text-xs font-bold mt-1 uppercase tracking-wide" style={{ color: filterStatus === s ? st.color : '#475569' }}>{st.label}</p>
                      </button>
                    )
                  })}
                </div>

                {/* Tabela */}
                <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: '#fff', border: '1px solid #d0e8ff', borderTop: '2px solid #0066cc' }}>
                  <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f9fbfd 0%, #f0f7ff 100%)' }}>
                    <p className="text-sm font-semibold" style={{ color: '#003d99' }}>{filtered.length} resultados</p>
                    <p className="text-sm font-bold" style={{ color: '#0066cc' }}>
                      Total: {totalFiltrado.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} EUR
                    </p>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="p-12 text-center">
                      <ShoppingCart size={40} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
                      <p className="text-sm" style={{ color: '#9ca3af' }}>Nenhuma venda encontrada</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            {['Cliente', 'Parceiro', 'Servico', 'Valor', 'Data', 'Estado', ''].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((v, i) => {
                            const st = STATUS_LABELS[v.status] || { label: v.status, color: '#475569', bg: '#f3f4f6' }
                            const isSelected = selected?.id === v.id
                            return (
                              <tr key={v.id}
                                onClick={() => isSelected ? closeDetail() : openDetail(v)}
                                className="cursor-pointer transition-colors"
                                style={{
                                  borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none',
                                  background: isSelected ? '#eef2ff' : undefined,
                                }}>
                                <td className="px-4 py-3">
                                  <p className="font-medium" style={{ color: '#1e293b' }}>{v.client_name}</p>
                                  {v.client_nif && <p className="text-xs font-mono mt-0.5" style={{ color: '#64748b' }}>NIF: {v.client_nif}</p>}
                                </td>
                                <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{v.parceiro_name || '—'}</td>
                                <td className="px-4 py-3">
                                  <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: '#eef2ff', color: '#0ea5e9' }}>
                                    {v.service_type}{v.plano ? ` · ${v.plano}` : ''}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#1e293b' }}>
                                  {(v.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
                                </td>
                                <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>
                                  {new Date(v.created_at).toLocaleDateString('pt-PT')}
                                </td>
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                  <div className="relative inline-block">
                                    <select value={v.status} onChange={e => changeStatus(v.id, e.target.value)}
                                      disabled={updating === v.id}
                                      className="rounded-full px-3 py-1 text-xs font-semibold cursor-pointer outline-none appearance-none pr-6 disabled:opacity-50"
                                      style={{ background: st.bg, color: st.color, border: 'none' }}>
                                      {STATUSES.map(s => (
                                        <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
                                      ))}
                                    </select>
                                    <ChevronDown size={10} className="absolute right-1.5 top-1.5 pointer-events-none" style={{ color: st.color }} />
                                  </div>
                                </td>
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                  {confirmDelete === v.id ? (
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => deleteVenda(v.id)} disabled={deleting === v.id}
                                        className="rounded-lg px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                        style={{ background: '#dc2626' }}>
                                        {deleting === v.id ? '...' : 'Confirmar'}
                                      </button>
                                      <button onClick={() => setConfirmDelete(null)}
                                        className="rounded-lg px-2 py-1 text-xs font-medium"
                                        style={{ background: '#f8fafc', color: '#475569' }}>
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <button onClick={() => setConfirmDelete(v.id)}
                                      className="rounded-lg p-1.5 transition hover:opacity-80"
                                      style={{ background: '#fef2f2' }} title="Apagar venda">
                                      <Trash2 size={14} style={{ color: '#dc2626' }} />
                                    </button>
                                  )}
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

              {/* Painel de detalhe */}
              {selected && (
                <div className="w-full max-w-sm flex-shrink-0" style={{ minWidth: 340 }}>
                  <div className="rounded-xl shadow-sm sticky top-20 overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>{selected.client_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                          {new Date(selected.created_at).toLocaleDateString('pt-PT')} · {selected.parceiro_name}
                        </p>
                      </div>
                      <button onClick={closeDetail} className="rounded-lg p-1.5 transition hover:opacity-70" style={{ background: '#f8fafc' }}>
                        <X size={16} style={{ color: '#64748b' }} />
                      </button>
                    </div>

                    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                      {/* Dados do Cliente */}
                      <section className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User size={14} style={{ color: '#0ea5e9' }} />
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#0ea5e9' }}>Dados do Cliente</p>
                          </div>
                          {!editingClient && (
                            <button
                              onClick={() => setEditingClient(true)}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80"
                              style={{ background: '#eef2ff', color: '#0ea5e9' }}
                            >
                              <Edit3 size={12} />
                              Editar Dados
                            </button>
                          )}
                        </div>

                        {editingClient ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Nome *</label>
                                <input
                                  type="text"
                                  value={clientForm.client_name}
                                  onChange={e => setClientForm(f => ({ ...f, client_name: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="Nome completo do cliente"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>NIF</label>
                                <input
                                  type="text"
                                  value={clientForm.client_nif}
                                  onChange={e => setClientForm(f => ({ ...f, client_nif: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="123456789"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>CC / BI</label>
                                <input
                                  type="text"
                                  value={clientForm.client_cc}
                                  onChange={e => setClientForm(f => ({ ...f, client_cc: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="12345678"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Telemovel</label>
                                <input
                                  type="text"
                                  value={clientForm.client_phone}
                                  onChange={e => setClientForm(f => ({ ...f, client_phone: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="912345678"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Email</label>
                                <input
                                  type="email"
                                  value={clientForm.client_email}
                                  onChange={e => setClientForm(f => ({ ...f, client_email: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="email@exemplo.pt"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>IBAN</label>
                                <input
                                  type="text"
                                  value={clientForm.client_iban}
                                  onChange={e => setClientForm(f => ({ ...f, client_iban: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="PT50 0000 0000 0000 0000 0000 0"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Morada</label>
                                <input
                                  type="text"
                                  value={clientForm.client_address}
                                  onChange={e => setClientForm(f => ({ ...f, client_address: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="Rua, Numero, Codigo Postal, Localidade"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={saveClientData}
                                disabled={savingClient || !clientForm.client_name.trim()}
                                className="flex-1 rounded-lg py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                style={{ background: '#059669' }}
                              >
                                {savingClient ? 'A guardar...' : 'Guardar Alteracoes'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingClient(false)
                                  setClientForm({
                                    client_name: selected.client_name || '',
                                    client_nif: selected.client_nif || '',
                                    client_cc: selected.client_cc || '',
                                    client_phone: selected.client_phone || '',
                                    client_email: selected.client_email || '',
                                    client_iban: selected.client_iban || '',
                                    client_address: selected.client_address || '',
                                  })
                                }}
                                className="rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-70"
                                style={{ background: '#f8fafc', color: '#475569' }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <Field label="Nome" value={selected.client_name} />
                            <Field label="NIF" value={selected.client_nif} />
                            <Field label="CC / BI" value={selected.client_cc} />
                            <Field label="Telemovel" value={selected.client_phone} />
                            <Field label="Email" value={selected.client_email} />
                            <Field label="IBAN" value={selected.client_iban} />
                            <div className="col-span-2">
                              <Field label="Morada" value={selected.client_address || 'Sem morada definida'} />
                            </div>
                          </div>
                        )}
                      </section>

                      {/* Dados do Produto */}
                      <section className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Package size={14} style={{ color: '#0ea5e9' }} />
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#0ea5e9' }}>Dados do Produto</p>
                          </div>
                          {!editingProduct && (
                            <button
                              onClick={() => setEditingProduct(true)}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80"
                              style={{ background: '#eef2ff', color: '#0ea5e9' }}
                            >
                              <Edit3 size={12} />
                              Editar Produto
                            </button>
                          )}
                        </div>

                        {editingProduct ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              {/* Campos Base */}
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Tipo de Servico</label>
                                <select
                                  value={productForm.service_type}
                                  onChange={e => setProductForm(f => ({ ...f, service_type: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                >
                                  <option value="">Selecionar...</option>
                                  <option value="energia">Energia</option>
                                  <option value="gas">Gas</option>
                                  <option value="telecom">Telecom</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Operadora</label>
                                <input
                                  type="text"
                                  value={productForm.operator}
                                  onChange={e => setProductForm(f => ({ ...f, operator: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="Nome da operadora"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Plano</label>
                                <input
                                  type="text"
                                  value={productForm.plano}
                                  onChange={e => setProductForm(f => ({ ...f, plano: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="Nome do plano"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Valor (EUR)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={productForm.amount}
                                  onChange={e => setProductForm(f => ({ ...f, amount: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="0.00"
                                />
                              </div>

                              {/* Campos Energia/Gas */}
                              {(productForm.service_type === 'energia' || productForm.service_type === 'gas') && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Tipo Energia</label>
                                    <select
                                      value={productForm.energia_tipo}
                                      onChange={e => setProductForm(f => ({ ...f, energia_tipo: e.target.value }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm"
                                      style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                    >
                                      <option value="">Selecionar...</option>
                                      <option value="eletricidade">Eletricidade</option>
                                      <option value="gas">Gas</option>
                                      <option value="dual">Dual</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Tipo de Processo</label>
                                    <select
                                      value={productForm.energia_tipo_processo}
                                      onChange={e => setProductForm(f => ({ ...f, energia_tipo_processo: e.target.value }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm"
                                      style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                    >
                                      <option value="">Selecionar...</option>
                                      <option value="mudanca">Mudanca de Comercializador</option>
                                      <option value="nova_ligacao">Nova Ligacao</option>
                                      <option value="reativacao">Reativacao</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2 col-span-2">
                                    <input
                                      type="checkbox"
                                      id="is_dual"
                                      checked={productForm.is_dual}
                                      onChange={e => setProductForm(f => ({ ...f, is_dual: e.target.checked }))}
                                      className="rounded"
                                    />
                                    <label htmlFor="is_dual" className="text-sm" style={{ color: '#475569' }}>Contrato Dual (Eletricidade + Gas)</label>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>CPE</label>
                                    <input
                                      type="text"
                                      value={productForm.cpe}
                                      onChange={e => setProductForm(f => ({ ...f, cpe: e.target.value }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                                      style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                      placeholder="PT0000..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>CUI</label>
                                    <input
                                      type="text"
                                      value={productForm.cui}
                                      onChange={e => setProductForm(f => ({ ...f, cui: e.target.value }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                                      style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                      placeholder="PT0000..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Potencia</label>
                                    <input
                                      type="text"
                                      value={productForm.potencia}
                                      onChange={e => setProductForm(f => ({ ...f, potencia: e.target.value }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm"
                                      style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                      placeholder="ex: 6.9 kVA"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Escalao</label>
                                    <input
                                      type="text"
                                      value={productForm.escalao}
                                      onChange={e => setProductForm(f => ({ ...f, escalao: e.target.value }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm"
                                      style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                      placeholder="ex: 1, 2, 3..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Escalao Gas</label>
                                    <input
                                      type="text"
                                      value={productForm.gas_escalao}
                                      onChange={e => setProductForm(f => ({ ...f, gas_escalao: e.target.value }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm"
                                      style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                      placeholder="ex: 1, 2, 3..."
                                    />
                                  </div>
                                </>
                              )}

                              {/* Campos Telecom */}
                              {productForm.service_type === 'telecom' && (
                                <>
                                  <div className="col-span-2">
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Numeros Movel</label>
                                    <div className="space-y-2">
                                      {productForm.telco_numeros.map((num, idx) => (
                                        <div key={idx} className="flex gap-2">
                                          <input
                                            type="text"
                                            value={num.numero}
                                            onChange={e => {
                                              const updated = [...productForm.telco_numeros]
                                              updated[idx] = { ...updated[idx], numero: e.target.value }
                                              setProductForm(f => ({ ...f, telco_numeros: updated }))
                                            }}
                                            className="flex-1 rounded-lg px-3 py-2 text-sm font-mono"
                                            style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                            placeholder="912345678"
                                          />
                                          <input
                                            type="text"
                                            value={num.cvp}
                                            onChange={e => {
                                              const updated = [...productForm.telco_numeros]
                                              updated[idx] = { ...updated[idx], cvp: e.target.value }
                                              setProductForm(f => ({ ...f, telco_numeros: updated }))
                                            }}
                                            className="w-24 rounded-lg px-3 py-2 text-sm font-mono"
                                            style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                            placeholder="CVP"
                                          />
                                          <button
                                            onClick={() => {
                                              const updated = productForm.telco_numeros.filter((_, i) => i !== idx)
                                              setProductForm(f => ({ ...f, telco_numeros: updated }))
                                            }}
                                            className="px-2 rounded-lg text-red-600 hover:bg-red-50"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        onClick={() => setProductForm(f => ({ ...f, telco_numeros: [...f.telco_numeros, { numero: '', cvp: '' }] }))}
                                        className="text-xs font-medium px-3 py-1.5 rounded-lg"
                                        style={{ background: '#eef2ff', color: '#0ea5e9' }}
                                      >
                                        + Adicionar Numero
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Numero Fixo</label>
                                    <input
                                      type="text"
                                      value={productForm.telco_fixo}
                                      onChange={e => setProductForm(f => ({ ...f, telco_fixo: e.target.value }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                                      style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                      placeholder="211234567"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>CVP Fixo</label>
                                    <input
                                      type="text"
                                      value={productForm.telco_fixo_cvp}
                                      onChange={e => setProductForm(f => ({ ...f, telco_fixo_cvp: e.target.value }))}
                                      className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                                      style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                      placeholder="CVP"
                                    />
                                  </div>
                                </>
                              )}

                              <div className="col-span-2">
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Descricao</label>
                                <input
                                  type="text"
                                  value={productForm.description}
                                  onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                                  className="w-full rounded-lg px-3 py-2 text-sm"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="Descricao do produto/servico"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Notas</label>
                                <textarea
                                  value={productForm.notes}
                                  onChange={e => setProductForm(f => ({ ...f, notes: e.target.value }))}
                                  rows={2}
                                  className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                                  style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                  placeholder="Notas adicionais..."
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={saveProductData}
                                disabled={savingProduct}
                                className="flex-1 rounded-lg py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                style={{ background: '#059669' }}
                              >
                                {savingProduct ? 'A guardar...' : 'Guardar Alteracoes'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProduct(false)
                                  setProductForm({
                                    service_type: selected.service_type || '',
                                    operator: selected.operator || '',
                                    plano: selected.plano || '',
                                    amount: selected.amount?.toString() || '',
                                    description: selected.description || '',
                                    notes: selected.notes || '',
                                    energia_tipo: selected.energia_tipo || '',
                                    energia_tipo_processo: selected.energia_tipo_processo || '',
                                    is_dual: selected.is_dual || false,
                                    cpe: selected.cpe || '',
                                    cui: selected.cui || '',
                                    potencia: selected.potencia || '',
                                    escalao: selected.escalao || '',
                                    gas_escalao: selected.gas_escalao || '',
                                    telco_numeros: selected.telco_numeros || [],
                                    telco_fixo: selected.telco_fixo || '',
                                    telco_fixo_cvp: selected.telco_fixo_cvp || '',
                                  })
                                }}
                                className="rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-70"
                                style={{ background: '#f8fafc', color: '#475569' }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <Field label="Servico" value={selected.service_type} />
                            <Field label="Operadora" value={selected.operator} />
                            <Field label="Plano" value={selected.plano} />
                            <Field label="Valor" value={selected.amount ? `${selected.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} EUR` : null} />
                            {/* Campos Energia */}
                            {(selected.service_type === 'energia' || selected.service_type === 'gas') && (
                              <>
                                <Field label="Tipo" value={selected.energia_tipo} />
                                <Field label="Tipo Processo" value={selected.energia_tipo_processo ? TIPO_PROCESSO_LABELS[selected.energia_tipo_processo] || selected.energia_tipo_processo : null} />
                                <Field label="Dual" value={selected.is_dual ? 'Sim' : null} />
                                <Field label="CPE" value={selected.cpe} />
                                <Field label="CUI" value={selected.cui} />
                                <Field label="Potencia" value={selected.potencia} />
                                <Field label="Escalao" value={selected.escalao} />
                                <Field label="Escalao Gas" value={selected.gas_escalao} />
                              </>
                            )}
                            {/* Campos Telco */}
                            {selected.service_type === 'telecom' && (
                              <>
                                {selected.telco_numeros && selected.telco_numeros.length > 0 && (
                                  <div className="col-span-2">
                                    <p className="text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>Numeros Movel</p>
                                    <div className="space-y-1">
                                      {selected.telco_numeros.map((t, i) => (
                                        <div key={i} className="flex gap-2 text-sm">
                                          <span className="font-mono" style={{ color: '#1e293b' }}>{t.numero || '-'}</span>
                                          {t.cvp && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#eef2ff', color: '#0ea5e9' }}>CVP: {t.cvp}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selected.telco_fixo && (
                                  <div className="col-span-2">
                                    <p className="text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>Numero Fixo</p>
                                    <div className="flex gap-2 text-sm">
                                      <span className="font-mono" style={{ color: '#1e293b' }}>{selected.telco_fixo}</span>
                                      {selected.telco_fixo_cvp && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#fef3c7', color: '#92400e' }}>CVP: {selected.telco_fixo_cvp}</span>}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            <div className="col-span-2">
                              <Field label="Descricao" value={selected.description} />
                            </div>
                            {selected.notes && (
                              <div className="col-span-2">
                                <p className="text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>Notas do Parceiro</p>
                                <div className="rounded-lg px-3 py-2 text-sm whitespace-pre-wrap" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
                                  {selected.notes}
                                </div>
                              </div>
                            )}
                            {/* CPEs e CUIs multiplos */}
                            {selected.cpes && selected.cpes.length > 1 && (
                              <div className="col-span-2">
                                <p className="text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>CPEs Adicionais</p>
                                <div className="flex flex-wrap gap-1">
                                  {selected.cpes.map((c, i) => (
                                    <span key={i} className="rounded px-2 py-1 text-xs font-mono" style={{ background: '#eef2ff', color: '#0ea5e9' }}>{c}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selected.cuis && selected.cuis.length > 1 && (
                              <div className="col-span-2">
                                <p className="text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>CUIs Adicionais</p>
                                <div className="flex flex-wrap gap-1">
                                  {selected.cuis.map((c, i) => (
                                    <span key={i} className="rounded px-2 py-1 text-xs font-mono" style={{ background: '#fef3c7', color: '#92400e' }}>{c}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selected.gas_escalao && (
                              <Field label="Escalao Gas" value={`Escalao ${selected.gas_escalao}`} />
                            )}
                          </div>
                        )}
                      </section>

                      {/* Feedback do Admin */}
                      <section className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#dc2626' }}>Feedback do Administrador</p>
                        <textarea
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
                          style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#1e293b' }}
                          placeholder="Escreva aqui o feedback sobre esta venda... (visivel para o parceiro)"
                        />
                        <button
                          onClick={saveFeedback}
                          disabled={savingFeedback}
                          className="mt-2 w-full rounded-lg py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                          style={{ background: '#dc2626' }}
                        >
                          {savingFeedback ? 'A guardar...' : 'Guardar Feedback'}
                        </button>
                      </section>

                      {/* Chargeback */}
                      <section className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7c2d12' }}>Chargeback</p>
                          {!showChargebackForm && selected.status !== 'chargeback' && (
                            <button
                              onClick={() => setShowChargebackForm(true)}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80"
                              style={{ background: '#ffedd5', color: '#7c2d12' }}
                            >
                              Aplicar Chargeback
                            </button>
                          )}
                        </div>
                        {selected.status === 'chargeback' && (
                          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: '#ffedd5', color: '#7c2d12' }}>
                            Esta venda tem chargeback aplicado.
                          </div>
                        )}
                        {showChargebackForm && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Valor *</label>
                              <input
                                type="number"
                                step="0.01"
                                value={chargebackValor}
                                onChange={e => setChargebackValor(e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-sm"
                                style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Motivo *</label>
                              <select
                                value={chargebackMotivo}
                                onChange={e => setChargebackMotivo(e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-sm"
                                style={{ border: '1px solid #d1d5db', background: '#fff' }}
                              >
                                <option value="">Selecionar motivo...</option>
                                <option value="Cancelamento de contrato">Cancelamento de contrato</option>
                                <option value="Venda rejeitada pela operadora">Venda rejeitada pela operadora</option>
                                <option value="Dados incorretos">Dados incorretos</option>
                                <option value="Cliente desistiu">Cliente desistiu</option>
                                <option value="Fraude">Fraude</option>
                                <option value="Outro">Outro</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Observacoes</label>
                              <textarea
                                value={chargebackObs}
                                onChange={e => setChargebackObs(e.target.value)}
                                rows={2}
                                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                                style={{ border: '1px solid #d1d5db', background: '#fff' }}
                                placeholder="Detalhes adicionais..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={createChargeback}
                                disabled={savingChargeback || !chargebackValor || !chargebackMotivo}
                                className="flex-1 rounded-lg py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                style={{ background: '#7c2d12' }}
                              >
                                {savingChargeback ? 'A processar...' : 'Confirmar Chargeback'}
                              </button>
                              <button
                                onClick={() => setShowChargebackForm(false)}
                                className="rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-70"
                                style={{ background: '#f8fafc', color: '#475569' }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </section>

                      {/* Ficheiros */}
                      <section className="px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Paperclip size={14} style={{ color: '#0ea5e9' }} />
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#0ea5e9' }}>
                              Ficheiros {docs.length > 0 ? `(${docs.length})` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => loadDocs(selected.id)} title="Atualizar" className="rounded-lg p-1 transition hover:opacity-70" style={{ background: '#f8fafc' }}>
                              <RefreshCw size={12} style={{ color: '#64748b' }} />
                            </button>
                            <label className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition hover:opacity-80"
                              style={{ background: '#eef2ff', color: '#0ea5e9' }}>
                              <Upload size={12} />
                              {uploadingDoc ? 'A carregar...' : 'Adicionar'}
                              <input type="file" className="hidden" onChange={handleUpload} disabled={uploadingDoc} />
                            </label>
                          </div>
                        </div>

                        {uploadErr && (
                          <p className="text-xs mb-2 rounded-lg px-3 py-2" style={{ background: '#fef2f2', color: '#dc2626' }}>{uploadErr}</p>
                        )}

                        {docsLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#4338ca' }} />
                          </div>
                        ) : docs.length === 0 ? (
                          <div className="rounded-xl py-6 text-center" style={{ background: '#f9fafb', border: '1px dashed #e5e7eb' }}>
                            <Paperclip size={24} className="mx-auto mb-2" style={{ color: '#d1d5db' }} />
                            <p className="text-xs" style={{ color: '#9ca3af' }}>Nenhum ficheiro carregado</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {docs.map(doc => (
                              <div key={doc.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                                style={{ background: doc._orphan ? '#fffbeb' : '#f9fafb', border: `1px solid ${doc._orphan ? '#fde68a' : '#e5e7eb'}` }}>
                                <DocIcon type={doc.file_type} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate" style={{ color: '#1e293b' }}>{doc.file_name}</p>
                                  <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                                    {fmtSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString('pt-PT')}
                                    {doc.uploader_name ? ` · ${doc.uploader_name}` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {doc.signed_url ? (
                                    <>
                                      <a href={doc.signed_url} target="_blank" rel="noreferrer"
                                        className="rounded-lg p-1.5 transition hover:opacity-80"
                                        style={{ background: '#eef2ff' }} title="Abrir">
                                        <ExternalLink size={12} style={{ color: '#0ea5e9' }} />
                                      </a>
                                      <a href={doc.signed_url} download={doc.file_name} target="_blank" rel="noreferrer"
                                        className="rounded-lg p-1.5 transition hover:opacity-80"
                                        style={{ background: '#f0fdf4' }} title="Download">
                                        <Download size={12} style={{ color: '#16a34a' }} />
                                      </a>
                                    </>
                                  ) : (
                                    <span className="text-xs px-2" style={{ color: '#9ca3af' }}>Sem link</span>
                                  )}
                                  {!doc._orphan && (
                                    <button onClick={() => deleteDoc(doc.id)}
                                      className="rounded-lg p-1.5 transition hover:opacity-80"
                                      style={{ background: '#fef2f2' }} title="Apagar">
                                      <Trash2 size={12} style={{ color: '#dc2626' }} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
