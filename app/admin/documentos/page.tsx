'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { FileText, Search, User, ChevronDown, ChevronUp, Phone, Mail, Building2, Zap, Wifi, Download } from 'lucide-react'

interface Doc {
  id: string; venda_id: string; file_name: string; file_type: string; file_size: number
  uploaded_by: string; created_at: string
  uploader_name: string; uploader_email: string; uploader_company: string
  client_name: string; client_email: string; client_phone: string
  venda_amount: number; venda_status: string; venda_service_type: string; venda_operator: string
}

const typeLabel: Record<string, string> = {
  'application/pdf': 'PDF', 'image/jpeg': 'JPG', 'image/png': 'PNG',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
}

const ST: Record<string, { bg: string; color: string; label: string }> = {
  pendente: { bg: '#fef3c7', color: '#92400e', label: 'Pendente' },
  em_revisao: { bg: '#dbeafe', color: '#1e40af', label: 'Em Revisao' },
  ativa: { bg: '#d1fae5', color: '#065f46', label: 'Ativa' },
  processado: { bg: '#ede9fe', color: '#6d28d9', label: 'Processado' },
  pago: { bg: '#d1fae5', color: '#065f46', label: 'Pago' },
  cancelado: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelado' },
  rejeitado: { bg: '#fecaca', color: '#7f1d1d', label: 'Rejeitado' },
}

function formatSize(bytes: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function AdminDocumentosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedParceiro, setExpandedParceiro] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('todos')

  async function handleDownload(docId: string, fileName: string) {
    const res = await fetch(`/api/documentos?download=${docId}`, { credentials: 'include' })
    const data = await res.json()
    if (!data.documento?.file_data) { alert('Ficheiro nao disponivel para download'); return }
    const link = document.createElement('a')
    link.href = data.documento.file_data
    link.download = fileName
    link.click()
  }

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' })
        const meData = await meRes.json()
        if (!meData.user || meData.user.role !== 'admin') { router.push('/login'); return }
        setUser(meData.user)
        const dRes = await fetch('/api/documentos', { credentials: 'include' })
        const dData = await dRes.json()
        setDocs(dData.documentos || [])
      } catch { router.push('/login') }
      setLoading(false)
    }
    load()
  }, [router])

  // Agrupar docs por parceiro
  const parceirosMap = new Map<string, { name: string; email: string; company: string; docs: Doc[] }>()
  docs.forEach(d => {
    const key = d.uploaded_by
    if (!parceirosMap.has(key)) {
      parceirosMap.set(key, { name: d.uploader_name, email: d.uploader_email, company: d.uploader_company, docs: [] })
    }
    parceirosMap.get(key)!.docs.push(d)
  })

  const filtered = docs.filter(d => {
    const matchSearch = search === '' ||
      d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      d.uploader_name.toLowerCase().includes(search.toLowerCase()) ||
      d.client_name.toLowerCase().includes(search.toLowerCase()) ||
      d.venda_operator.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'todos' ||
      (filterType === 'pdf' && d.file_type === 'application/pdf') ||
      (filterType === 'img' && d.file_type.startsWith('image/')) ||
      (filterType === 'doc' && (d.file_type.includes('word') || d.file_type.includes('document'))) ||
      (filterType === 'xls' && (d.file_type.includes('excel') || d.file_type.includes('spreadsheet')))
    return matchSearch && matchType
  })

  // Reagrupar filtrados
  const filteredMap = new Map<string, { name: string; email: string; company: string; docs: Doc[] }>()
  filtered.forEach(d => {
    const key = d.uploaded_by
    if (!filteredMap.has(key)) {
      filteredMap.set(key, { name: d.uploader_name, email: d.uploader_email, company: d.uploader_company, docs: [] })
    }
    filteredMap.get(key)!.docs.push(d)
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
        <main className="flex-1 md:ml-64 pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Documentos dos Parceiros</h1>
              <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>
                Todos os contratos, faturas e documentos carregados pelos utilizadores
              </p>
            </div>

            {/* Estatisticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'Total Docs', value: docs.length, bg: '#e0e7ff', color: '#4338ca' },
                { label: 'Parceiros', value: parceirosMap.size, bg: '#fce7f3', color: '#9d174d' },
                { label: 'PDF', value: docs.filter(d => d.file_type === 'application/pdf').length, bg: '#fee2e2', color: '#991b1b' },
                { label: 'Imagens', value: docs.filter(d => d.file_type.startsWith('image/')).length, bg: '#d1fae5', color: '#065f46' },
                { label: 'Outros', value: docs.filter(d => !d.file_type.startsWith('image/') && d.file_type !== 'application/pdf').length, bg: '#fef3c7', color: '#92400e' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Barra de pesquisa + filtros */}
            <div className="mb-6 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-2.5" style={{ color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Procurar por ficheiro, parceiro, cliente ou operadora..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }} />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }}>
                <option value="todos">Todos os tipos</option>
                <option value="pdf">PDF</option>
                <option value="img">Imagens</option>
                <option value="doc">Word</option>
                <option value="xls">Excel</option>
              </select>
            </div>

            {/* Documentos agrupados por parceiro */}
            {filteredMap.size === 0 ? (
              <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <FileText size={48} className="mx-auto mb-4" style={{ color: '#d1d5db' }} />
                <p className="text-lg font-medium" style={{ color: '#374151' }}>
                  {docs.length === 0 ? 'Nenhum documento carregado' : 'Nenhum resultado encontrado'}
                </p>
                <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>
                  {docs.length === 0 ? 'Os parceiros ainda nao carregaram documentos' : 'Tente alterar os filtros'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(filteredMap.entries()).map(([parceiroId, parceiro]) => {
                  const isOpen = expandedParceiro === parceiroId
                  const totalValor = parceiro.docs.reduce((s, d) => s + (d.venda_amount || 0), 0)
                  const uniqueVendas = new Set(parceiro.docs.map(d => d.venda_id)).size

                  return (
                    <div key={parceiroId} className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                      {/* Parceiro header */}
                      <button onClick={() => setExpandedParceiro(isOpen ? null : parceiroId)}
                        className="flex items-center justify-between w-full p-5 text-left transition-colors"
                        style={{ borderBottom: isOpen ? '1px solid #e5e7eb' : 'none' }}>
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: '#eef2ff' }}>
                            <User size={22} style={{ color: '#4f46e5' }} />
                          </div>
                          <div>
                            <p className="font-bold text-base" style={{ color: '#111827' }}>{parceiro.name}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              {parceiro.company && (
                                <span className="flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
                                  <Building2 size={12} /> {parceiro.company}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
                                <Mail size={12} /> {parceiro.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold" style={{ color: '#4f46e5' }}>{parceiro.docs.length} doc(s)</p>
                            <p className="text-xs" style={{ color: '#6b7280' }}>{uniqueVendas} venda(s)</p>
                          </div>
                          {isOpen ? <ChevronUp size={20} style={{ color: '#6b7280' }} /> : <ChevronDown size={20} style={{ color: '#6b7280' }} />}
                        </div>
                      </button>

                      {/* Lista detalhada de documentos */}
                      {isOpen && (
                        <div className="p-5">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                  {['Ficheiro', 'Tamanho', 'Cliente', 'Contacto', 'Servico', 'Operadora', 'Valor', 'Estado', 'Data', ''].map(h => (
                                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: '#6b7280' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {parceiro.docs.map(d => {
                                  const st = ST[d.venda_status] || { bg: '#f3f4f6', color: '#6b7280', label: d.venda_status }
                                  return (
                                    <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                      <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                          <span className="flex h-7 w-9 items-center justify-center rounded text-[10px] font-bold" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                                            {typeLabel[d.file_type] || 'DOC'}
                                          </span>
                                          <span className="text-sm font-medium" style={{ color: '#111827' }}>{d.file_name}</span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>{formatSize(d.file_size)}</td>
                                      <td className="px-3 py-3">
                                        <p className="text-sm font-medium" style={{ color: '#111827' }}>{d.client_name}</p>
                                        {d.client_email && <p className="text-xs" style={{ color: '#9ca3af' }}>{d.client_email}</p>}
                                      </td>
                                      <td className="px-3 py-3">
                                        {d.client_phone ? (
                                          <span className="flex items-center gap-1 text-xs" style={{ color: '#6b7280' }}>
                                            <Phone size={11} /> {d.client_phone}
                                          </span>
                                        ) : <span className="text-xs" style={{ color: '#d1d5db' }}>-</span>}
                                      </td>
                                      <td className="px-3 py-3">
                                        <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                                          style={{ background: d.venda_service_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: d.venda_service_type === 'energia' ? '#92400e' : '#4338ca' }}>
                                          {d.venda_service_type === 'energia' ? <Zap size={11} /> : <Wifi size={11} />}
                                          {d.venda_service_type === 'energia' ? 'Energia' : 'Telecom'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3 text-sm font-medium" style={{ color: '#111827' }}>{d.venda_operator || '-'}</td>
                                      <td className="px-3 py-3 text-sm font-semibold" style={{ color: '#111827' }}>{'\u20AC'}{d.venda_amount?.toFixed(2)}</td>
                                      <td className="px-3 py-3">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: st.bg, color: st.color }}>
                                          {st.label}
                                        </span>
                                      </td>
                                      <td className="px-3 py-3 text-xs" style={{ color: '#6b7280' }}>
                                        {new Date(d.created_at).toLocaleDateString('pt-PT')}
                                      </td>
                                      <td className="px-3 py-3">
                                        <button onClick={() => handleDownload(d.id, d.file_name)}
                                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                                          style={{ background: '#eef2ff', color: '#4338ca' }} title="Descarregar ficheiro">
                                          <Download size={13} /> Abrir
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Resumo */}
                          <div className="mt-4 pt-4 flex flex-wrap gap-4" style={{ borderTop: '1px solid #f3f4f6' }}>
                            <div className="rounded-lg px-4 py-2" style={{ background: '#f9fafb' }}>
                              <p className="text-xs" style={{ color: '#6b7280' }}>Total documentos</p>
                              <p className="text-sm font-bold" style={{ color: '#4338ca' }}>{parceiro.docs.length}</p>
                            </div>
                            <div className="rounded-lg px-4 py-2" style={{ background: '#f9fafb' }}>
                              <p className="text-xs" style={{ color: '#6b7280' }}>Vendas associadas</p>
                              <p className="text-sm font-bold" style={{ color: '#059669' }}>{uniqueVendas}</p>
                            </div>
                            <div className="rounded-lg px-4 py-2" style={{ background: '#f9fafb' }}>
                              <p className="text-xs" style={{ color: '#6b7280' }}>Valor total vendas</p>
                              <p className="text-sm font-bold" style={{ color: '#111827' }}>{'\u20AC'}{totalValor.toFixed(2)}</p>
                            </div>
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
    </div>
  )
}
