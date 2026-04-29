'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Send, CheckCircle2, Users } from 'lucide-react'

interface Parceiro { id: string; full_name: string; email: string; company_name: string }
interface Publicacao { id: string; title: string; message: string; parceiro_name: string; document_name: string; created_at: string }

export default function PublicarPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParceiros, setSelectedParceiros] = useState<string[]>([])
  const [form, setForm] = useState({ title: '', message: '', document_name: '' })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).catch(() => null)
      if (!me?.user || me.user.role !== 'admin') { router.push('/login'); return }
      setUser(me.user)
      const [p, pub] = await Promise.all([
        fetch('/api/vendas?parceiros=1', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/publicacoes', { credentials: 'include' }).then(r => r.json()),
      ])
      setParceiros(p.parceiros || [])
      setPublicacoes(pub.publicacoes || [])
      setLoading(false)
    }
    load()
  }, [router])

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
    await fetch('/api/publicacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...form, parceiro_ids: selectedParceiros.length > 0 ? selectedParceiros : undefined }),
    })
    setSuccess(true)
    setForm({ title: '', message: '', document_name: '' })
    setSelectedParceiros([])
    const pub = await fetch('/api/publicacoes', { credentials: 'include' }).then(r => r.json())
    setPublicacoes(pub.publicacoes || [])
    setSending(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  const inputStyle = { background: '#fff', border: '1px solid #d1d5db', color: '#111827' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <Send size={28} style={{ color: '#4338ca' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Publicar para Parceiros</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>Envie documentos, campanhas e informacoes aos parceiros</p>
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
                <form onSubmit={handlePublish} className="rounded-xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <h2 className="font-semibold mb-4" style={{ color: '#111827' }}>Nova Publicacao</h2>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Titulo *</label>
                      <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Ex: Novos precos MEO Setembro" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Mensagem</label>
                      <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4}
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none" style={inputStyle}
                        placeholder="Escreva a mensagem ou instrucoes para os parceiros..." />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Nome do documento (opcional)</label>
                      <input type="text" value={form.document_name} onChange={e => setForm(f => ({ ...f, document_name: e.target.value }))}
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle} placeholder="tabela-precos-meo-2026.pdf" />
                    </div>
                    <button type="submit" disabled={sending || !form.title}
                      className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white text-sm disabled:opacity-50" style={{ background: '#4338ca' }}>
                      <Send size={16} /> {sending ? 'A enviar...' : selectedParceiros.length > 0 ? `Enviar a ${selectedParceiros.length} parceiro(s)` : 'Enviar a todos'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Seleccao parceiros */}
              <div className="lg:col-span-1">
                <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <div className="flex items-center gap-2">
                      <Users size={16} style={{ color: '#4338ca' }} />
                      <span className="font-semibold text-sm" style={{ color: '#374151' }}>Destinatarios</span>
                    </div>
                    <button onClick={selectAll} className="text-xs font-medium" style={{ color: '#4338ca' }}>
                      {selectedParceiros.length === parceiros.length ? 'Deseleccionar' : 'Seleccionar todos'}
                    </button>
                  </div>
                  {parceiros.length === 0 ? (
                    <div className="p-6 text-center text-sm" style={{ color: '#6b7280' }}>Nenhum parceiro registado</div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {parceiros.map(p => (
                        <label key={p.id} className="flex items-center gap-3 p-3 cursor-pointer transition-colors"
                          style={{ borderBottom: '1px solid #f3f4f6', background: selectedParceiros.includes(p.id) ? '#eef2ff' : '#fff' }}>
                          <input type="checkbox" checked={selectedParceiros.includes(p.id)} onChange={() => toggleParceiro(p.id)}
                            className="h-4 w-4 rounded" style={{ accentColor: '#4338ca' }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#111827' }}>{p.full_name}</p>
                            <p className="text-xs" style={{ color: '#6b7280' }}>{p.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="p-3 text-center text-xs" style={{ background: '#f9fafb', color: '#6b7280' }}>
                    {selectedParceiros.length === 0 ? 'Envia a todos se nao seleccionar nenhum' : `${selectedParceiros.length} seleccionado(s)`}
                  </div>
                </div>
              </div>
            </div>

            {/* Historico */}
            {publicacoes.length > 0 && (
              <div className="mt-8 rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <div className="p-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <h2 className="font-bold" style={{ color: '#111827' }}>Historico de Publicacoes</h2>
                </div>
                <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                  {publicacoes.slice(0, 20).map(p => (
                    <div key={p.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm" style={{ color: '#111827' }}>{p.title}</p>
                          {p.message && <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{p.message.substring(0, 100)}</p>}
                          <span className="text-xs mt-1 inline-block" style={{ color: '#4338ca' }}>Para: {p.parceiro_name}</span>
                        </div>
                        <span className="text-xs" style={{ color: '#9ca3af' }}>{new Date(p.created_at).toLocaleDateString('pt-PT')}</span>
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
