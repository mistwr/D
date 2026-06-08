'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  FileText, Upload, Trash2, Download, Search, X,
  ChevronDown, ChevronRight, Eye, Package
} from 'lucide-react'

interface Venda {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  client_nif: string
  amount: number
  status: string
  service_type: string
  operator: string
  plano: string
  created_at: string
}

interface Doc {
  id: string
  file_name: string
  file_type: string
  file_size: number
  signed_url: string | null
  created_at: string
  venda_id: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente', aprovado: 'Aprovado', pago: 'Pago',
  cancelado: 'Cancelado', rejeitado: 'Rejeitado',
}
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pendente:   { bg: '#fef3c7', color: '#92400e' },
  aprovado:   { bg: '#d1fae5', color: '#065f46' },
  pago:       { bg: '#dcfce7', color: '#166534' },
  cancelado:  { bg: '#fee2e2', color: '#991b1b' },
  rejeitado:  { bg: '#fee2e2', color: '#991b1b' },
}
const SVC_LABELS: Record<string, string> = {
  telecom: 'Telecom', energia: 'Energia', gas: 'Gas', dual: 'Dual',
}

export default function ContratosPage() {
  const { user, loading: authLoading, authFetch } = useAuth('parceiro')

  // Vendas
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loadingVendas, setLoadingVendas] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [docsMap, setDocsMap] = useState<Record<string, Doc[]>>({})
  const [loadingDocs, setLoadingDocs] = useState<string | null>(null)
  const [viewer, setViewer] = useState<Doc | null>(null)

  // Docs gerais (sem venda)
  const [docsGerais, setDocsGerais] = useState<Doc[]>([])
  const [loadingGerais, setLoadingGerais] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadingVendaId, setUploadingVendaId] = useState<string | null>(null)

  // UI
  const [tab, setTab] = useState<'vendas' | 'gerais'>('vendas')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const vendaFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    loadVendas()
    loadDocsGerais()
  }, [user])

  async function loadVendas() {
    setLoadingVendas(true)
    try {
      const r = await authFetch('/api/vendas')
      const d = await r.json()
      setVendas(d.vendas || [])
    } catch {
      // falha silenciosa
    } finally {
      setLoadingVendas(false)
    }
  }

  async function loadDocsGerais() {
    setLoadingGerais(true)
    try {
      const r = await authFetch('/api/documentos?tipo=contrato')
      const d = await r.json()
      setDocsGerais(d.documentos || [])
    } catch {
      // falha silenciosa
    } finally {
      setLoadingGerais(false)
    }
  }

  async function loadDocsVenda(vendaId: string) {
    if (docsMap[vendaId] !== undefined) return
    setLoadingDocs(vendaId)
    const r = await authFetch(`/api/documentos?venda_id=${vendaId}`)
    const d = await r.json()
    setDocsMap(prev => ({ ...prev, [vendaId]: d.documentos || [] }))
    setLoadingDocs(null)
  }

  async function toggleVenda(id: string) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    await loadDocsVenda(id)
  }

  // Upload para uma venda específica
  async function handleUploadVenda(e: React.ChangeEvent<HTMLInputElement>, vendaId: string) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingVendaId(vendaId)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('venda_id', vendaId)
      const r = await authFetch('/api/documentos', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) {
        setUploadError(d.error || 'Erro ao enviar')
      } else {
        setDocsMap(prev => ({ ...prev, [vendaId]: undefined as any }))
        await loadDocsVenda(vendaId)
      }
    } catch (err: any) {
      setUploadError('Erro: ' + (err?.message || 'desconhecido'))
    } finally {
      setUploadingVendaId(null)
      if (vendaFileRef.current) vendaFileRef.current.value = ''
    }
  }

  // Upload geral (sem venda)
  async function handleUploadGeral(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', 'contrato')
      const r = await authFetch('/api/documentos', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) {
        setUploadError(d.error || 'Erro ao enviar ficheiro')
      } else {
        await loadDocsGerais()
      }
    } catch (err: any) {
      setUploadError('Erro: ' + (err?.message || 'desconhecido'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await authFetch('/api/documentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDocsGerais(prev => prev.filter(d => d.id !== id))
    // Remover também do docsMap se estiver lá
    setDocsMap(prev => {
      const next = { ...prev }
      for (const key in next) {
        if (next[key]) next[key] = next[key].filter(d => d.id !== id)
      }
      return next
    })
    setDeleting(null)
  }

  function isImage(doc: Doc) {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(doc.file_type?.toLowerCase())
  }

  const filteredVendas = vendas.filter(v =>
    v.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.operator?.toLowerCase().includes(search.toLowerCase()) ||
    v.plano?.toLowerCase().includes(search.toLowerCase())
  )

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen" >
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )

  const inp = { background: '#f9fafb', border: '1px solid #e2e8f0', color: '#1e293b' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div>
        <Sidebar userRole="parceiro" />
        <main className="pt-16 lg:ml-64 min-h-screen overflow-x-hidden">
          <div className="p-4 md:p-5 max-w-6xl mx-auto">

            {/* Cabecalho */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Contratos e Documentos</h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                  {vendas.length} venda{vendas.length !== 1 ? 's' : ''} registada{vendas.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => { setTab('gerais'); fileRef.current?.click() }} disabled={uploading}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                <Upload size={16} /> Enviar Documento Geral
              </button>
            </div>

            {/* Inputs hidden */}
            <input ref={fileRef} type="file" className="hidden" onChange={handleUploadGeral}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={uploading} />
            <input ref={vendaFileRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />

            {uploadError && (
              <div className="mb-4 rounded-xl p-4 flex items-start gap-3" >
                <X size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
                <p className="text-sm" style={{ color: '#991b1b' }}>{uploadError}</p>
                <button onClick={() => setUploadError('')} className="ml-auto"><X size={14} /></button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 rounded-xl p-1" >
              {[
                { key: 'vendas', label: `Vendas e Docs (${vendas.length})` },
                { key: 'gerais', label: `Documentos Gerais (${docsGerais.length})` },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key as any)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition"
                  style={{
                    background: tab === t.key ? '#fff' : 'transparent',
                    color: tab === t.key ? '#111827' : '#6b7280',
                    boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB: Vendas */}
            {tab === 'vendas' && (
              <>
                <div className="relative mb-4">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Pesquisar por cliente, operadora ou plano..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ ...inp }} />
                </div>

                {loadingVendas ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#0ea5e9' }} />
                  </div>
                ) : filteredVendas.length === 0 ? (
                  <div className="rounded-xl p-16 text-center" >
                    <Package size={40} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
                    <p className="text-sm font-medium" style={{ color: '#475569' }}>Nenhuma venda registada</p>
                    <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                      Registe vendas na aba Vendas para as ver aqui com os documentos associados
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredVendas.map(v => {
                      const st = STATUS_COLORS[v.status] || STATUS_COLORS.pendente
                      const isOpen = expanded === v.id
                      const docs = docsMap[v.id] || []
                      const isLoadingThisDoc = loadingDocs === v.id
                      const isUploadingThis = uploadingVendaId === v.id

                      return (
                        <div key={v.id} className="rounded-xl overflow-hidden"
                          >

                          {/* Linha da venda */}
                          <button onClick={() => toggleVenda(v.id)}
                            className="w-full flex items-center gap-4 px-5 py-4 text-left transition hover:bg-gray-50">
                            <div className="flex-shrink-0 text-gray-400">
                              {isOpen
                                ? <ChevronDown size={18} style={{ color: '#4f46e5' }} />
                                : <ChevronRight size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>{v.client_name}</p>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={st}>{STATUS_LABELS[v.status] || v.status}</span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  >
                                  {SVC_LABELS[v.service_type] || v.service_type}
                                </span>
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                                {v.operator}{v.plano ? ` · ${v.plano}` : ''} · {new Date(v.created_at).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="font-bold text-sm" style={{ color: '#1e293b' }}>€{(v.amount || 0).toFixed(2)}</p>
                              <p className="text-xs" style={{ color: '#9ca3af' }}>
                                {isLoadingThisDoc ? 'a carregar...' : `${docs.length} doc${docs.length !== 1 ? 's' : ''}`}
                              </p>
                            </div>
                          </button>

                          {/* Documentos expandidos */}
                          {isOpen && (
                            <div className="border-t px-5 py-4" style={{ borderColor: '#f3f4f6', background: '#fafbff' }}>
                              {isLoadingThisDoc ? (
                                <div className="flex items-center justify-center py-6">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#0ea5e9' }} />
                                </div>
                              ) : (
                                <>
                                  {/* Botao de upload para esta venda */}
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>
                                      Documentos desta venda
                                    </p>
                                    <label className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition hover:opacity-80"
                                      >
                                      <input type="file" className="hidden"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={e => handleUploadVenda(e, v.id)}
                                        disabled={isUploadingThis} />
                                      <Upload size={13} />
                                      {isUploadingThis ? 'A enviar...' : 'Anexar documento'}
                                    </label>
                                  </div>

                                  {docs.length === 0 ? (
                                    <div className="rounded-lg py-8 text-center" >
                                      <FileText size={28} className="mx-auto mb-2" style={{ color: '#d1d5db' }} />
                                      <p className="text-xs" style={{ color: '#9ca3af' }}>
                                        Nenhum documento anexado a esta venda
                                      </p>
                                    </div>
                                  ) : (
                                    <ul className="space-y-2">
                                      {docs.map(doc => (
                                        <li key={doc.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                                          >
                                          <div className="rounded p-1.5 flex-shrink-0" >
                                            <FileText size={14} style={{ color: '#4f46e5' }} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: '#1e293b' }}>{doc.file_name}</p>
                                            <p className="text-xs" style={{ color: '#9ca3af' }}>
                                              {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB · ` : ''}
                                              {new Date(doc.created_at).toLocaleDateString('pt-PT')}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {doc.signed_url && (
                                              <>
                                                {isImage(doc) && (
                                                  <button onClick={() => setViewer(doc)}
                                                    className="rounded-lg p-1.5 transition hover:bg-indigo-50">
                                                    <Eye size={14} style={{ color: '#4f46e5' }} />
                                                  </button>
                                                )}
                                                <a href={doc.signed_url} download={doc.file_name}
                                                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition hover:opacity-80"
                                                  >
                                                  <Download size={12} /> Download
                                                </a>
                                              </>
                                            )}
                                            <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                                              className="rounded-lg p-1.5 transition hover:bg-red-50 disabled:opacity-50">
                                              <Trash2 size={14} style={{ color: '#dc2626' }} />
                                            </button>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* TAB: Documentos Gerais */}
            {tab === 'gerais' && (
              <>
                <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
                  className="block w-full mb-6 rounded-2xl border-2 border-dashed cursor-pointer transition text-left"
                  style={{ borderColor: uploading ? '#e5e7eb' : '#c7d2fe', background: uploading ? '#fafafa' : '#fafbff' }}>
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="rounded-full p-3" >
                      <Upload size={22} style={{ color: uploading ? '#9ca3af' : '#4f46e5' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold" style={{ color: uploading ? '#9ca3af' : '#111827' }}>
                        {uploading ? 'A enviar...' : 'Clique para enviar documento geral'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>PDF, Word, imagens — max. 10MB</p>
                    </div>
                  </div>
                </button>

                {loadingGerais ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#0ea5e9' }} />
                  </div>
                ) : docsGerais.length === 0 ? (
                  <div className="rounded-xl p-14 text-center" >
                    <FileText size={36} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
                    <p className="text-sm font-medium" style={{ color: '#475569' }}>Nenhum documento geral ainda</p>
                    <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Use o botao acima para enviar PDF, Word ou imagens</p>
                  </div>
                ) : (
                  <div className="rounded-xl shadow-sm overflow-hidden" >
                    <ul className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                      {docsGerais.map(doc => (
                        <li key={doc.id} className="flex items-center gap-4 px-5 py-4">
                          <div className="rounded-lg p-2.5 flex-shrink-0" >
                            <FileText size={18} style={{ color: '#4f46e5' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: '#1e293b' }}>{doc.file_name}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                              {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB · ` : ''}
                              {new Date(doc.created_at).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {doc.signed_url && isImage(doc) && (
                              <button onClick={() => setViewer(doc)}
                                className="rounded-lg p-1.5 transition hover:bg-indigo-50">
                                <Eye size={15} style={{ color: '#4f46e5' }} />
                              </button>
                            )}
                            {doc.signed_url && (
                              <a href={doc.signed_url} download={doc.file_name}
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                                >
                                <Download size={13} /> Download
                              </a>
                            )}
                            <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                              className="rounded-lg p-1.5 transition hover:bg-red-50 disabled:opacity-50">
                              <Trash2 size={15} style={{ color: '#dc2626' }} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Viewer de imagens */}
      {viewer && viewer.signed_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setViewer(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewer(null)}
              className="absolute -top-3 -right-3 z-10 rounded-full p-1.5 shadow-lg"
              >
              <X size={16} />
            </button>
            <img src={viewer.signed_url} alt={viewer.file_name}
              className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            <p className="text-center text-xs mt-2" style={{ color: '#9ca3af' }}>{viewer.file_name}</p>
          </div>
        </div>
      )}

      {/* Viewer de PDFs */}
      {viewer && viewer.signed_url && viewer.file_type === 'pdf' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)' }}
          onClick={() => setViewer(null)}>
          <div className="w-full max-w-6xl mx-auto mx-auto bg-white rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-medium truncate">{viewer.file_name}</p>
              <div className="flex items-center gap-2">
                <a href={viewer.signed_url} download={viewer.file_name}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                  >
                  <Download size={13} /> Download
                </a>
                <button onClick={() => setViewer(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={16} />
                </button>
              </div>
            </div>
            <iframe src={viewer.signed_url} className="w-full" style={{ height: '75vh' }} />
          </div>
        </div>
      )}
    </div>
  )
}
