'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { FileText, Upload, ChevronDown, ChevronUp, Check, AlertCircle, Download } from 'lucide-react'

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function formatSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

interface Venda { id: string; client_name: string; status: string; contract_type: string; service_type: string; operator: string }
interface Doc { id: string; venda_id: string; file_name: string; file_type: string; file_size: number; uploaded_by: string; created_at: string }

export default function DocumentosPage() {
  const { user, loading: authLoading, authFetch } = useAuth('parceiro')
  const [vendas, setVendas] = useState<Venda[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedVenda, setExpandedVenda] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!user) return
    Promise.all([
      authFetch('/api/vendas').then(r => r.json()),
      authFetch('/api/documentos').then(r => r.json()),
    ]).then(([vData, dData]) => {
      setVendas(vData.vendas || [])
      setDocs(dData.documentos || [])
    }).finally(() => setLoading(false))
  }, [user])

  async function handleUpload(vendaId: string) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png'
    input.multiple = true
    input.onchange = async () => {
      if (!input.files?.length) return
      setUploading(true)
      for (const file of Array.from(input.files)) {
        const base64 = await toBase64(file)
        const res = await authFetch('/api/documentos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ venda_id: vendaId, file_name: file.name, file_type: file.type, file_size: file.size, file_data: base64 }),
        })
        if (res.ok) {
          const data = await res.json()
          setDocs(prev => [...prev, data.documento])
        }
      }
      setUploading(false)
      setSuccessMsg('Documentos carregados com sucesso!')
      setTimeout(() => setSuccessMsg(''), 3000)
    }
    input.click()
  }

  async function handleDownload(docId: string) {
    const res = await authFetch(`/api/documentos?download=${docId}`)
    const data = await res.json()
    if (!data.documento?.file_data) { alert('Ficheiro nao disponivel'); return }
    const link = document.createElement('a')
    link.href = data.documento.file_data
    link.download = data.documento.file_name
    link.click()
  }

  const typeExt: Record<string, string> = {
    'application/pdf': 'PDF', 'image/jpeg': 'JPG', 'image/png': 'PNG',
    'application/msword': 'DOC', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div>
        <Sidebar userRole="parceiro" />
        <main className="w-full lg:ml-64 pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-5 max-w-7xl mx-auto w-full">
            <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Documentos e Contratos</h1>
            <p className="mt-1 mb-6 text-sm" style={{ color: '#64748b' }}>Carregue e consulte documentos por venda</p>

            {successMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-lg p-3 text-sm font-medium" style={{ background: '#d1fae5', color: '#065f46' }}>
                <Check size={16} /> {successMsg}
              </div>
            )}

            {vendas.length === 0 ? (
              <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <FileText size={48} className="mx-auto mb-4" style={{ color: '#d1d5db' }} />
                <p className="text-lg font-medium" style={{ color: '#475569' }}>Sem vendas registadas</p>
                <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Registe uma venda primeiro</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {vendas.map(v => {
                  const vendaDocs = docs.filter(d => d.venda_id === v.id)
                  const isExpanded = expandedVenda === v.id
                  const stColor = v.status === 'pago' || v.status === 'ativa' ? { bg: '#d1fae5', color: '#065f46' }
                    : v.status === 'cancelado' || v.status === 'rejeitado' ? { bg: '#fee2e2', color: '#991b1b' }
                    : v.status === 'pendente' ? { bg: '#fef3c7', color: '#92400e' }
                    : { bg: '#dbeafe', color: '#1e40af' }

                  return (
                    <div key={v.id} className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                      <button onClick={() => setExpandedVenda(isExpanded ? null : v.id)}
                        className="flex items-center justify-between w-full p-5 text-left"
                        style={{ borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none' }}>
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#eef2ff' }}>
                            <FileText size={20} style={{ color: '#4f46e5' }} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>{v.client_name}</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>{v.operator} - {v.service_type === 'energia' ? 'Energia' : 'Telecom'} - {vendaDocs.length} doc(s)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: stColor.bg, color: stColor.color }}>
                            {v.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {isExpanded ? <ChevronUp size={18} style={{ color: '#64748b' }} /> : <ChevronDown size={18} style={{ color: '#64748b' }} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-5">
                          {vendaDocs.length > 0 ? (
                            <div className="flex flex-col gap-2 mb-4">
                              {vendaDocs.map(d => (
                                <div key={d.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-10 items-center justify-center rounded text-xs font-bold" style={{ background: '#e0e7ff', color: '#0ea5e9' }}>
                                      {typeExt[d.file_type] || d.file_name.split('.').pop()?.toUpperCase() || 'DOC'}
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium" style={{ color: '#1e293b' }}>{d.file_name}</p>
                                      <p className="text-xs" style={{ color: '#9ca3af' }}>
                                        {formatSize(d.file_size)} - {new Date(d.created_at).toLocaleDateString('pt-PT')} {new Date(d.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                  <button onClick={() => handleDownload(d.id)} className="rounded-lg p-2 transition-colors" style={{ color: '#4f46e5' }} title="Descarregar">
                                    <Download size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-4 rounded-lg p-3" style={{ background: '#fffbeb', border: '1px solid #fef3c7' }}>
                              <AlertCircle size={16} style={{ color: '#d97706' }} />
                              <p className="text-sm" style={{ color: '#92400e' }}>Nenhum documento carregado para esta venda</p>
                            </div>
                          )}

                          <button onClick={() => handleUpload(v.id)} disabled={uploading}
                            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                            <Upload size={16} /> {uploading ? 'A carregar...' : 'Carregar Documentos'}
                          </button>
                          <p className="mt-3 text-xs" style={{ color: '#9ca3af' }}>PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
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
