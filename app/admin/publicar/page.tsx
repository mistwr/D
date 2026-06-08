'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Send, CheckCircle2, Users, FileUp, FileText, Trash2, X } from 'lucide-react'

interface Parceiro { id: string; full_name: string; email: string; company_name: string }
interface Publicacao { id: string; title: string; content: string; file_name: string; author_name: string; created_at: string }

export default function PublicarPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParceiros, setSelectedParceiros] = useState<string[]>([])
  const [form, setForm] = useState({ title: '', message: '' })
  const [ficheiro, setFicheiro] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      authFetch('/api/vendas?parceiros=1').then(r => r.json()),
      authFetch('/api/publicacoes').then(r => r.json()),
    ]).then(([p, pub]) => {
      setParceiros(p.parceiros || [])
      setPublicacoes(pub.publicacoes || [])
      setLoading(false)
    })
  }, [user, authFetch])

  function toggleParceiro(id: string) {
    setSelectedParceiros(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function selectAll() {
    setSelectedParceiros(prev => prev.length === parceiros.length ? [] : parceiros.map(p => p.id))
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setSuccess(false)
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('content', form.message)
    if (selectedParceiros.length > 0) fd.append('parceiro_ids', selectedParceiros.join(','))
    if (ficheiro) fd.append('file', ficheiro)
    await authFetch('/api/publicacoes/upload', { method: 'POST', body: fd })
    setSuccess(true)
    setForm({ title: '', message: '' })
    setFicheiro(null)
    setSelectedParceiros([])
    const pub = await authFetch('/api/publicacoes').then(r => r.json())
    setPublicacoes(pub.publicacoes || [])
    setSending(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )

  const inputStyle = { background: '#fff', border: '1px solid #d1d5db', color: '#1e293b' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div>
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:p-6">
          <div className="p-4 md:p-5 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Send size={28} style={{ color: '#0ea5e9' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Publicar para Parceiros</h1>
                <p className="text-sm" style={{ color: '#64748b' }}>Envie documentos, campanhas e informacoes aos parceiros</p>
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-2 rounded-lg p-4 mb-6" style={{ background: '#d1fae5', border: '1px solid #6ee7b7' }}>
                <CheckCircle2 size={18} style={{ color: '#059669' }} />
                <span className="text-sm font-medium" style={{ color: '#065f46' }}>Publicacao enviada com sucesso!</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulario */}
              <div className="lg:col-span-2">
                <form onSubmit={handlePublish} className="rounded-xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                  <h2 className="font-semibold mb-4" style={{ color: '#1e293b' }}>Nova Publicacao</h2>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium" style={{ color: '#475569' }}>Titulo *</label>
                      <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Ex: Novos precos MEO Setembro" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium" style={{ color: '#475569' }}>Mensagem</label>
                      <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4}
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none" style={inputStyle}
                        placeholder="Escreva a mensagem ou instrucoes para os parceiros..." />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium" style={{ color: '#475569' }}>Ficheiro anexo (opcional)</label>
                      {ficheiro ? (
                        <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                          <div className="flex items-center gap-2">
                            <FileText size={16} style={{ color: '#0284c7' }} />
                            <span className="text-sm font-medium" style={{ color: '#0284c7' }}>{ficheiro.name}</span>
                            <span className="text-xs" style={{ color: '#64748b' }}>({(ficheiro.size / 1024).toFixed(0)} KB)</span>
                          </div>
                          <button type="button" onClick={() => setFicheiro(null)} className="rounded p-1 hover:bg-blue-100">
                            <X size={14} style={{ color: '#0284c7' }} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 cursor-pointer rounded-lg px-4 py-3 transition-colors"
                          style={{ background: '#f9fafb', border: '1px dashed #d1d5db' }}>
                          <FileUp size={18} style={{ color: '#64748b' }} />
                          <span className="text-sm" style={{ color: '#64748b' }}>Clique para seleccionar — PDF, Excel, CSV, PNG, JPG (max 20MB)</span>
                          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) setFicheiro(e.target.files[0]); e.target.value = '' }} />
                        </label>
                      )}
                    </div>
                    <button type="submit" disabled={sending || !form.title}
                      className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                      <Send size={16} /> {sending ? 'A enviar...' : selectedParceiros.length > 0 ? `Enviar a ${selectedParceiros.length} parceiro(s)` : 'Enviar a todos'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Seleccao parceiros */}
              <div className="lg:col-span-1">
                <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                  <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <div className="flex items-center gap-2">
                      <Users size={16} style={{ color: '#0ea5e9' }} />
                      <span className="font-semibold text-sm" style={{ color: '#475569' }}>Destinatarios</span>
                    </div>
                    <button onClick={selectAll} className="text-xs font-medium" style={{ color: '#0ea5e9' }}>
                      {selectedParceiros.length === parceiros.length ? 'Deseleccionar' : 'Seleccionar todos'}
                    </button>
                  </div>
                  {parceiros.length === 0 ? (
                    <div className="p-6 text-center text-sm" style={{ color: '#64748b' }}>Nenhum parceiro registado</div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {parceiros.map(p => (
                        <label key={p.id} className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                          style={{ borderBottom: '1px solid #f3f4f6', background: selectedParceiros.includes(p.id) ? '#eef2ff' : '#fff' }}>
                          <input type="checkbox" checked={selectedParceiros.includes(p.id)} onChange={() => toggleParceiro(p.id)}
                            className="h-4 w-4 rounded" style={{ accentColor: '#4338ca' }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#1e293b' }}>{p.full_name}</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>{p.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="p-3 text-center text-xs" style={{ background: '#f9fafb', color: '#64748b' }}>
                    {selectedParceiros.length === 0 ? 'Envia a todos se nao seleccionar nenhum' : `${selectedParceiros.length} seleccionado(s)`}
                  </div>
                </div>
              </div>
            </div>

            {/* Historico */}
            {publicacoes.length > 0 && (
              <div className="mt-8 rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <div className="p-5" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <h2 className="font-bold" style={{ color: '#1e293b' }}>Historico de Publicacoes</h2>
                </div>
                <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                  {publicacoes.slice(0, 20).map(p => (
                    <div key={p.id} className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{p.title}</p>
                          {p.content && <p className="text-xs mt-1 truncate" style={{ color: '#64748b' }}>{p.content.substring(0, 100)}</p>}
                          {p.file_name && (
                            <div className="flex items-center gap-1 mt-1">
                              <FileText size={12} style={{ color: '#0284c7' }} />
                              <span className="text-xs" style={{ color: '#0284c7' }}>{p.file_name}</span>
                            </div>
                          )}
                          {p.author_name && <span className="text-xs mt-1 inline-block" style={{ color: '#9ca3af' }}>por {p.author_name}</span>}
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: '#9ca3af' }}>{new Date(p.created_at).toLocaleDateString('pt-PT')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
