'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Plus, Search, Upload, X, FileText, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Venda {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  client_nif: string
  client_cc: string
  client_iban: string
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
  is_dual: boolean
  created_at: string
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
  processado: { bg: '#ede9fe', color: '#6d28d9', label: 'Processado' },
  pago:       { bg: '#d1fae5', color: '#065f46', label: 'Pago' },
  cancelado:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelado' },
}

const SERVICE_LABELS: Record<string, string> = {
  energia: 'Energia', gas: 'Gás', seguros: 'Seguros', telecom: 'Telecom'
}

export default function VendasPage() {
  const { user, loading: authLoading } = useAuth('parceiro')
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

  useEffect(() => {
    if (!user) return
    fetch('/api/vendas', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setVendas(d.vendas || []))
      .finally(() => setLoading(false))
  }, [user])

  async function openDocs(venda: Venda) {
    setSelectedVenda(venda)
    setDocsLoading(true)
    setUploadError('')
    const r = await fetch(`/api/documentos?venda_id=${venda.id}`, { credentials: 'include' })
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
    const r = await fetch('/api/documentos', { method: 'POST', credentials: 'include', body: fd })
    const d = await r.json()
    setUploading(false)
    if (!r.ok) { setUploadError(d.error || 'Erro ao fazer upload'); return }
    setDocs(prev => [d.documento, ...prev])
    e.target.value = ''
  }

  async function deleteDoc(docId: string) {
    await fetch('/api/documentos', {
      method: 'DELETE',
      credentials: 'include',
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
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="flex-1 md:ml-64 pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8">

            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>As Minhas Vendas</h1>
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{vendas.length} venda{vendas.length !== 1 ? 's' : ''} registada{vendas.length !== 1 ? 's' : ''}</p>
              </div>
              <Link href="/vendas/novo">
                <button className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ background: '#4f46e5' }}>
                  <Plus size={16} /> Nova Venda
                </button>
              </Link>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Procurar por nome, NIF ou operadora..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#111827' }} />
              </div>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#111827', minWidth: 180 }}>
                <option value="todos">Todos os estados</option>
                {Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            {/* Tabela */}
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              {filtered.length === 0 ? (
                <div className="p-16 text-center">
                  <p className="text-base font-medium mb-1" style={{ color: '#374151' }}>Nenhuma venda encontrada</p>
                  <p className="text-sm" style={{ color: '#9ca3af' }}>Crie uma nova venda para começar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Cliente', 'Serviço', 'Operadora / Plano', 'Valor', 'Estado', 'Data', 'Docs'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280' }}>{h}</th>
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
                              <p className="font-semibold text-sm" style={{ color: '#111827' }}>{v.client_name}</p>
                              {v.client_nif && <p className="text-xs mt-0.5 font-mono" style={{ color: '#6b7280' }}>NIF: {v.client_nif}</p>}
                              {v.client_email && <p className="text-xs" style={{ color: '#9ca3af' }}>{v.client_email}</p>}
                              {v.client_phone && <p className="text-xs" style={{ color: '#9ca3af' }}>{v.client_phone}</p>}
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: svcBg, color: svcColor }}>
                                {svcLabel}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm" style={{ color: '#374151' }}>
                              <span className="font-medium">{v.operator || '-'}</span>
                              {v.plano && <span className="ml-1 text-xs px-1.5 py-0.5 rounded" style={{ background: '#f3f4f6', color: '#6b7280' }}>{v.plano}</span>}
                            </td>
                            <td className="px-5 py-4 font-semibold text-sm" style={{ color: '#111827' }}>
                              {'\u20AC'}{(v.amount || 0).toFixed(2)}
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: st.bg, color: st.color }}>
                                {st.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm" style={{ color: '#6b7280' }}>
                              {new Date(v.created_at).toLocaleDateString('pt-PT')}
                            </td>
                            <td className="px-5 py-4">
                              <button onClick={() => openDocs(v)}
                                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                                style={{ background: '#eef2ff', color: '#4f46e5' }}>
                                <FileText size={13} /> Ver
                              </button>
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
        </main>
      </div>

      {/* Modal Documentos da Venda */}
      {selectedVenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: '#111827' }}>Documentos da Venda</h2>
                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{selectedVenda.client_name}</p>
              </div>
              <button onClick={() => setSelectedVenda(null)} className="rounded-full p-1.5 transition hover:bg-gray-100">
                <X size={18} style={{ color: '#6b7280' }} />
              </button>
            </div>

            <div className="p-6">
              {/* Detalhes da venda */}
              <div className="mb-5 rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
                {/* Linha serviço + valor */}
                <div className="flex items-center justify-between px-4 py-3" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const svcBg = selectedVenda.service_type === 'telecom' ? '#e0e7ff' : selectedVenda.service_type === 'energia' ? '#fef3c7' : '#dbeafe'
                      const svcColor = selectedVenda.service_type === 'telecom' ? '#4338ca' : selectedVenda.service_type === 'energia' ? '#92400e' : '#1e40af'
                      const svcLabel = SERVICE_LABELS[selectedVenda.service_type] || selectedVenda.service_type
                      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: svcBg, color: svcColor }}>{svcLabel}</span>
                    })()}
                    {selectedVenda.operator && <span className="text-sm font-semibold" style={{ color: '#111827' }}>{selectedVenda.operator}</span>}
                    {selectedVenda.plano && <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#f3f4f6', color: '#6b7280' }}>{selectedVenda.plano}</span>}
                    {selectedVenda.is_dual && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#fef3c7', color: '#92400e' }}>Dual</span>
                    )}
                  </div>
                  <span className="text-base font-bold ml-4" style={{ color: '#059669' }}>€{(selectedVenda.amount || 0).toFixed(2)}</span>
                </div>

                {/* Grid de campos do cliente */}
                <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs" style={{ background: '#fff' }}>
                  {selectedVenda.client_nif && (
                    <div>
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>NIF</p>
                      <p className="font-mono font-medium" style={{ color: '#111827' }}>{selectedVenda.client_nif}</p>
                    </div>
                  )}
                  {selectedVenda.client_cc && (
                    <div>
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>Cartão de Cidadão</p>
                      <p className="font-mono font-medium" style={{ color: '#111827' }}>{selectedVenda.client_cc}</p>
                    </div>
                  )}
                  {selectedVenda.client_iban && (
                    <div className="col-span-2">
                      <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>IBAN</p>
                      <p className="font-mono font-medium" style={{ color: '#111827' }}>{selectedVenda.client_iban}</p>
                    </div>
                  )}
                  {selectedVenda.is_dual && (selectedVenda.cpe || selectedVenda.cui) && (
                    <>
                      {selectedVenda.cpe && (
                        <div>
                          <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>CPE</p>
                          <p className="font-mono font-medium" style={{ color: '#111827' }}>{selectedVenda.cpe}</p>
                        </div>
                      )}
                      {selectedVenda.cui && (
                        <div>
                          <p className="uppercase tracking-wide font-semibold mb-0.5" style={{ color: '#9ca3af', fontSize: 10 }}>CUI</p>
                          <p className="font-mono font-medium" style={{ color: '#111827' }}>{selectedVenda.cui}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Descrição */}
                {selectedVenda.description && (
                  <div className="px-4 py-3" style={{ borderTop: '1px solid #f3f4f6', background: '#fff' }}>
                    <p className="uppercase tracking-wide font-semibold mb-1" style={{ color: '#9ca3af', fontSize: 10 }}>Descrição</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{selectedVenda.description}</p>
                  </div>
                )}

                {/* Notas internas */}
                {selectedVenda.notes && (
                  <div className="px-4 py-3" style={{ borderTop: '1px solid #f3f4f6', background: '#fffbeb' }}>
                    <p className="uppercase tracking-wide font-semibold mb-1" style={{ color: '#92400e', fontSize: 10 }}>Notas internas</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>{selectedVenda.notes}</p>
                  </div>
                )}
              </div>

              {/* Upload */}
              <label className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed cursor-pointer py-6 mb-4 transition hover:border-indigo-400"
                style={{ borderColor: '#d1d5db' }}>
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                <Upload size={18} style={{ color: uploading ? '#9ca3af' : '#4f46e5' }} />
                <span className="text-sm font-medium" style={{ color: uploading ? '#9ca3af' : '#4f46e5' }}>
                  {uploading ? 'A enviar...' : 'Clique para anexar documento'}
                </span>
              </label>
              {uploadError && (
                <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: '#fee2e2', color: '#991b1b' }}>{uploadError}</p>
              )}
              <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>PDF, Word, Excel, imagens — máx. 10MB</p>

              {/* Lista */}
              {docsLoading ? (
                <div className="text-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#4f46e5' }} /></div>
              ) : docs.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#9ca3af' }}>Nenhum documento anexado</p>
              ) : (
                <ul className="space-y-2">
                  {docs.map(doc => (
                    <li key={doc.id} className="flex items-center justify-between rounded-lg px-4 py-3"
                      style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{doc.file_name}</p>
                          <p className="text-xs" style={{ color: '#9ca3af' }}>
                            {doc.file_size ? (doc.file_size / 1024).toFixed(0) + ' KB · ' : ''}
                            {new Date(doc.created_at).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        {doc.signed_url && (
                          <a href={doc.signed_url} target="_blank" rel="noreferrer"
                            className="text-xs font-medium px-2 py-1 rounded" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                            Abrir
                          </a>
                        )}
                        <button onClick={() => deleteDoc(doc.id)} className="rounded p-1 transition hover:bg-red-50">
                          <Trash2 size={14} style={{ color: '#dc2626' }} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
