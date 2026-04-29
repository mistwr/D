'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { FileText, Upload, Trash2, Download, Search, X } from 'lucide-react'

interface Contrato {
  id: string
  file_name: string
  file_type: string
  file_size: number
  signed_url: string | null
  created_at: string
  venda_id: string | null
  venda_cliente?: string
}

export default function ContratosPage() {
  const { user, loading: authLoading } = useAuth('parceiro')
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    loadContratos()
  }, [user])

  async function loadContratos() {
    setLoading(true)
    const r = await fetch('/api/documentos?tipo=contrato', { credentials: 'include' })
    const d = await r.json()
    setContratos(d.documentos || [])
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('tipo', 'contrato')
    const r = await fetch('/api/documentos', { method: 'POST', credentials: 'include', body: fd })
    const d = await r.json()
    setUploading(false)
    e.target.value = ''
    if (!r.ok) { setUploadError(d.error || 'Erro ao enviar ficheiro'); return }
    setContratos(prev => [d.documento, ...prev])
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch('/api/documentos', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setContratos(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  const filtered = contratos.filter(c =>
    c.file_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.venda_cliente || '').toLowerCase().includes(search.toLowerCase())
  )

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
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">

            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Os Meus Contratos</h1>
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                  {contratos.length} contrato{contratos.length !== 1 ? 's' : ''} arquivado{contratos.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#4f46e5' }}>
                <Upload size={16} /> {uploading ? 'A enviar...' : 'Enviar Contrato'}
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" disabled={uploading} />
            </div>

            {uploadError && (
              <div className="mb-4 rounded-xl p-4 flex items-start gap-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <X size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
                <p className="text-sm" style={{ color: '#991b1b' }}>{uploadError}</p>
              </div>
            )}

            {/* Zona de drop */}
            <label className="block mb-6 rounded-2xl border-2 border-dashed cursor-pointer transition hover:border-indigo-400"
              style={{ borderColor: '#d1d5db', background: '#fff' }}>
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="rounded-full p-4" style={{ background: '#eef2ff' }}>
                  <Upload size={24} style={{ color: '#4f46e5' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: '#111827' }}>
                    {uploading ? 'A enviar...' : 'Arraste um ficheiro ou clique para escolher'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>PDF, Word, imagens — max. 10MB</p>
                </div>
              </div>
            </label>

            {/* Pesquisa */}
            {contratos.length > 0 && (
              <div className="relative mb-4">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar contratos..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#111827' }} />
              </div>
            )}

            {/* Lista */}
            {filtered.length === 0 ? (
              <div className="rounded-xl p-16 text-center" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <FileText size={40} className="mx-auto mb-3" style={{ color: '#d1d5db' }} />
                <p className="text-sm font-medium" style={{ color: '#374151' }}>Nenhum contrato ainda</p>
                <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                  Use o botao acima para enviar os seus contratos em PDF ou Word
                </p>
              </div>
            ) : (
              <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <ul className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                  {filtered.map(c => (
                    <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="rounded-lg p-2.5 flex-shrink-0" style={{ background: '#eef2ff' }}>
                        <FileText size={18} style={{ color: '#4f46e5' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{c.file_name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                          {c.file_size ? `${(c.file_size / 1024).toFixed(0)} KB · ` : ''}
                          {new Date(c.created_at).toLocaleDateString('pt-PT')}
                          {c.venda_cliente ? ` · Venda: ${c.venda_cliente}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {c.signed_url && (
                          <a href={c.signed_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                            style={{ background: '#eef2ff', color: '#4f46e5' }}>
                            <Download size={13} /> Abrir
                          </a>
                        )}
                        <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                          className="rounded-lg p-1.5 transition hover:bg-red-50 disabled:opacity-50">
                          <Trash2 size={15} style={{ color: '#dc2626' }} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
