'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Plus, Search, Upload, X, FileText, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import Link from 'next/link'

interface Venda {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  client_nif: string
  client_cc: string
  client_iban: string
  client_address: string
  amount: number
  status: string
  contract_type: string
  service_type: string
  operator: string
  plano: string
  description: string
  notes: string
  energia_tipo: string
  cpe: string
  cui: string
  potencia: string
  escalao: string
  gas_escalao: string
  cpes: string[]
  cuis: string[]
  is_dual: boolean
  created_at: string
  admin_feedback: string
}

interface Documento {
  id: string
  file_name: string
  file_type: string
  file_size: number
  signed_url: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pendente:   { bg: '#fef3c7', color: '#92400e', label: 'Pendente' },
  em_revisao: { bg: '#dbeafe', color: '#1e40af', label: 'Em Revisão' },
  ativa:      { bg: '#d1fae5', color: '#065f46', label: 'Ativa' },
  em_ativacao: { bg: '#fecaca', color: '#7f1d1d', label: 'Em Ativação' },
  em_ativacao_depois_revisao: { bg: '#e9d5ff', color: '#6d28d9', label: 'Em Ativação Depois Revisão' },
  processado: { bg: '#ede9fe', color: '#6d28d9', label: 'Processado' },
  pago:       { bg: '#d1fae5', color: '#065f46', label: 'Pago' },
  cancelado:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelado' },
}

const SERVICE_LABELS: Record<string, string> = {
  energia: 'Energia', gas: 'Gás', seguros: 'Seguros', telecom: 'Telecom'
}

export default function VendasPage() {
  const { user, loading: authLoading, authFetch } = useAuth('parceiro')
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')

  // Modal documentos
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null)
  const [docs, setDocs] = useState<Documento[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    authFetch('/api/vendas')
      .then(r => r.json())
      .then(d => setVendas(d.vendas || []))
      .finally(() => setLoading(false))
  }, [user, authFetch])

  async function openDocs(venda: Venda) {
    setSelectedVenda(venda)
    setDocsLoading(true)
    setUploadError('')
    const r = await authFetch(`/api/documentos?venda_id=${venda.id}`)
    const d = await r.json()
    setDocs(d.documentos || [])
    setDocsLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedVenda || !e.target.files?.[0]) return
    const file = e.target.files[0]
    setUploading(true)
    setUploadError('')
    const fd = new FormData()
    fd.append('venda_id', selectedVenda.id)
    fd.append('file', file)
    const r = await authFetch('/api/documentos', { method: 'POST', body: fd })
    const d = await r.json()
    setUploading(false)
    if (!r.ok) { setUploadError(d.error || 'Erro ao fazer upload'); return }
    e.target.value = ''
    const r2 = await authFetch(`/api/documentos?venda_id=${selectedVenda.id}`)
    const d2 = await r2.json()
    setDocs(d2.documentos || [])
  }

  async function deleteDoc(docId: string) {
    await authFetch('/api/documentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: docId }),
    })
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  const filtered = vendas.filter(v => {
    const q = search.toLowerCase()
    const match = !q ||
      (v.client_name || '').toLowerCase().includes(q) ||
      (v.client_email || '').toLowerCase().includes(q) ||
      (v.client_nif || '').toLowerCase().includes(q) ||
      (v.operator || '').toLowerCase().includes(q)
    return match && (filter === 'todos' || v.status === filter)
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
        <Sidebar userRole="parceiro" />
        <main className="flex-1 overflow-auto pt-20 md:pt-16 md:ml-64 w-full" style={{ minHeight: "calc(100vh - 4rem)" }}>
          <div className="p-3 sm:p-4 md:p-5 max-w-5xl mx-auto w-full">

            {/* Cabeçalho - responsivo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#1e293b' }}>As Minhas Vendas</h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>{vendas.length} venda{vendas.length !== 1 ? 's' : ''} registada{vendas.length !== 1 ? 's' : ''}</p>
              </div>
              <Link href="/vendas/novo" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  <Plus size={16} /> Nova Venda
                </button>
              </Link>
            </div>

            {/* Filtros - responsivo */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Procurar por nome, NIF ou operadora..."
                  className="w-full pl-9 pr-4 py-3 sm:py-2.5 rounded-lg text-sm outline-none"
                   />
              </div>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-lg text-sm outline-none"
                >
                <option value="todos">Todos os estados</option>
                {Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            {/* Cards para Mobile / Tabela para Desktop */}
            <div className="rounded-xl shadow-sm overflow-hidden" >
              {filtered.length === 0 ? (
                <div className="p-8 sm:p-16 text-center">
                  <p className="text-base font-medium mb-1" style={{ color: '#475569' }}>Nenhuma venda encontrada</p>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>Crie uma nova venda para começar</p>
                </div>
              ) : (
                <>
                  {/* Mobile: Cards */}
                  <div className="md:hidden divide-y" style={{ borderColor: '#f1f5f9' }}>
                    {filtered.map(v => {
                      const st = STATUS_COLORS[v.status] || STATUS_COLORS.pendente
                      const svcLabel = SERVICE_LABELS[v.service_type] || v.service_type
                      return (
                        <div key={v.id} className="p-4 active:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate" style={{ color: '#1e293b' }}>{v.client_name}</p>
                              {v.client_nif && <p className="text-xs font-mono" style={{ color: '#64748b' }}>NIF: {v.client_nif}</p>}
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0" style={{ background: st.bg, color: st.color }}>
                              {st.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span style={{ color: '#64748b' }}>{svcLabel} - {v.operator || '-'}</span>
                            <span className="font-bold" style={{ color: '#0ea5e9' }}>{'\u20AC'}{(v.amount || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: '#9ca3af' }}>{new Date(v.created_at).toLocaleDateString('pt-PT')}</span>
                            <button onClick={() => openDocs(v)}
                              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium"
                              >
                              <FileText size={14} /> Docs
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Desktop: Tabela */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr >
                          {['Cliente', 'Serviço', 'Operadora / Plano', 'Valor', 'Estado', 'Data', 'Docs'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(v => {
                          const st = STATUS_COLORS[v.status] || STATUS_COLORS.pendente
                          const svcLabel = SERVICE_LABELS[v.service_type] || v.service_type
                          const svcBg = v.service_type === 'telecom' ? '#e0e7ff' : v.service_type === 'energia' ? '#fef3c7' : v.service_type === 'gas' ? '#dbeafe' : '#f3f4f6'
                          const svcColor = v.service_type === 'telecom' ? '#4338ca' : v.service_type === 'energia' ? '#92400e' : v.service_type === 'gas' ? '#1e40af' : '#374151'
                          return (
                            <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td className="px-5 py-4">
                                <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>{v.client_name}</p>
                                {v.client_nif && <p className="text-xs mt-0.5 font-mono" style={{ color: '#64748b' }}>NIF: {v.client_nif}</p>}
                                {v.client_email && <p className="text-xs" style={{ color: '#9ca3af' }}>{v.client_email}</p>}
                                {v.client_phone && <p className="text-xs" style={{ color: '#9ca3af' }}>{v.client_phone}</p>}
                              </td>
                              <td className="px-5 py-4">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: svcBg, color: svcColor }}>
                                  {svcLabel}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm" style={{ color: '#475569' }}>
                                <span className="font-medium">{v.operator || '-'}</span>
                                {v.plano && <span className="ml-1 text-xs px-1.5 py-0.5 rounded" >{v.plano}</span>}
                              </td>
                              <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#1e293b' }}>
                                {'\u20AC'}{(v.amount || 0).toFixed(2)}
                              </td>
                              <td className="px-5 py-4">
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: st.bg, color: st.color }}>
                                  {st.label}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm" style={{ color: '#64748b' }}>
                                {new Date(v.created_at).toLocaleDateString('pt-PT')}
                              </td>
                              <td className="px-5 py-4">
                                <button onClick={() => openDocs(v)}
                                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                                >
                                <FileText size={13} /> Ver
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Documentos da Venda */}
      {selectedVenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: '#1e293b' }}>Documentos da Venda</h2>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{selectedVenda.client_name}</p>
              </div>
              <button onClick={() => setSelectedVenda(null)} className="rounded-full p-1.5 transition hover:bg-gray-100">
                <X size={18} style={{ color: '#64748b' }} />
              </button>
            </div>

            <div className="p-6">
              {/* Detalhes da venda */}
              <div className="mb-5 rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                {/* Linha serviço + valor */}
                <div className="flex items-center justify-between px-4 py-3" >
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const svcBg = selectedVenda.service_type === 'telecom' ? '#e0e7ff' : selectedVenda.service_type === 'energia' ? '#fef3c7' : '#dbeafe'
                      const svcColor = selectedVenda.service_type === 'telecom' ? '#4338ca' : selectedVenda.service_type === 'energia' ? '#92400e' : '#1e40af'
                      const svcLabel = SERVICE_LABELS[selectedVenda.service_type] || selectedVenda.service_type
                      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: svcBg, color: svcColor }}>{svcLabel}</span>
                    })()}
                    {selectedVenda.operator && <span className="text-sm font-semibold" style={{ color: '#1e293b' }}>{selectedVenda.operator}</span>}
                    {selectedVenda.plano && <span className="text-xs px-2 py-0.5 rounded" >{selectedVenda.plano}</span>}
                    {selectedVenda.is_dual && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" >Dual</span>
                    )}
                  </div>
                  <span className="text-base font-bold ml-4" style={{ color: '#059669' }}>€{(selectedVenda.amount || 0).toFixed(2)}</span>
                </div>

                {/* Grid de campos do cliente */}
                <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs" >
                  {selectedVenda.client_nif && (
                    <div>
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>NIF</p>
                      <p className="font-mono font-medium" style={{ color: '#1e293b' }}>{selectedVenda.client_nif}</p>
                    </div>
                  )}
                  {selectedVenda.client_cc && (
                    <div>
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>Cartão de Cidadão</p>
                      <p className="font-mono font-medium" style={{ color: '#1e293b' }}>{selectedVenda.client_cc}</p>
                    </div>
                  )}
                  {selectedVenda.client_iban && (
                    <div className="col-span-2">
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>IBAN</p>
                      <p className="font-mono font-medium" style={{ color: '#1e293b' }}>{selectedVenda.client_iban}</p>
                    </div>
                  )}
                  {selectedVenda.client_address && (
                    <div className="col-span-2">
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>Morada</p>
                      <p className="font-medium" style={{ color: '#1e293b' }}>{selectedVenda.client_address}</p>
                    </div>
                  )}
                  {selectedVenda.cpe && (
                    <div>
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>CPE</p>
                      <p className="font-mono font-medium" style={{ color: '#1e293b' }}>{selectedVenda.cpe}</p>
                    </div>
                  )}
                  {selectedVenda.cui && (
                    <div>
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>CUI</p>
                      <p className="font-mono font-medium" style={{ color: '#1e293b' }}>{selectedVenda.cui}</p>
                    </div>
                  )}
                  {selectedVenda.potencia && (
                    <div>
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>Potencia</p>
                      <p className="font-medium" style={{ color: '#1e293b' }}>{selectedVenda.potencia} kVA</p>
                    </div>
                  )}
                  {selectedVenda.escalao && (
                    <div>
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>Escalao</p>
                      <p className="font-medium capitalize" style={{ color: '#1e293b' }}>{selectedVenda.escalao.replace(/-/g, ' ')}</p>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                {selectedVenda.description && (
                  <div className="px-4 py-3" style={{ borderTop: '1px solid #f3f4f6', background: '#fff' }}>
                    <p className="uppercase tracking-wide font-semibold mb-1" style={{ color: '#9ca3af', fontSize: 10 }}>Descrição</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{selectedVenda.description}</p>
                  </div>
                )}

                {/* Notas internas */}
                {selectedVenda.notes && (
                  <div className="px-4 py-3" style={{ borderTop: '1px solid #f3f4f6', background: '#fffbeb' }}>
                    <p className="uppercase tracking-wide font-semibold mb-1" style={{ color: '#92400e', fontSize: 10 }}>Notas internas</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>{selectedVenda.notes}</p>
                  </div>
                )}

                {/* Feedback do Administrador */}
                {selectedVenda.admin_feedback && (
                  <div className="px-4 py-3" style={{ borderTop: '1px solid #fecaca', background: '#fef2f2' }}>
                    <p className="uppercase tracking-wide font-semibold mb-1" style={{ color: '#dc2626', fontSize: 10 }}>Feedback do Administrador</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#991b1b' }}>{selectedVenda.admin_feedback}</p>
                  </div>
                )}
              </div>

              {/* Upload */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed py-6 mb-2 transition"
                style={{ borderColor: uploading ? '#e5e7eb' : '#c7d2fe', background: uploading ? '#f9fafb' : '#eef2ff' }}
              >
                <Upload size={18} style={{ color: uploading ? '#9ca3af' : '#4f46e5' }} />
                <span className="text-sm font-semibold" style={{ color: uploading ? '#9ca3af' : '#4f46e5' }}>
                  {uploading ? 'A enviar...' : 'Clique para anexar documento'}
                </span>
              </button>
              {uploadError && (
                <p className="text-xs mb-2 px-3 py-2 rounded-lg" >{uploadError}</p>
              )}
              <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>PDF, Word, Excel, imagens — max. 10MB</p>

              {/* Lista */}
              {docsLoading ? (
                <div className="text-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#0ea5e9' }} /></div>
              ) : docs.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#9ca3af' }}>Nenhum documento anexado</p>
              ) : (
                <ul className="space-y-3">
                  {docs.map(doc => {
                    const ext = (doc.file_name || '').split('.').pop()?.toLowerCase() ?? ''
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
                    const isPdf = ext === 'pdf'
                    return (
                      <li key={doc.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                        {/* Cabeçalho do doc */}
                        <div className="flex items-center justify-between px-4 py-3" >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText size={16} style={{ color: '#64748b', flexShrink: 0 }} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: '#1e293b' }}>{doc.file_name}</p>
                              <p className="text-xs" style={{ color: '#9ca3af' }}>
                                {doc.file_size ? (doc.file_size / 1024).toFixed(0) + ' KB · ' : ''}
                                {new Date(doc.created_at).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            {doc.signed_url && (
                              <a href={doc.signed_url} download={doc.file_name}
                                className="text-xs font-medium px-2.5 py-1 rounded-md transition"
                                >
                                Download
                              </a>
                            )}
                            <button onClick={() => deleteDoc(doc.id)} className="rounded p-1 transition hover:bg-red-50">
                              <Trash2 size={14} style={{ color: '#dc2626' }} />
                            </button>
                          </div>
                        </div>
                        {/* Viewer inline */}
                        {doc.signed_url && isImage && (
                          <div className="p-3" >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={doc.signed_url} alt={doc.file_name}
                              className="w-full rounded-lg object-contain max-h-72"
                               />
                          </div>
                        )}
                        {doc.signed_url && isPdf && (
                          <div >
                            <iframe src={doc.signed_url} title={doc.file_name}
                              className="w-full" style={{ height: 320, border: 'none' }} />
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
