'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  Megaphone, Plus, Wifi, WifiOff, FileUp, FileText, Zap, Flame,
  ChevronDown, ChevronUp, Trash2, Download, ImagePlus, Shield, X
} from 'lucide-react'

interface CampanhaPDF { id: string; file_name: string; file_type: string; file_size: number; signed_url: string | null; created_at: string }
interface Campanha { id: string; title: string; operator: string; service_type: string; description: string; status: string; logo_url: string; logo_path: string; created_at: string; pdf_count: number }

const ALL_OPERADORAS: Record<string, string[]> = {
  telecom:  ['MEO', 'NOS', 'Vodafone', 'NOWO', 'DIGI'],
  energia:  ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Portologos'],
  gas:      ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Portologos'],
  seguros:  ['Fidelidade', 'Tranquilidade', 'Allianz', 'Generali', 'AXA', 'Zurich', 'Ageas'],
}

const SVC_META: Record<string, { label: string; color: string; bg: string }> = {
  telecom: { label: 'Telecom',  color: '#0ea5e9', bg: '#eef2ff' },
  energia: { label: 'Energia',  color: '#d97706', bg: '#fef3c7' },
  gas:     { label: 'Gas',      color: '#dc2626', bg: '#fee2e2' },
  seguros: { label: 'Seguros',  color: '#16a34a', bg: '#f0fdf4' },
}

function formatSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CampanhasPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', operator: 'MEO', service_type: 'telecom', description: '' })
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pdfs, setPdfs] = useState<Record<string, CampanhaPDF[]>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null)
  const [deletingCamp, setDeletingCamp] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)

  function flash(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  useEffect(() => {
    if (!user) return
    authFetch('/api/campanhas').then(r => r.json())
      .then(c => { setCampanhas(c.campanhas || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user, authFetch])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const res = await authFetch('/api/campanhas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (data.campanha) {
      setCampanhas(prev => [{ ...data.campanha, pdf_count: 0, logo_url: '' }, ...prev])
      setShowForm(false)
      setForm({ title: '', operator: 'MEO', service_type: 'telecom', description: '' })
      flash('Campanha criada')
    } else {
      flash(data.error || 'Erro ao criar', 'err')
    }
    setSaving(false)
  }

  async function toggleStatus(c: Campanha) {
    const newStatus = c.status === 'ativa' ? 'inativa' : 'ativa'
    const res = await authFetch('/api/campanhas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, status: newStatus }) })
    if (res.ok) setCampanhas(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
  }

  async function deleteCampanha(id: string) {
    if (!confirm('Apagar campanha e todos os seus ficheiros?')) return
    setDeletingCamp(id)
    await authFetch('/api/campanhas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setCampanhas(prev => prev.filter(c => c.id !== id))
    if (expandedId === id) setExpandedId(null)
    setDeletingCamp(null)
    flash('Campanha apagada')
  }

  async function handleLogoUpload(campanhaId: string, file: File) {
    setUploadingLogo(campanhaId)
    const fd = new FormData()
    fd.append('campanha_id', campanhaId)
    fd.append('file', file)
    const res = await authFetch('/api/campanhas', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.logo_url) {
      setCampanhas(prev => prev.map(c => c.id === campanhaId ? { ...c, logo_url: data.logo_url } : c))
      flash('Logo actualizado')
    } else {
      flash(data.error || 'Erro no upload', 'err')
    }
    setUploadingLogo(null)
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!pdfs[id]) {
      const res = await authFetch(`/api/campanhas/ficheiros?campanha_id=${id}`).then(r => r.json())
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
      const res = await authFetch('/api/campanhas/ficheiros', { method: 'POST', body: fd })
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
    await authFetch('/api/campanhas/ficheiros', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ficheiroId }) })
    setPdfs(prev => ({ ...prev, [campanhaId]: (prev[campanhaId] ?? []).filter(f => f.id !== ficheiroId) }))
    setCampanhas(prev => prev.map(c => c.id === campanhaId ? { ...c, pdf_count: Math.max(0, (c.pdf_count ?? 1) - 1) } : c))
  }

  const inputStyle = { background: '#fff', border: '1px solid #d1d5db', color: '#1e293b' }
  const currentOps = ALL_OPERADORAS[form.service_type] ?? []

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" >
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4338ca' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-5 max-w-5xl">

            {/* Toast */}
            {msg && (
              <div className="fixed top-20 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg"
                style={{ background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2', color: msg.type === 'ok' ? '#166534' : '#dc2626', border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}` }}>
                {msg.text}
              </div>
            )}

            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5" >
                  <Megaphone size={24} style={{ color: '#0ea5e9' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Campanhas</h1>
                  <p className="text-sm" style={{ color: '#64748b' }}>Gerir campanhas e materiais por operadora</p>
                </div>
              </div>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                {showForm ? <X size={16} /> : <Plus size={16} />}
                {showForm ? 'Cancelar' : 'Nova Campanha'}
              </button>
            </div>

            {/* Formulário criar campanha */}
            {showForm && (
              <form onSubmit={handleCreate} className="rounded-xl p-6 shadow-sm mb-6" >
                <h2 className="font-semibold mb-5" style={{ color: '#1e293b' }}>Nova Campanha</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-sm font-medium" style={{ color: '#475569' }}>Titulo *</label>
                    <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Ex: Campanha Verao MEO 2026" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: '#475569' }}>Servico *</label>
                    <select value={form.service_type} onChange={e => {
                      const s = e.target.value
                      setForm(f => ({ ...f, service_type: s, operator: ALL_OPERADORAS[s]?.[0] ?? '' }))
                    }} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle}>
                      <option value="telecom">Telecomunicacoes</option>
                      <option value="energia">Energia</option>
                      <option value="gas">Gas</option>
                      <option value="seguros">Seguros</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: '#475569' }}>Operadora *</label>
                    <select value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))}
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle}>
                      {currentOps.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-5">
                  <label className="mb-1 block text-sm font-medium" style={{ color: '#475569' }}>Descricao</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none" style={inputStyle} placeholder="Detalhes, condicoes e objectivos da campanha..." />
                </div>
                <button type="submit" disabled={saving} className="rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  {saving ? 'A criar...' : 'Criar Campanha'}
                </button>
              </form>
            )}

            {campanhas.length === 0 && !showForm ? (
              <div className="rounded-xl p-12 text-center shadow-sm" >
                <Megaphone size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium" style={{ color: '#475569' }}>Nenhuma campanha criada</p>
                <p className="text-sm" style={{ color: '#64748b' }}>Crie a primeira campanha para organizar materiais por operadora.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {campanhas.map(c => {
                  const isOpen = expandedId === c.id
                  const campPdfs = pdfs[c.id] || []
                  const svc = SVC_META[c.service_type] ?? SVC_META['telecom']
                  return (
                    <div key={c.id} className="rounded-xl shadow-sm overflow-hidden" >
                      {/* Cabeçalho */}
                      <div className="p-5 flex items-center gap-4">
                        {/* Logo / upload */}
                        <div className="relative group flex-shrink-0">
                          <div className="h-14 w-14 rounded-xl overflow-hidden flex items-center justify-center"
                            style={{ background: svc.bg, border: `1px solid ${svc.color}33` }}>
                            {c.logo_url ? (
                              <Image src={c.logo_url} alt={c.operator} width={56} height={56} className="object-cover w-full h-full" unoptimized />
                            ) : (
                              <Megaphone size={24} style={{ color: svc.color }} />
                            )}
                          </div>
                          <label className="absolute inset-0 flex items-center justify-center rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'rgba(0,0,0,0.45)' }}
                            title="Carregar logo">
                            {uploadingLogo === c.id
                              ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              : <ImagePlus size={18} className="text-white" />
                            }
                            <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg" className="hidden"
                              onChange={e => { if (e.target.files?.[0]) handleLogoUpload(c.id, e.target.files[0]); e.target.value = '' }} />
                          </label>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-sm" style={{ color: '#1e293b' }}>{c.title}</h3>
                            {c.operator && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: svc.bg, color: svc.color }}>{c.operator}</span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: svc.bg, color: svc.color }}>{svc.label}</span>
                          </div>
                          {c.description && <p className="text-xs line-clamp-1" style={{ color: '#64748b' }}>{c.description}</p>}
                          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{c.pdf_count ?? 0} ficheiro{(c.pdf_count ?? 0) !== 1 ? 's' : ''} &middot; {new Date(c.created_at).toLocaleDateString('pt-PT')}</p>
                        </div>

                        {/* Acoes */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Toggle estado */}
                          <button onClick={() => toggleStatus(c)}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                            style={{ background: c.status === 'ativa' ? '#f0fdf4' : '#f9fafb', color: c.status === 'ativa' ? '#16a34a' : '#6b7280', border: `1px solid ${c.status === 'ativa' ? '#bbf7d0' : '#e5e7eb'}` }}>
                            {c.status === 'ativa' ? <Wifi size={12} /> : <WifiOff size={12} />}
                            {c.status === 'ativa' ? 'Activa' : 'Inactiva'}
                          </button>

                          {/* Expandir */}
                          <button onClick={() => toggleExpand(c.id)}
                            className="rounded-lg p-1.5" >
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          {/* Apagar campanha */}
                          <button onClick={() => deleteCampanha(c.id)} disabled={deletingCamp === c.id}
                            className="rounded-lg p-1.5 transition-colors hover:opacity-80 disabled:opacity-40"
                             title="Apagar campanha">
                            <Trash2 size={14} style={{ color: '#dc2626' }} />
                          </button>
                        </div>
                      </div>

                      {/* Ficheiros expandidos */}
                      {isOpen && (
                        <div className="px-5 pb-5" style={{ borderTop: '1px solid #f3f4f6' }}>
                          {c.description && <p className="text-sm py-3" style={{ color: '#64748b' }}>{c.description}</p>}

                          <div className="flex items-center justify-between mb-3 pt-2">
                            <h4 className="text-sm font-semibold" style={{ color: '#475569' }}>
                              Ficheiros <span style={{ color: '#9ca3af' }}>({campPdfs.length})</span>
                            </h4>
                            <label className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer text-white"
                              style={{ background: uploading === c.id ? '#6366f1' : '#4338ca', opacity: uploading === c.id ? 0.7 : 1 }}>
                              <FileUp size={13} />
                              {uploading === c.id ? 'A carregar...' : 'Carregar ficheiro'}
                              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                                multiple disabled={uploading === c.id}
                                onChange={e => handleFileSelect(c.id, e)} className="hidden" />
                            </label>
                          </div>

                          {campPdfs.length === 0 ? (
                            <div className="rounded-lg p-6 text-center" >
                              <FileText size={28} style={{ color: '#d1d5db' }} className="mx-auto mb-2" />
                              <p className="text-sm" style={{ color: '#64748b' }}>Nenhum ficheiro — PDF, Word, Excel, CSV, imagens</p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {campPdfs.map(pdf => (
                                <div key={pdf.id} className="flex items-center justify-between rounded-lg p-3 gap-3"
                                  >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <FileText size={16} style={{ color: pdf.file_type === 'image' ? '#0891b2' : pdf.file_type === 'pdf' ? '#dc2626' : '#6b7280' }} />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate" style={{ color: '#1e293b' }}>{pdf.file_name}</p>
                                      <p className="text-xs" style={{ color: '#9ca3af' }}>{pdf.file_type.toUpperCase()} &middot; {formatSize(pdf.file_size)} &middot; {new Date(pdf.created_at).toLocaleDateString('pt-PT')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {pdf.signed_url && (
                                      <a href={pdf.signed_url} download={pdf.file_name} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                                        >
                                        <Download size={12} /> Download
                                      </a>
                                    )}
                                    {pdf.signed_url && (
                                      <a href={pdf.signed_url} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                                        
                                        title="Abrir em nova aba">
                                        <Download size={12} /> Abrir
                                      </a>
                                    )}
                                    <button onClick={() => deleteFicheiro(c.id, pdf.id)}
                                      className="rounded-lg p-1.5" 
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
