'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  FileText, Search, Download, Eye, X, ChevronDown, ChevronUp,
  User, CheckCircle, Clock, Zap, Wifi, Building2, Mail, Phone
} from 'lucide-react'

interface Contrato {
  id: string
  user_id: string
  client_name: string
  client_email: string
  client_phone: string
  client_nif: string
  client_cc: string
  operadora: string
  servico_type: string
  status: string
  assinado_cliente: boolean
  assinado_vendedor: boolean
  created_at: string
  // join manual
  parceiro_name?: string
  parceiro_email?: string
  parceiro_company?: string
  documentos?: Doc[]
}

interface Doc {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_path: string
  created_at: string
  signed_url: string | null
}

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  rascunho:          { bg: '#f3f4f6', color: '#6b7280', label: 'Rascunho' },
  pendente_cliente:  { bg: '#fef3c7', color: '#92400e', label: 'Pend. Cliente' },
  pendente_vendedor: { bg: '#dbeafe', color: '#1e40af', label: 'Pend. Vendedor' },
  finalizado:        { bg: '#d1fae5', color: '#065f46', label: 'Finalizado' },
  rejeitado:         { bg: '#fee2e2', color: '#991b1b', label: 'Rejeitado' },
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
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [docsMap, setDocsMap] = useState<Record<string, Doc[]>>({})
  const [docsLoading, setDocsLoading] = useState<string | null>(null)
  const [viewer, setViewer] = useState<Doc | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json())
        if (!me?.user || me.user.role !== 'admin') { router.push('/login'); return }
        setUser(me.user)

        // Buscar contratos
        const [contratosRes, profilesRes] = await Promise.all([
          fetch('/api/contratos', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/admin/parceiros', { credentials: 'include' }).then(r => r.json()).catch(() => ({ parceiros: [] })),
        ])

        const profilesMap = new Map((profilesRes.parceiros ?? []).map((p: any) => [p.id, p]))
        const enriched = (contratosRes.contratos ?? []).map((c: Contrato) => {
          const p: any = profilesMap.get(c.user_id)
          return {
            ...c,
            parceiro_name: p?.full_name ?? p?.name ?? 'Desconhecido',
            parceiro_email: p?.email ?? '',
            parceiro_company: p?.company ?? '',
          }
        })
        setContratos(enriched)
      } catch { router.push('/login') }
      setLoading(false)
    }
    load()
  }, [router])

  async function loadDocs(contratoId: string, userId: string) {
    if (docsMap[contratoId]) return
    setDocsLoading(contratoId)
    try {
      // Buscar documentos sem venda_id do parceiro (tipo=contrato) — admin consegue ver via service role
      const res = await fetch(`/api/documentos?tipo=contrato&user_override=${userId}`, { credentials: 'include' })
      const data = await res.json()
      setDocsMap(prev => ({ ...prev, [contratoId]: data.documentos ?? [] }))
    } catch {
      setDocsMap(prev => ({ ...prev, [contratoId]: [] }))
    }
    setDocsLoading(null)
  }

  async function toggleContrato(c: Contrato) {
    if (expanded === c.id) { setExpanded(null); return }
    setExpanded(c.id)
    await loadDocs(c.id, c.user_id)
  }

  const filtered = contratos.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (c.client_name || '').toLowerCase().includes(q) ||
      (c.client_nif || '').toLowerCase().includes(q) ||
      (c.parceiro_name || '').toLowerCase().includes(q) ||
      (c.operadora || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">

            <div className="mb-6">
              <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Contratos</h1>
              <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>
                Todos os contratos registados pelos parceiros com documentos associados
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'Total',          value: contratos.length,                                                  bg: '#e0e7ff', color: '#4338ca' },
                { label: 'Rascunho',       value: contratos.filter(c => c.status === 'rascunho').length,             bg: '#f3f4f6', color: '#6b7280' },
                { label: 'Pendente',       value: contratos.filter(c => c.status.startsWith('pendente')).length,     bg: '#fef3c7', color: '#92400e' },
                { label: 'Finalizado',     value: contratos.filter(c => c.status === 'finalizado').length,           bg: '#d1fae5', color: '#065f46' },
                { label: 'Rejeitado',      value: contratos.filter(c => c.status === 'rejeitado').length,            bg: '#fee2e2', color: '#991b1b' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="mb-5 rounded-xl p-4 flex flex-col md:flex-row gap-3" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-2.5" style={{ color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar por cliente, NIF, parceiro ou operadora..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #d1d5db', color: '#111827' }} />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid #d1d5db', color: '#111827', background: '#fff' }}>
                <option value="todos">Todos os estados</option>
                <option value="rascunho">Rascunho</option>
                <option value="pendente_cliente">Pendente Cliente</option>
                <option value="pendente_vendedor">Pendente Vendedor</option>
                <option value="finalizado">Finalizado</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
            </div>

            {/* Lista */}
            {filtered.length === 0 ? (
              <div className="rounded-xl p-12 text-center" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <FileText size={48} className="mx-auto mb-4" style={{ color: '#d1d5db' }} />
                <p className="text-base font-medium" style={{ color: '#374151' }}>
                  {contratos.length === 0 ? 'Nenhum contrato registado ainda' : 'Nenhum resultado'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(c => {
                  const st = STATUS[c.status] || { bg: '#f3f4f6', color: '#6b7280', label: c.status }
                  const isOpen = expanded === c.id
                  const docs = docsMap[c.id] ?? []

                  return (
                    <div key={c.id} className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                      {/* Linha principal */}
                      <button
                        onClick={() => toggleContrato(c)}
                        className="flex items-center justify-between w-full p-5 text-left"
                        style={{ borderBottom: isOpen ? '1px solid #e5e7eb' : 'none' }}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0" style={{ background: '#eef2ff' }}>
                            <User size={18} style={{ color: '#4f46e5' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-sm" style={{ color: '#111827' }}>{c.client_name}</p>
                              {c.client_nif && <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: '#f3f4f6', color: '#6b7280' }}>NIF {c.client_nif}</span>}
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: c.servico_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: c.servico_type === 'energia' ? '#92400e' : '#4338ca' }}>
                                {c.servico_type === 'energia' ? <Zap size={10} /> : <Wifi size={10} />}
                                {c.operadora || c.servico_type}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-1">
                              {c.parceiro_name && (
                                <span className="flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
                                  <Building2 size={11} /> {c.parceiro_name}
                                </span>
                              )}
                              {c.client_phone && (
                                <span className="flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
                                  <Phone size={11} /> {c.client_phone}
                                </span>
                              )}
                              {c.client_email && (
                                <span className="flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
                                  <Mail size={11} /> {c.client_email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                          {/* Assinaturas */}
                          <div className="hidden md:flex items-center gap-2">
                            <span className="text-xs" style={{ color: '#9ca3af' }}>Cliente</span>
                            {c.assinado_cliente
                              ? <CheckCircle size={16} style={{ color: '#10b981' }} />
                              : <Clock size={16} style={{ color: '#f59e0b' }} />}
                            <span className="text-xs" style={{ color: '#9ca3af' }}>Vendedor</span>
                            {c.assinado_vendedor
                              ? <CheckCircle size={16} style={{ color: '#10b981' }} />
                              : <Clock size={16} style={{ color: '#f59e0b' }} />}
                          </div>
                          <span className="text-xs hidden md:block" style={{ color: '#9ca3af' }}>
                            {new Date(c.created_at).toLocaleDateString('pt-PT')}
                          </span>
                          {isOpen ? <ChevronUp size={18} style={{ color: '#9ca3af' }} /> : <ChevronDown size={18} style={{ color: '#9ca3af' }} />}
                        </div>
                      </button>

                      {/* Documentos expandidos */}
                      {isOpen && (
                        <div className="p-4">
                          {docsLoading === c.id ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#4f46e5' }} />
                            </div>
                          ) : docs.length === 0 ? (
                            <div className="rounded-xl p-6 text-center" style={{ background: '#f9fafb', border: '1px dashed #d1d5db' }}>
                              <FileText size={28} className="mx-auto mb-2" style={{ color: '#d1d5db' }} />
                              <p className="text-sm" style={{ color: '#9ca3af' }}>Nenhum documento carregado neste contrato</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7280' }}>
                                {docs.length} documento(s)
                              </p>
                              {docs.map(d => {
                                const ext = getExt(d.file_name)
                                const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext)
                                const isPdf = ext === 'pdf'
                                return (
                                  <div key={d.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
                                    <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ background: '#f9fafb' }}>
                                      <span className="flex h-7 w-10 items-center justify-center rounded text-[10px] font-bold uppercase flex-shrink-0"
                                        style={{ background: '#e0e7ff', color: '#4338ca' }}>
                                        {ext || 'DOC'}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{d.file_name}</p>
                                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                                          {formatSize(d.file_size)} · {new Date(d.created_at).toLocaleDateString('pt-PT')}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {d.signed_url && (isImage || isPdf) && (
                                          <button onClick={() => setViewer(d)}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                                            style={{ background: '#eef2ff', color: '#4338ca' }}>
                                            <Eye size={13} /> Ver
                                          </button>
                                        )}
                                        {d.signed_url ? (
                                          <a href={d.signed_url} download={d.file_name}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                                            style={{ background: '#d1fae5', color: '#065f46' }}>
                                            <Download size={13} /> Download
                                          </a>
                                        ) : (
                                          <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#fee2e2', color: '#991b1b' }}>
                                            URL expirada
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {d.signed_url && isImage && (
                                      <div className="p-3" style={{ background: '#fff' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={d.signed_url} alt={d.file_name}
                                          className="w-full rounded-lg object-contain max-h-64"
                                          style={{ background: '#f3f4f6' }} />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={() => setViewer(null)}>
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#fff', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <p className="font-semibold text-sm" style={{ color: '#111827' }}>{viewer.file_name}</p>
              <div className="flex items-center gap-2">
                {viewer.signed_url && (
                  <a href={viewer.signed_url} download={viewer.file_name}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{ background: '#d1fae5', color: '#065f46' }}>
                    <Download size={13} /> Download
                  </a>
                )}
                <button onClick={() => setViewer(null)} className="rounded-lg p-2 hover:bg-gray-100">
                  <X size={18} style={{ color: '#6b7280' }} />
                </button>
              </div>
            </div>
            <div style={{ height: '75vh', overflow: 'auto', background: '#f3f4f6' }}>
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
