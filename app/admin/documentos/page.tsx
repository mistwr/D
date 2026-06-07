'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { FileText, Search, User, ChevronDown, ChevronUp, Phone, Mail, Building2, Zap, Wifi, Download, Eye, X, Trash2 } from 'lucide-react'

interface Doc {
  id: string
  venda_id: string
  file_name: string
  file_type: string
  file_size: number
  file_path: string
  uploaded_by: string
  created_at: string
  signed_url: string | null
  uploader_name: string
  uploader_email: string
  uploader_company: string
  client_name: string
  client_email: string
  client_phone: string
  client_nif: string
  venda_amount: number
  venda_status: string
  venda_service_type: string
  venda_operator: string
}

const ST: Record<string, { bg: string; color: string; label: string }> = {
  pendente:   { bg: '#fef3c7', color: '#92400e',  label: 'Pendente'    },
  em_revisao: { bg: '#dbeafe', color: '#1e40af',  label: 'Em Revisao'  },
  ativa:      { bg: '#d1fae5', color: '#065f46',  label: 'Ativa'       },
  processado: { bg: '#ede9fe', color: '#6d28d9',  label: 'Processado'  },
  pago:       { bg: '#d1fae5', color: '#065f46',  label: 'Pago'        },
  cancelado:  { bg: '#fee2e2', color: '#991b1b',  label: 'Cancelado'   },
  rejeitado:  { bg: '#fecaca', color: '#7f1d1d',  label: 'Rejeitado'   },
}

function formatSize(bytes: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getExt(name: string) {
  return (name || '').split('.').pop()?.toLowerCase() ?? ''
}

export default function AdminDocumentosPage() {
  const router = useRouter()
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedParceiro, setExpandedParceiro] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('todos')
  const [viewer, setViewer] = useState<Doc | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function deleteDoc(id: string) {
    setDeleting(id)
    const res = await authFetch('/api/documentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setDocs(prev => prev.filter(d => d.id !== id))
    setDeleting(null)
    setConfirmDelete(null)
  }

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const res = await authFetch('/api/documentos')
        const data = await res.json()
        setDocs(data.documentos || [])
      } catch { /* silencioso */ }
      setLoading(false)
    }
    load()
  }, [user, authFetch])

  const filtered = docs.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (d.file_name || '').toLowerCase().includes(q) ||
      (d.uploader_name || '').toLowerCase().includes(q) ||
      (d.client_name || '').toLowerCase().includes(q) ||
      (d.client_nif || '').toLowerCase().includes(q) ||
      (d.venda_operator || '').toLowerCase().includes(q)
    const matchType = filterType === 'todos' ||
      (filterType === 'pdf' && getExt(d.file_name) === 'pdf') ||
      (filterType === 'img' && ['jpg','jpeg','png','gif','webp'].includes(getExt(d.file_name))) ||
      (filterType === 'doc' && ['doc','docx'].includes(getExt(d.file_name))) ||
      (filterType === 'xls' && ['xls','xlsx'].includes(getExt(d.file_name)))
    return matchSearch && matchType
  })

  // Agrupar por parceiro
  const parceirosMap = new Map<string, { name: string; email: string; company: string; docs: Doc[] }>()
  filtered.forEach(d => {
    const key = d.uploaded_by
    if (!parceirosMap.has(key)) {
      parceirosMap.set(key, { name: d.uploader_name || 'Desconhecido', email: d.uploader_email, company: d.uploader_company, docs: [] })
    }
    parceirosMap.get(key)!.docs.push(d)
  })

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" >
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 md:relative md:z-10 md:ml-64 pt-16">
          <div className="p-4 md:p-5 max-w-5xl mx-auto w-full mx-auto w-full">
            <div className="mb-6">
              <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Documentos dos Parceiros</h1>
              <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
                Todos os ficheiros carregados — visualize e descarregue directamente
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'Total Docs',  value: docs.length,                                                    bg: '#e0e7ff', color: '#0ea5e9' },
                { label: 'Parceiros',   value: new Set(docs.map(d => d.uploaded_by)).size,                     bg: '#fce7f3', color: '#9d174d' },
                { label: 'PDF',         value: docs.filter(d => getExt(d.file_name) === 'pdf').length,         bg: '#fee2e2', color: '#991b1b' },
                { label: 'Imagens',     value: docs.filter(d => ['jpg','jpeg','png','webp'].includes(getExt(d.file_name))).length, bg: '#d1fae5', color: '#065f46' },
                { label: 'Word/Excel',  value: docs.filter(d => ['doc','docx','xls','xlsx'].includes(getExt(d.file_name))).length, bg: '#fef3c7', color: '#92400e' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 shadow-sm" >
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="mb-5 rounded-xl p-4 flex flex-col md:flex-row gap-3" >
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-2.5" style={{ color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar por ficheiro, parceiro, cliente, NIF ou operadora..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #d1d5db', color: '#1e293b' }} />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid #d1d5db', color: '#1e293b', background: '#fff' }}>
                <option value="todos">Todos os tipos</option>
                <option value="pdf">PDF</option>
                <option value="img">Imagens</option>
                <option value="doc">Word</option>
                <option value="xls">Excel</option>
              </select>
            </div>

            {/* Lista agrupada por parceiro */}
            {parceirosMap.size === 0 ? (
              <div className="rounded-xl p-12 text-center" >
                <FileText size={48} className="mx-auto mb-4" style={{ color: '#d1d5db' }} />
                <p className="text-base font-medium" style={{ color: '#475569' }}>
                  {docs.length === 0 ? 'Nenhum documento carregado ainda' : 'Nenhum resultado'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(parceirosMap.entries()).map(([parceiroId, parceiro]) => {
                  const isOpen = expandedParceiro === parceiroId
                  return (
                    <div key={parceiroId} className="rounded-xl shadow-sm overflow-hidden" >
                      {/* Header parceiro */}
                      <button
                        onClick={() => setExpandedParceiro(isOpen ? null : parceiroId)}
                        className="flex items-center justify-between w-full p-5 text-left"
                        style={{ borderBottom: isOpen ? '1px solid #e5e7eb' : 'none' }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full" >
                            <User size={20} style={{ color: '#4f46e5' }} />
                          </div>
                          <div>
                            <p className="font-bold" style={{ color: '#1e293b' }}>{parceiro.name}</p>
                            <div className="flex flex-wrap gap-3 mt-0.5">
                              {parceiro.company && (
                                <span className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                                  <Building2 size={11} /> {parceiro.company}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                                <Mail size={11} /> {parceiro.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold" style={{ color: '#4f46e5' }}>{parceiro.docs.length} ficheiro(s)</p>
                            <p className="text-xs" style={{ color: '#9ca3af' }}>{new Set(parceiro.docs.map(d => d.venda_id)).size} venda(s)</p>
                          </div>
                          {isOpen ? <ChevronUp size={18} style={{ color: '#9ca3af' }} /> : <ChevronDown size={18} style={{ color: '#9ca3af' }} />}
                        </div>
                      </button>

                      {/* Documentos do parceiro */}
                      {isOpen && (
                        <div className="p-4">
                          <div className="space-y-3">
                            {parceiro.docs.map(d => {
                              const ext = getExt(d.file_name)
                              const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext)
                              const isPdf = ext === 'pdf'
                              const canPreview = isImage || isPdf
                              const st = ST[d.venda_status] || { bg: '#f3f4f6', color: '#64748b', label: d.venda_status }

                              return (
                                <div key={d.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                                  {/* Linha do documento */}
                                  <div className="flex flex-wrap items-center gap-3 px-4 py-3" >
                                    {/* Badge tipo */}
                                    <span className="flex h-7 w-10 items-center justify-center rounded text-[10px] font-bold uppercase flex-shrink-0"
                                      >
                                      {ext || 'DOC'}
                                    </span>

                                    {/* Nome + meta */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold truncate" style={{ color: '#1e293b' }}>{d.file_name}</p>
                                      <div className="flex flex-wrap gap-3 mt-0.5">
                                        <span className="text-xs" style={{ color: '#9ca3af' }}>{formatSize(d.file_size)}</span>
                                        <span className="text-xs" style={{ color: '#9ca3af' }}>{new Date(d.created_at).toLocaleDateString('pt-PT')}</span>
                                        {d.client_name && (
                                          <span className="text-xs font-medium" style={{ color: '#475569' }}>Cliente: {d.client_name}{d.client_nif ? ` (NIF: ${d.client_nif})` : ''}</span>
                                        )}
                                        {d.venda_service_type && (
                                          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium"
                                            style={{ background: d.venda_service_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: d.venda_service_type === 'energia' ? '#92400e' : '#4338ca' }}>
                                            {d.venda_service_type === 'energia' ? <Zap size={10} /> : <Wifi size={10} />}
                                            {d.venda_operator || d.venda_service_type}
                                          </span>
                                        )}
                                        {d.venda_status && (
                                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>
                                            {st.label}
                                          </span>
                                        )}
                                        {d.venda_amount > 0 && (
                                          <span className="text-xs font-semibold" style={{ color: '#059669' }}>€{d.venda_amount.toFixed(2)}</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Acções */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {d.signed_url && canPreview && (
                                        <button
                                          onClick={() => setViewer(d)}
                                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition"
                                          
                                        >
                                          <Eye size={13} /> Ver
                                        </button>
                                      )}
                                      {d.signed_url && (
                                        <a
                                          href={d.signed_url}
                                          download={d.file_name}
                                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition"
                                          
                                        >
                                          <Download size={13} /> Download
                                        </a>
                                      )}
                                      {!d.signed_url && (
                                        <span className="text-xs px-3 py-1.5 rounded-lg" >
                                          URL expirada
                                        </span>
                                      )}
                                      {confirmDelete === d.id ? (
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => deleteDoc(d.id)} disabled={deleting === d.id}
                                            className="rounded-lg px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                            >
                                            {deleting === d.id ? '...' : 'Confirmar'}
                                          </button>
                                          <button onClick={() => setConfirmDelete(null)}
                                            className="rounded-lg px-2 py-1 text-xs"
                                            >
                                            Cancelar
                                          </button>
                                        </div>
                                      ) : (
                                        <button onClick={() => setConfirmDelete(d.id)}
                                          className="rounded-lg p-1.5 transition hover:opacity-80"
                                          
                                          title="Apagar documento">
                                          <Trash2 size={14} style={{ color: '#dc2626' }} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Preview inline para imagens */}
                                  {d.signed_url && isImage && (
                                    <div className="p-3" >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={d.signed_url} alt={d.file_name}
                                        className="w-full rounded-lg object-contain max-h-64"
                                         />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
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

      {/* Modal viewer PDF */}
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
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>{viewer.file_name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  {viewer.uploader_name} · {formatSize(viewer.file_size)} · {new Date(viewer.created_at).toLocaleDateString('pt-PT')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {viewer.signed_url && (
                  <a href={viewer.signed_url} download={viewer.file_name}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                    >
                    <Download size={13} /> Download
                  </a>
                )}
                <button onClick={() => setViewer(null)} className="rounded-lg p-2 transition hover:bg-gray-100">
                  <X size={18} style={{ color: '#64748b' }} />
                </button>
              </div>
            </div>
            {/* Conteudo */}
            <div style={{ height: '75vh', overflow: 'auto', background: '#f8fafc' }}>
              {getExt(viewer.file_name) === 'pdf' ? (
                <iframe src={viewer.signed_url!} title={viewer.file_name} className="w-full h-full" style={{ border: 'none', minHeight: '70vh' }} />
              ) : (
                <div className="flex items-center justify-center h-full p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewer.signed_url!} alt={viewer.file_name}
                    className="max-w-full max-h-full rounded-lg object-contain shadow-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
