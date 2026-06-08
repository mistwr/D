'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  FileText, Search, Download, Eye, X, ChevronDown, ChevronUp,
  User, Zap, Wifi, Building2, Mail, Phone, Trash2, RefreshCw
} from 'lucide-react'

interface Venda {
  id: string
  user_id: string
  client_name: string
  client_email: string
  client_phone: string
  client_nif: string
  client_cc: string
  client_iban: string
  service_type: string
  operator: string
  plano: string
  contract_type: string
  amount: number
  status: string
  notes: string
  description: string
  created_at: string
  parceiro_name: string
  parceiro_email?: string
  parceiro_company?: string
}

interface Doc {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_path: string
  created_at: string
  signed_url: string | null
  uploader_name: string
  _orphan?: boolean
}

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pendente:   { bg: '#fef3c7', color: '#92400e',  label: 'Pendente'   },
  em_revisao: { bg: '#dbeafe', color: '#1e40af',  label: 'Em Revisao' },
  ativa:      { bg: '#d1fae5', color: '#065f46',  label: 'Ativa'      },
  processado: { bg: '#ede9fe', color: '#6d28d9',  label: 'Processado' },
  pago:       { bg: '#d1fae5', color: '#065f46',  label: 'Pago'       },
  cancelado:  { bg: '#fee2e2', color: '#991b1b',  label: 'Cancelado'  },
  rejeitado:  { bg: '#fecaca', color: '#7f1d1d',  label: 'Rejeitado'  },
}

function formatSize(b: number) {
  if (!b) return '-'
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
  return (b / (1024 * 1024)).toFixed(1) + ' MB'
}

function getExt(name: string) {
  return (name || '').split('.').pop()?.toLowerCase() ?? ''
}

export default function AdminContratosPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [docsMap, setDocsMap] = useState<Record<string, Doc[]>>({})
  const [docsLoading, setDocsLoading] = useState<string | null>(null)
  const [viewer, setViewer] = useState<Doc | null>(null)
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null)

  async function loadVendas() {
    setLoading(true)
    try {
      const res = await authFetch('/api/vendas')
      const data = await res.json()
      setVendas(data.vendas || [])
    } catch { /* silencioso */ }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    loadVendas()
  }, [user, authFetch])

  async function toggleVenda(v: Venda) {
    if (expanded === v.id) { setExpanded(null); return }
    setExpanded(v.id)
    if (docsMap[v.id] !== undefined) return // ja carregado
    setDocsLoading(v.id)
    try {
      const res = await authFetch(`/api/documentos?venda_id=${v.id}`)
      const data = await res.json()
      setDocsMap(prev => ({ ...prev, [v.id]: data.documentos || [] }))
    } catch {
      setDocsMap(prev => ({ ...prev, [v.id]: [] }))
    }
    setDocsLoading(null)
  }

  async function deleteDoc(id: string, vendaId: string) {
    setDeletingDoc(id)
    const res = await authFetch('/api/documentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setDocsMap(prev => ({ ...prev, [vendaId]: (prev[vendaId] ?? []).filter(d => d.id !== id) }))
    }
    setDeletingDoc(null)
    setConfirmDeleteDoc(null)
  }

  async function reloadDocs(vendaId: string) {
    setDocsLoading(vendaId)
    try {
      const res = await authFetch(`/api/documentos?venda_id=${vendaId}`)
      const data = await res.json()
      setDocsMap(prev => ({ ...prev, [vendaId]: data.documentos || [] }))
    } catch { /* silencioso */ }
    setDocsLoading(null)
  }

  const filtered = vendas.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (v.client_name || '').toLowerCase().includes(q) ||
      (v.client_nif || '').toLowerCase().includes(q) ||
      (v.parceiro_name || '').toLowerCase().includes(q) ||
      (v.operator || '').toLowerCase().includes(q) ||
      (v.plano || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || v.status === filterStatus
    return matchSearch && matchStatus
  })

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" >
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )

  return (
    <div className="flex min-h-screen w-full" style={{ background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex flex-1 min-w-0">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:p-6">
          <div className="p-4 md:p-5 max-w-6xl mx-auto">

            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#1e293b' }}>Contratos / Vendas</h1>
                <p className="mt-0.5 text-xs" style={{ color: '#64748b' }}>
                  Todas as vendas registadas pelos parceiros com documentos associados
                </p>
              </div>
              <button onClick={loadVendas}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition hover:opacity-80"
                >
                <RefreshCw size={12} /> Actualizar
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              {[
                { label: 'Total',      value: vendas.length,                                              bg: '#e0e7ff', color: '#0ea5e9' },
                { label: 'Pendente',   value: vendas.filter(v => v.status === 'pendente').length,         bg: '#fef3c7', color: '#92400e' },
                { label: 'Em Revisao', value: vendas.filter(v => v.status === 'em_revisao').length,       bg: '#dbeafe', color: '#1e40af' },
                { label: 'Processado', value: vendas.filter(v => v.status === 'processado').length,       bg: '#ede9fe', color: '#6d28d9' },
                { label: 'Pago',       value: vendas.filter(v => v.status === 'pago').length,             bg: '#d1fae5', color: '#065f46' },
              ].map(s => (
                <div key={s.label} className="rounded-lg p-2.5 shadow-sm" >
                  <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="mb-3 rounded-lg p-2.5 flex flex-col md:flex-row gap-2" >
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2" style={{ color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar por cliente, NIF, parceiro..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
                  style={{ border: '1px solid #d1d5db', color: '#1e293b' }} />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="rounded-lg px-2.5 py-1.5 text-xs outline-none"
                style={{ border: '1px solid #d1d5db', color: '#1e293b', background: '#fff' }}>
                <option value="todos">Todos os estados</option>
                <option value="pendente">Pendente</option>
                <option value="em_revisao">Em Revisao</option>
                <option value="ativa">Ativa</option>
                <option value="processado">Processado</option>
                <option value="pago">Pago</option>
                <option value="cancelado">Cancelado</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
            </div>

            {/* Lista */}
            {filtered.length === 0 ? (
              <div className="rounded-lg p-6 text-center" >
                <FileText size={40} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
                <p className="text-sm font-medium" style={{ color: '#475569' }}>
                  {vendas.length === 0 ? 'Nenhuma venda registada ainda' : 'Nenhum resultado'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(v => {
                  const st = STATUS[v.status] || { bg: '#f3f4f6', color: '#64748b', label: v.status }
                  const isOpen = expanded === v.id
                  const docs = docsMap[v.id]
                  const isLoadingDocs = docsLoading === v.id

                  return (
                    <div key={v.id} className="rounded-lg shadow-sm overflow-hidden" >
                      {/* Linha principal */}
                      <button
                        onClick={() => toggleVenda(v)}
                        className="flex items-center justify-between w-full p-3 text-left"
                        style={{ borderBottom: isOpen ? '1px solid #e5e7eb' : 'none' }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0" >
                            <User size={16} style={{ color: '#4f46e5' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="font-bold text-xs" style={{ color: '#1e293b' }}>{v.client_name}</p>
                              {v.client_nif && (
                                <span className="text-xs font-mono px-1 py-0.5 rounded" >
                                  NIF {v.client_nif}
                                </span>
                              )}
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>
                                {st.label}
                              </span>
                              <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: v.service_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: v.service_type === 'energia' ? '#92400e' : '#4338ca' }}>
                                {v.service_type === 'energia' ? <Zap size={9} /> : <Wifi size={9} />}
                                {v.operator || v.service_type}
                                {v.plano ? ` · ${v.plano}` : ''}
                              </span>
                              {v.amount > 0 && (
                                <span className="text-xs font-semibold" style={{ color: '#059669' }}>
                                  €{v.amount.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-0.5">
                              {v.parceiro_name && (
                                <span className="flex items-center gap-0.5 text-xs" style={{ color: '#64748b' }}>
                                  <Building2 size={10} /> {v.parceiro_name}
                                </span>
                              )}
                              {v.client_phone && (
                                <span className="flex items-center gap-0.5 text-xs" style={{ color: '#64748b' }}>
                                  <Phone size={10} /> {v.client_phone}
                                </span>
                              )}
                              {v.client_email && (
                                <span className="flex items-center gap-0.5 text-xs" style={{ color: '#64748b' }}>
                                  <Mail size={10} /> {v.client_email}
                                </span>
                              )}
                              <span className="text-xs" style={{ color: '#9ca3af' }}>
                                {new Date(v.created_at).toLocaleDateString('pt-PT')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          {isOpen ? <ChevronUp size={16} style={{ color: '#9ca3af' }} /> : <ChevronDown size={16} style={{ color: '#9ca3af' }} />}
                        </div>
                      </button>

                      {/* Detalhe expandido */}
                      {isOpen && (
                        <div className="p-3 space-y-3">

                          {/* Notas do parceiro */}
                          {v.notes && (
                            <div className="rounded-lg px-4 py-3" >
                              <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: '#92400e' }}>Notas do Parceiro</p>
                              <p className="text-sm whitespace-pre-wrap" style={{ color: '#78350f' }}>{v.notes}</p>
                            </div>
                          )}

                          {/* Dados extras */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                              { label: 'CC', value: v.client_cc },
                              { label: 'IBAN', value: v.client_iban },
                              { label: 'Contrato', value: v.contract_type },
                              { label: 'Descricao', value: v.description },
                            ].filter(f => f.value).map(f => (
                              <div key={f.label} className="rounded-lg px-3 py-2" >
                                <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>{f.label}</p>
                                <p className="text-sm font-medium mt-0.5 break-all" style={{ color: '#1e293b' }}>{f.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Documentos */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>
                                Documentos
                                {docs && docs.length > 0 && ` (${docs.length})`}
                              </p>
                              <button onClick={() => reloadDocs(v.id)}
                                className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition hover:opacity-80"
                                >
                                <RefreshCw size={11} /> Actualizar
                              </button>
                            </div>

                            {isLoadingDocs ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#0ea5e9' }} />
                              </div>
                            ) : !docs || docs.length === 0 ? (
                              <div className="rounded-xl p-6 text-center" >
                                <FileText size={28} className="mx-auto mb-2" style={{ color: '#d1d5db' }} />
                                <p className="text-sm" style={{ color: '#9ca3af' }}>Nenhum documento carregado nesta venda</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {docs.map(d => {
                                  const ext = getExt(d.file_name)
                                  const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext)
                                  const isPdf = ext === 'pdf'
                                  return (
                                    <div key={d.id} className="rounded-xl overflow-hidden"
                                      style={{ border: `1px solid ${d._orphan ? '#fde68a' : '#e5e7eb'}` }}>
                                      <div className="flex flex-wrap items-center gap-3 px-4 py-3"
                                        style={{ background: d._orphan ? '#fffbeb' : '#f9fafb' }}>
                                        <span className="flex h-7 w-10 items-center justify-center rounded text-[10px] font-bold uppercase flex-shrink-0"
                                          >
                                          {ext || 'DOC'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold truncate" style={{ color: '#1e293b' }}>{d.file_name}</p>
                                          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                                            {formatSize(d.file_size)} · {new Date(d.created_at).toLocaleDateString('pt-PT')}
                                            {d.uploader_name ? ` · ${d.uploader_name}` : ''}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {d.signed_url && (isImage || isPdf) && (
                                            <button onClick={() => setViewer(d)}
                                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                                              >
                                              <Eye size={13} /> Ver
                                            </button>
                                          )}
                                          {d.signed_url ? (
                                            <a href={d.signed_url} download={d.file_name} target="_blank" rel="noreferrer"
                                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                                              >
                                              <Download size={13} /> Download
                                            </a>
                                          ) : (
                                            <span className="text-xs px-3 py-1.5 rounded-lg" >
                                              URL expirada
                                            </span>
                                          )}
                                          {!d._orphan && (
                                            confirmDeleteDoc === d.id ? (
                                              <div className="flex items-center gap-1">
                                                <button onClick={() => deleteDoc(d.id, v.id)} disabled={deletingDoc === d.id}
                                                  className="rounded-lg px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                                  >
                                                  {deletingDoc === d.id ? '...' : 'Confirmar'}
                                                </button>
                                                <button onClick={() => setConfirmDeleteDoc(null)}
                                                  className="rounded-lg px-2 py-1 text-xs"
                                                  >
                                                  Cancelar
                                                </button>
                                              </div>
                                            ) : (
                                              <button onClick={() => setConfirmDeleteDoc(d.id)}
                                                className="rounded-lg p-1.5 transition hover:opacity-80"
                                                
                                                title="Apagar documento">
                                                <Trash2 size={14} style={{ color: '#dc2626' }} />
                                              </button>
                                            )
                                          )}
                                        </div>
                                      </div>
                                      {/* Preview imagem inline */}
                                      {d.signed_url && isImage && (
                                        <div className="p-3" >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={d.signed_url} alt={d.file_name}
                                            className="w-full rounded-lg object-contain max-h-48"
                                             />
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal viewer PDF / imagem */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setViewer(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
            
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>{viewer.file_name}</p>
              <div className="flex items-center gap-3">
                {viewer.signed_url && (
                  <a href={viewer.signed_url} download={viewer.file_name}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                    >
                    <Download size={13} /> Download
                  </a>
                )}
                <button onClick={() => setViewer(null)}
                  className="rounded-lg p-1.5 transition hover:opacity-80"
                  >
                  <X size={16} style={{ color: '#64748b' }} />
                </button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 70px)' }}>
              {['jpg','jpeg','png','gif','webp'].includes(getExt(viewer.file_name)) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewer.signed_url!} alt={viewer.file_name}
                  className="w-full object-contain" style={{ maxHeight: '80vh' }} />
              ) : (
                <iframe src={viewer.signed_url!} className="w-full" style={{ height: '80vh', border: 'none' }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
