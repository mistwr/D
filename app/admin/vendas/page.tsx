'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  ShoppingCart, Search, ChevronDown, Trash2, X, FileText,
  User, Package, Paperclip, ExternalLink, Download, Upload, RefreshCw
} from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pendente:   { label: 'Pendente',    color: '#92400e', bg: '#fef3c7' },
  em_revisao: { label: 'Em Revisao',  color: '#1e40af', bg: '#dbeafe' },
  ativa:      { label: 'Ativa',       color: '#065f46', bg: '#d1fae5' },
  pago:       { label: 'Pago',        color: '#065f46', bg: '#bbf7d0' },
  cancelado:  { label: 'Cancelado',   color: '#991b1b', bg: '#fee2e2' },
  rejeitado:  { label: 'Rejeitado',   color: '#7f1d1d', bg: '#fecaca' },
}

const STATUSES = Object.keys(STATUS_LABELS)

interface Venda {
  id: string
  client_name: string; client_email: string; client_phone: string
  client_nif: string; client_cc: string; client_iban: string
  amount: number; status: string; service_type: string
  operator: string; plano: string; description: string
  notes: string; is_dual: boolean; energia_tipo: string
  cpe: string; cui: string; potencia: string; escalao: string
  gas_escalao: string; cpes: string[]; cuis: string[]
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
      <p className="text-sm font-medium break-all" style={{ color: '#111827' }}>{String(value)}</p>
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
    loadDocs(v.id)
  }

  function closeDetail() {
    setSelected(null)
    setDocs([])
    setUploadErr('')
    setFeedback('')
  }

  async function saveFeedback() {
    if (!selected) return
    setSavingFeedback(true)
    await authFetch('/api/vendas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, admin_feedback: feedback }),
    })
    setVendas(prev => prev.map(v => v.id === selected.id ? { ...v, admin_feedback: feedback } : v))
    setSelected(prev => prev ? { ...prev, admin_feedback: feedback } : prev)
    setSavingFeedback(false)
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
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
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
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-5">
              <ShoppingCart size={26} style={{ color: '#4338ca' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Gestao de Vendas</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>{vendas.length} vendas registadas</p>
              </div>
            </div>

            <div className="flex gap-5">
              {/* Lista */}
              <div className="flex-1 min-w-0">
                {/* Filtros */}
                <div className="rounded-xl p-3 mb-4 flex flex-wrap gap-2" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="relative flex-1 min-w-44">
                    <Search size={15} className="absolute left-3 top-2.5" style={{ color: '#9ca3af' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Cliente, NIF, operadora, parceiro..." className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: '1px solid #d1d5db', color: '#111827' }} />
                  </div>
                  <select value={filterParceiro} onChange={e => setFilterParceiro(e.target.value)}
                    className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}>
                    <option value="todos">Todos os parceiros</option>
                    {parceirosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}>
                    <option value="todas">Todos os estados</option>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s].label}</option>)}
                  </select>
                  <select value={filterServico} onChange={e => setFilterServico(e.target.value)}
                    className="rounded-lg px-3 py-2 text-sm outline-none" style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}>
                    <option value="todos">Todos os servicos</option>
                    <option value="telecom">Telecom</option>
                    <option value="energia">Energia</option>
                    <option value="gas">Gas</option>
                    <option value="seguros">Seguros</option>
                  </select>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {['pendente', 'ativa', 'pago', 'cancelado'].map(s => {
                    const count = vendas.filter(v => v.status === s).length
                    const st = STATUS_LABELS[s]
                    return (
                      <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'todas' : s)}
                        className="rounded-xl p-3 text-left transition-all"
                        style={{ background: filterStatus === s ? st.bg : '#fff', border: `1px solid ${filterStatus === s ? 'transparent' : '#e5e7eb'}` }}>
                        <p className="text-xl font-bold" style={{ color: st.color }}>{count}</p>
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#6b7280' }}>{st.label}</p>
                      </button>
                    )
                  })}
                </div>

                {/* Tabela */}
                <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <p className="text-sm font-medium" style={{ color: '#374151' }}>{filtered.length} resultados</p>
                    <p className="text-sm font-semibold" style={{ color: '#4338ca' }}>
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
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            {['Cliente', 'Parceiro', 'Servico', 'Valor', 'Data', 'Estado', ''].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((v, i) => {
                            const st = STATUS_LABELS[v.status] || { label: v.status, color: '#374151', bg: '#f3f4f6' }
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
                                  <p className="font-medium" style={{ color: '#111827' }}>{v.client_name}</p>
                                  {v.client_nif && <p className="text-xs font-mono mt-0.5" style={{ color: '#6b7280' }}>NIF: {v.client_nif}</p>}
                                </td>
                                <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>{v.parceiro_name || '—'}</td>
                                <td className="px-4 py-3">
                                  <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: '#eef2ff', color: '#4338ca' }}>
                                    {v.service_type}{v.plano ? ` · ${v.plano}` : ''}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-xs" style={{ color: '#111827' }}>
                                  {(v.amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} €
                                </td>
                                <td className="px-4 py-3 text-xs" style={{ color: '#6b7280' }}>
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
                                        style={{ background: '#f3f4f6', color: '#374151' }}>
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
                  <div className="rounded-xl shadow-sm sticky top-20 overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#111827' }}>{selected.client_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                          {new Date(selected.created_at).toLocaleDateString('pt-PT')} · {selected.parceiro_name}
                        </p>
                      </div>
                      <button onClick={closeDetail} className="rounded-lg p-1.5 transition hover:opacity-70" style={{ background: '#f3f4f6' }}>
                        <X size={16} style={{ color: '#6b7280' }} />
                      </button>
                    </div>

                    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                      {/* Dados do Cliente */}
                      <section className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <User size={14} style={{ color: '#4338ca' }} />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4338ca' }}>Dados do Cliente</p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <Field label="Nome" value={selected.client_name} />
                          <Field label="NIF" value={selected.client_nif} />
                          <Field label="CC / BI" value={selected.client_cc} />
                          <Field label="Telemovel" value={selected.client_phone} />
                          <Field label="Email" value={selected.client_email} />
                          <Field label="IBAN" value={selected.client_iban} />
                        </div>
                      </section>

                      {/* Dados do Produto */}
                      <section className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <Package size={14} style={{ color: '#4338ca' }} />
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4338ca' }}>Dados do Produto</p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <Field label="Servico" value={selected.service_type} />
                          <Field label="Operadora" value={selected.operator} />
                          <Field label="Plano" value={selected.plano} />
                          <Field label="Valor" value={selected.amount ? `${selected.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} EUR` : null} />
                          {selected.service_type === 'energia' || selected.service_type === 'gas' ? (
                            <>
                              <Field label="Tipo" value={selected.energia_tipo} />
                              <Field label="Dual" value={selected.is_dual ? 'Sim' : null} />
                              <Field label="CPE" value={selected.cpe} />
                              <Field label="CUI" value={selected.cui} />
                              <Field label="Potencia" value={selected.potencia} />
                              <Field label="Escalao" value={selected.escalao} />
                            </>
                          ) : null}
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
                                  <span key={i} className="rounded px-2 py-1 text-xs font-mono" style={{ background: '#eef2ff', color: '#4338ca' }}>{c}</span>
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
                      </section>

                      {/* Feedback do Admin */}
                      <section className="px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#dc2626' }}>Feedback do Administrador</p>
                        <textarea
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
                          style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#111827' }}
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

                      {/* Ficheiros */}
                      <section className="px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Paperclip size={14} style={{ color: '#4338ca' }} />
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4338ca' }}>
                              Ficheiros {docs.length > 0 ? `(${docs.length})` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => loadDocs(selected.id)} title="Atualizar" className="rounded-lg p-1 transition hover:opacity-70" style={{ background: '#f3f4f6' }}>
                              <RefreshCw size={12} style={{ color: '#6b7280' }} />
                            </button>
                            <label className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition hover:opacity-80"
                              style={{ background: '#eef2ff', color: '#4338ca' }}>
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
                                  <p className="text-xs font-medium truncate" style={{ color: '#111827' }}>{doc.file_name}</p>
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
                                        <ExternalLink size={12} style={{ color: '#4338ca' }} />
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
