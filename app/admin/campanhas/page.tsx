'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Megaphone, Plus, Wifi, WifiOff, FileUp, FileText, Zap, Flame, ChevronDown, ChevronUp, Share2, Trash2, Download } from 'lucide-react'

interface CampanhaPDF { id: string; file_name: string; file_type: string; file_size: number; signed_url: string | null; created_at: string }
interface Campanha { id: string; title: string; operator: string; service_type: string; description: string; status: string; created_at: string; pdf_count: number }

const TELECOM_OPS = ['MEO', 'NOS', 'Vodafone', 'NOWO']
const ENERGIA_OPS = ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy']

export default function CampanhasPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', operator: 'MEO', service_type: 'telecom' as 'telecom' | 'energia', description: '' })
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pdfs, setPdfs] = useState<Record<string, CampanhaPDF[]>>({})
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).catch(() => null)
      if (!me?.user || me.user.role !== 'admin') { router.push('/login'); return }
      setUser(me.user)
      const c = await fetch('/api/campanhas', { credentials: 'include' }).then(r => r.json()).catch(() => ({ campanhas: [] }))
      setCampanhas(c.campanhas || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/campanhas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) })
    const data = await res.json()
    if (data.campanha) setCampanhas(prev => [{ ...data.campanha, pdf_count: 0 }, ...prev])
    setShowForm(false)
    setForm({ title: '', operator: 'MEO', service_type: 'telecom', description: '' })
    setSaving(false)
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!pdfs[id]) {
      const res = await fetch(`/api/campanhas/ficheiros?campanha_id=${id}`, { credentials: 'include' }).then(r => r.json())
      setPdfs(prev => ({ ...prev, [id]: res.ficheiros || [] }))
    }
  }

  async function handleFileSelect(campanhaId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(campanhaId)
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData()
      fd.append('campanha_id', campanhaId)
      fd.append('file', files[i])
      const res = await fetch('/api/campanhas/ficheiros', { method: 'POST', credentials: 'include', body: fd })
      const data = await res.json()
      if (data.ficheiro) {
        setPdfs(prev => ({ ...prev, [campanhaId]: [data.ficheiro, ...(prev[campanhaId] ?? [])] }))
        setCampanhas(prev => prev.map(c => c.id === campanhaId ? { ...c, pdf_count: (c.pdf_count ?? 0) + 1 } : c))
      }
    }
    setUploading(null)
    e.target.value = ''
  }

  async function deleteFicheiro(campanhaId: string, ficheiroId: string) {
    await fetch('/api/campanhas/ficheiros', { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ficheiroId }) })
    setPdfs(prev => ({ ...prev, [campanhaId]: (prev[campanhaId] ?? []).filter(f => f.id !== ficheiroId) }))
    setCampanhas(prev => prev.map(c => c.id === campanhaId ? { ...c, pdf_count: Math.max(0, (c.pdf_count ?? 1) - 1) } : c))
  }

  const operators = form.service_type === 'telecom' ? TELECOM_OPS : ENERGIA_OPS

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8f9fb' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <Megaphone size={28} style={{ color: '#4338ca' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>{'Campanhas & Materiais'}</h1>
                  <p className="text-sm" style={{ color: '#6b7280' }}>Crie campanhas por operadora e carregue PDFs de materiais de venda</p>
                </div>
              </div>
              <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white text-sm" style={{ background: '#4338ca' }}>
                <Plus size={16} /> Nova Campanha
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleCreate} className="rounded-xl p-6 shadow-sm mb-8" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <h2 className="font-semibold mb-4" style={{ color: '#111827' }}>Criar Campanha</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Titulo *</label>
                    <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }} placeholder="Campanha Verao" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Tipo de Servico *</label>
                    <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value as 'telecom' | 'energia', operator: e.target.value === 'telecom' ? 'MEO' : 'EDP' }))}
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }}>
                      <option value="telecom">Telecomunicacoes</option>
                      <option value="energia">Energia</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Operadora *</label>
                    <select value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))}
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }}>
                      {operators.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Descricao</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none" style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }} placeholder="Detalhes da campanha..." />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ background: '#4338ca' }}>
                    {saving ? 'A criar...' : 'Criar Campanha'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-5 py-2 text-sm font-medium" style={{ color: '#374151', border: '1px solid #d1d5db' }}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {campanhas.length === 0 && !showForm ? (
              <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <Megaphone size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium" style={{ color: '#374151' }}>Nenhuma campanha criada</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>Crie a primeira campanha para organizar materiais por operadora.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {campanhas.map(c => {
                  const expanded = expandedId === c.id
                  const campPdfs = pdfs[c.id] || []
                  return (
                    <div key={c.id} className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                      <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(c.id)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && toggleExpand(c.id)}>
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: c.service_type === 'energia' ? '#fef3c7' : '#e0e7ff' }}>
                            {c.service_type === 'energia' ? <Flame size={20} style={{ color: '#d97706' }} /> : <Zap size={20} style={{ color: '#4338ca' }} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-bold text-sm" style={{ color: '#111827' }}>{c.title}</h3>
                              {c.status === 'ativa' ? <Wifi size={14} style={{ color: '#059669' }} /> : <WifiOff size={14} style={{ color: '#9ca3af' }} />}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#eef2ff', color: '#4338ca' }}>{c.operator}</span>
                              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: c.service_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: c.service_type === 'energia' ? '#92400e' : '#4338ca' }}>
                                {c.service_type === 'energia' ? 'Energia' : 'Telecom'}
                              </span>
                              <span className="text-xs" style={{ color: '#9ca3af' }}>{c.pdf_count} PDF(s)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const text = `*${c.title}*%0A%0AOperadora: ${c.operator}%0AServico: ${c.service_type === 'energia' ? 'Energia' : 'Telecomunicacoes'}%0A%0A${c.description || 'Consulte os detalhes da campanha.'}`
                              window.open(`https://wa.me/?text=${text}`, '_blank')
                            }}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                            style={{ background: '#dcfce7', color: '#166534' }}
                            title="Enviar por WhatsApp"
                          >
                            <Share2 size={13} /> WhatsApp
                          </button>
                          <span className="text-xs" style={{ color: '#9ca3af' }}>{new Date(c.created_at).toLocaleDateString('pt-PT')}</span>
                          {expanded ? <ChevronUp size={18} style={{ color: '#6b7280' }} /> : <ChevronDown size={18} style={{ color: '#6b7280' }} />}
                        </div>
                      </div>

                      {expanded && (
                        <div className="px-5 pb-5" style={{ borderTop: '1px solid #f3f4f6' }}>
                          {c.description && <p className="text-sm py-3" style={{ color: '#6b7280' }}>{c.description}</p>}

                          <div className="flex items-center justify-between mb-3 pt-2">
                            <h4 className="text-sm font-semibold" style={{ color: '#374151' }}>Ficheiros ({campPdfs.length})</h4>
                            <label className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer text-white" style={{ background: uploading === c.id ? '#6366f1' : '#4338ca', opacity: uploading === c.id ? 0.7 : 1 }}>
                              <FileUp size={14} />
                              {uploading === c.id ? 'A carregar...' : 'Carregar ficheiro'}
                              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg" multiple disabled={uploading === c.id} onChange={e => handleFileSelect(c.id, e)} className="hidden" />
                            </label>
                          </div>

                          {campPdfs.length === 0 ? (
                            <div className="rounded-lg p-6 text-center" style={{ background: '#f9fafb', border: '1px dashed #d1d5db' }}>
                              <FileText size={32} style={{ color: '#d1d5db' }} className="mx-auto mb-2" />
                              <p className="text-sm" style={{ color: '#6b7280' }}>Nenhum ficheiro carregado</p>
                              <p className="text-xs" style={{ color: '#9ca3af' }}>PDF, Word, Excel, CSV, PNG, JPG</p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {campPdfs.map(pdf => (
                                <div key={pdf.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                  <div className="flex items-center gap-3">
                                    <FileText size={18} style={{ color: pdf.file_type === 'image' ? '#0891b2' : '#dc2626' }} />
                                    <div>
                                      <p className="text-sm font-medium" style={{ color: '#111827' }}>{pdf.file_name}</p>
                                      <p className="text-xs" style={{ color: '#9ca3af' }}>{pdf.file_type.toUpperCase()} &middot; {new Date(pdf.created_at).toLocaleDateString('pt-PT')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {pdf.signed_url && (
                                      <a href={pdf.signed_url} download={pdf.file_name} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                                        style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                                        <Download size={12} /> Download
                                      </a>
                                    )}
                                    <button onClick={() => {
                                      const text = `*Campanha: ${c.title}*%0AOperadora: ${c.operator}%0A%0ADocumento: ${pdf.file_name}`
                                      window.open(`https://wa.me/?text=${text}`, '_blank')
                                    }} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                                      style={{ background: '#dcfce7', color: '#166534' }}>
                                      <Share2 size={12} /> WhatsApp
                                    </button>
                                    <button onClick={() => deleteFicheiro(c.id, pdf.id)}
                                      className="rounded-lg p-1.5" style={{ background: '#fef2f2' }}
                                      title="Apagar ficheiro">
                                      <Trash2 size={13} style={{ color: '#dc2626' }} />
                                    </button>
                                  </div>
                                </div>
                              ))}
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
    </div>
  )
}
