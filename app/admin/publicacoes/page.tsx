'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Newspaper, Plus, Trash2, X, FileText, Users, Globe, Send } from 'lucide-react'

interface Parceiro { id: string; full_name: string; email: string }
interface Publicacao {
  id: string; title: string; content: string; message: string
  file_name: string; file_path: string; signed_url: string | null
  author_name: string; parceiro_id: string | null; created_at: string
}

export default function AdminPublicacoesPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const fileRef = useRef<HTMLInputElement>(null)
  const [pubs, setPubs] = useState<Publicacao[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    title: '',
    content: '',
    destino: 'todos', // 'todos' ou 'parceiros'
    parceiroIds: [] as string[],
  })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      authFetch('/api/publicacoes').then(r => r.json()),
      authFetch('/api/vendas?parceiros=1').then(r => r.json()),
    ]).then(([pubsRes, parcRes]) => {
      setPubs(pubsRes.publicacoes || [])
      setParceiros(parcRes.parceiros || [])
      setLoading(false)
    })
  }, [user, authFetch])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('O titulo e obrigatorio'); return }
    setSending(true)
    setError('')
    setSuccess('')
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('content', form.content)
    if (form.destino === 'parceiros' && form.parceiroIds.length > 0) {
      fd.append('parceiro_ids', form.parceiroIds.join(','))
    }
    if (file) fd.append('file', file)
    const res = await authFetch('/api/publicacoes/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setSending(false)
    if (!res.ok) { setError(data.error || 'Erro ao publicar'); return }
    setSuccess(`Publicacao enviada com sucesso!`)
    setForm({ title: '', content: '', destino: 'todos', parceiroIds: [] })
    setFile(null)
    setShowForm(false)
    // Recarregar lista
    const pubsRes = await authFetch('/api/publicacoes').then(r => r.json())
    setPubs(pubsRes.publicacoes || [])
  }

  async function deletePub(id: string) {
    if (!confirm('Tem a certeza que quer eliminar esta publicacao?')) return
    await authFetch('/api/publicacoes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setPubs(prev => prev.filter(p => p.id !== id))
  }

  function toggleParceiro(id: string) {
    setForm(f => ({
      ...f,
      parceiroIds: f.parceiroIds.includes(id)
        ? f.parceiroIds.filter(p => p !== id)
        : [...f.parceiroIds, id],
    }))
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )

  const inp = { background: '#fff', border: '1px solid #d1d5db', color: '#1e293b' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 lg:relative lg:z-10 lg:ml-64 pt-16">
          <div className="p-4 md:p-5 max-w-5xl mx-auto w-full mx-auto w-full">

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Newspaper size={18} style={{ color: '#0ea5e9' }} />
                <div>
                  <h1 className="text-xl font-bold" style={{ color: '#1e293b' }}>Publicacoes</h1>
                  <p className="text-xs" style={{ color: '#64748b' }}>{pubs.length} publicacao{pubs.length !== 1 ? 'es' : ''}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                <Plus size={14} /> Nova Publicacao
              </button>
            </div>

            {/* Lista */}
            {pubs.length === 0 ? (
              <div className="rounded-lg p-8 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <Newspaper size={40} style={{ color: '#d1d5db' }} className="mx-auto mb-3" />
                <p className="text-sm font-medium" style={{ color: '#475569' }}>Nenhuma publicacao</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pubs.map(p => (
                  <div key={p.id} className="rounded-lg p-3 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-xs" style={{ color: '#1e293b' }}>{p.title}</h3>
                          <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: p.parceiro_id ? '#eef2ff' : '#f0fdf4', color: p.parceiro_id ? '#4338ca' : '#166534' }}>
                            {p.parceiro_id ? 'Especifico' : 'Todos'}
                          </span>
                        </div>
                        {(p.content || p.message) && (
                          <p className="text-xs" style={{ color: '#64748b' }}>{p.content || p.message}</p>
                        )}
                        {(p.file_name || p.file_path) && (
                          <div className="mt-1 flex items-center gap-1">
                            <FileText size={11} style={{ color: '#64748b' }} />
                            {p.signed_url ? (
                              <a href={p.signed_url} target="_blank" rel="noreferrer"
                                className="text-xs font-medium hover:underline" style={{ color: '#0ea5e9' }}>
                                {p.file_name || p.file_path}
                              </a>
                            ) : (
                              <span className="text-xs" style={{ color: '#9ca3af' }}>{p.file_name || p.file_path}</span>
                            )}
                          </div>
                        )}
                        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                          {p.author_name && `por ${p.author_name} · `}
                          {new Date(p.created_at).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                      <button onClick={() => deletePub(p.id)}
                        className="rounded-lg p-1.5 transition hover:bg-red-50 flex-shrink-0">
                        <Trash2 size={14} style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal nova publicacao */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <h2 className="font-bold text-base" style={{ color: '#1e293b' }}>Nova Publicacao</h2>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1.5 hover:bg-gray-100 transition">
                <X size={18} style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
              {error && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fee2e2', color: '#991b1b' }}>{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Titulo *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} required placeholder="Titulo da publicacao" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Mensagem / Conteudo</label>
                <textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm resize-none" style={inp}
                  placeholder="Texto da publicacao para os parceiros..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Ficheiro anexo</label>
                <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png" />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border transition hover:bg-gray-50"
                    style={{ border: '1px solid #d1d5db', color: '#475569' }}>
                    <FileText size={15} />
                    {file ? 'Alterar ficheiro' : 'Adicionar ficheiro'}
                  </button>
                  {file && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate max-w-48" style={{ color: '#1e293b' }}>{file.name}</span>
                      <button type="button" onClick={() => setFile(null)}>
                        <X size={14} style={{ color: '#9ca3af' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Destinatarios</label>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setForm(f => ({ ...f, destino: 'todos', parceiroIds: [] }))}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border transition"
                    style={{
                      background: form.destino === 'todos' ? '#4f46e5' : '#f9fafb',
                      color: form.destino === 'todos' ? '#fff' : '#374151',
                      border: form.destino === 'todos' ? '1px solid #4f46e5' : '1px solid #e5e7eb',
                    }}>
                    <Globe size={15} /> Todos os parceiros
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, destino: 'parceiros' }))}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border transition"
                    style={{
                      background: form.destino === 'parceiros' ? '#4f46e5' : '#f9fafb',
                      color: form.destino === 'parceiros' ? '#fff' : '#374151',
                      border: form.destino === 'parceiros' ? '1px solid #4f46e5' : '1px solid #e5e7eb',
                    }}>
                    <Users size={15} /> Selecionar parceiros
                  </button>
                </div>

                {form.destino === 'parceiros' && (
                  <div className="rounded-lg p-3 max-h-48 overflow-y-auto space-y-1" style={{ border: '1px solid #e2e8f0', background: '#f9fafb' }}>
                    {parceiros.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: '#9ca3af' }}>Nenhum parceiro registado</p>
                    ) : parceiros.map(p => (
                      <label key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition hover:bg-white"
                        style={{ background: form.parceiroIds.includes(p.id) ? '#eef2ff' : 'transparent' }}>
                        <input type="checkbox" checked={form.parceiroIds.includes(p.id)} onChange={() => toggleParceiro(p.id)}
                          className="rounded" style={{ accentColor: '#4f46e5' }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#1e293b' }}>{p.full_name}</p>
                          <p className="text-xs" style={{ color: '#9ca3af' }}>{p.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg py-3 text-sm font-semibold border transition hover:bg-gray-50"
                  style={{ color: '#475569', border: '1px solid #d1d5db' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  {sending
                    ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> A publicar...</>
                    : <><Send size={15} /> Publicar</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3.5 shadow-lg flex items-center gap-3"
          style={{ background: '#d1fae5', border: '1px solid #6ee7b7' }}>
          <span className="text-sm font-medium" style={{ color: '#065f46' }}>{success}</span>
          <button onClick={() => setSuccess('')}><X size={16} style={{ color: '#065f46' }} /></button>
        </div>
      )}
    </div>
  )
}
