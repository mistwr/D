'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  FolderOpen, Plus, Wifi, WifiOff, FileUp, FileText, Zap, Flame,
  ChevronDown, ChevronUp, Trash2, Download, Shield, X, ClipboardList
} from 'lucide-react'

interface CategoriaFile { id: string; file_name: string; file_type: string; file_size: number; signed_url: string | null; created_at: string }
interface Categoria { id: string; title: string; tipo: string; description: string; status: string; created_at: string; file_count: number }

const TIPOS = [
  { value: 'fa', label: 'Formulários de Adesão' },
  { value: 'portabilidade', label: 'Portabilidade' },
  { value: 'apoio', label: 'Material de Apoio' },
  { value: 'energia', label: 'Energia' },
  { value: 'gas', label: 'Gás' },
  { value: 'telecom', label: 'Telecomunicações' },
  { value: 'seguros', label: 'Seguros' },
]

const TIPO_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  fa:           { label: 'FA',            color: '#0ea5e9', bg: '#eef2ff', icon: ClipboardList },
  portabilidade:{ label: 'Portabilidade', color: '#2563eb', bg: '#eff6ff', icon: Wifi },
  apoio:        { label: 'Apoio',         color: '#16a34a', bg: '#f0fdf4', icon: FolderOpen },
  energia:      { label: 'Energia',       color: '#d97706', bg: '#fef3c7', icon: Zap },
  gas:          { label: 'Gás',           color: '#dc2626', bg: '#fee2e2', icon: Flame },
  telecom:      { label: 'Telecom',       color: '#2563eb', bg: '#eff6ff', icon: Wifi },
  seguros:      { label: 'Seguros',       color: '#16a34a', bg: '#f0fdf4', icon: Shield },
}

function formatSize(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MateriaisAdminPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', tipo: 'fa', description: '' })
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [files, setFiles] = useState<Record<string, CategoriaFile[]>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [deletingCat, setDeletingCat] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)

  function flash(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  useEffect(() => {
    if (!user) return
    authFetch('/api/materiais').then(r => r.json())
      .then(c => { setCategorias(c.categorias || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user, authFetch])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const res = await authFetch('/api/materiais', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (data.categoria) {
      setCategorias(prev => [{ ...data.categoria, file_count: 0 }, ...prev])
      setShowForm(false)
      setForm({ title: '', tipo: 'fa', description: '' })
      flash('Categoria criada')
    } else {
      flash(data.error || 'Erro ao criar', 'err')
    }
    setSaving(false)
  }

  async function toggleStatus(c: Categoria) {
    const newStatus = c.status === 'ativa' ? 'inativa' : 'ativa'
    const res = await authFetch('/api/materiais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, status: newStatus }) })
    if (res.ok) setCategorias(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
  }

  async function deleteCategoria(id: string) {
    if (!confirm('Apagar categoria e todos os seus ficheiros?')) return
    setDeletingCat(id)
    await authFetch('/api/materiais', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setCategorias(prev => prev.filter(c => c.id !== id))
    if (expandedId === id) setExpandedId(null)
    setDeletingCat(null)
    flash('Categoria apagada')
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!files[id]) {
      const res = await authFetch(`/api/materiais/ficheiros?categoria_id=${id}`).then(r => r.json())
      setFiles(prev => ({ ...prev, [id]: res.ficheiros || [] }))
    }
  }

  async function handleFileSelect(categoriaId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    setUploading(categoriaId)
    for (let i = 0; i < fileList.length; i++) {
      const fd = new FormData()
      fd.append('categoria_id', categoriaId)
      fd.append('file', fileList[i])
      const res = await authFetch('/api/materiais/ficheiros', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ficheiro) {
        setFiles(prev => ({ ...prev, [categoriaId]: [data.ficheiro, ...(prev[categoriaId] ?? [])] }))
        setCategorias(prev => prev.map(c => c.id === categoriaId ? { ...c, file_count: (c.file_count ?? 0) + 1 } : c))
      }
    }
    setUploading(null)
    e.target.value = ''
  }

  async function deleteFicheiro(categoriaId: string, ficheiroId: string) {
    await authFetch('/api/materiais/ficheiros', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ficheiroId }) })
    setFiles(prev => ({ ...prev, [categoriaId]: (prev[categoriaId] ?? []).filter(f => f.id !== ficheiroId) }))
    setCategorias(prev => prev.map(c => c.id === categoriaId ? { ...c, file_count: Math.max(0, (c.file_count ?? 1) - 1) } : c))
  }

  const inputStyle = { background: '#fff', border: '1px solid #d1d5db', color: '#1e293b' }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8f9fb' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4338ca' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      <Navbar user={user} />
      <div>
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="pt-16 lg:ml-64 min-h-screen overflow-x-hidden">
          <div className="p-4 md:p-5 max-w-6xl mx-auto">

            {/* Toast */}
            {msg && (
              <div className="fixed top-20 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg"
                style={{ background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2', color: msg.type === 'ok' ? '#166534' : '#dc2626', border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}` }}>
                {msg.text}
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1.5" style={{ background: '#eef2ff' }}>
                  <FolderOpen size={18} style={{ color: '#0ea5e9' }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: '#1e293b' }}>{"FA's e Material de Apoio"}</h1>
                  <p className="text-xs" style={{ color: '#64748b' }}>Gerir formulários, portabilidade e materiais</p>
                </div>
              </div>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-white text-xs"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                {showForm ? <X size={14} /> : <Plus size={14} />}
                {showForm ? 'Cancelar' : 'Nova Categoria'}
              </button>
            </div>

            {/* Formulário criar categoria */}
            {showForm && (
              <form onSubmit={handleCreate} className="rounded-lg p-4 shadow-sm mb-4" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <h2 className="font-semibold mb-3 text-sm" style={{ color: '#1e293b' }}>Nova Categoria de Material</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-2.5">
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-medium" style={{ color: '#475569' }}>Título *</label>
                    <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                      className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle} placeholder="Ex: FA MEO Fibra, Portabilidade Móvel..." />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium" style={{ color: '#475569' }}>Tipo *</label>
                    <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-xs outline-none" style={inputStyle}>
                      {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium" style={{ color: '#475569' }}>Descrição</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none" style={inputStyle} placeholder="Detalhes sobre os materiais desta categoria..." />
                </div>
                <button type="submit" disabled={saving} className="rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  {saving ? 'A criar...' : 'Criar Categoria'}
                </button>
              </form>
            )}

            {categorias.length === 0 && !showForm ? (
              <div className="rounded-lg p-8 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <FolderOpen size={40} style={{ color: '#d1d5db' }} className="mx-auto mb-3" />
                <p className="text-sm font-medium" style={{ color: '#475569' }}>Nenhuma categoria criada</p>
                <p className="text-xs" style={{ color: '#64748b' }}>Crie a primeira categoria para organizar os materiais de apoio.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {categorias.map(c => {
                  const isOpen = expandedId === c.id
                  const catFiles = files[c.id] || []
                  const tipoMeta = TIPO_META[c.tipo] ?? TIPO_META['apoio']
                  const TipoIcon = tipoMeta.icon
                  return (
                    <div key={c.id} className="rounded-lg shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                      {/* Cabeçalho */}
                      <div className="p-3 flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                          style={{ background: tipoMeta.bg, border: `1px solid ${tipoMeta.color}33` }}>
                          <TipoIcon size={18} style={{ color: tipoMeta.color }} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <h3 className="font-bold text-sm" style={{ color: '#1e293b' }}>{c.title}</h3>
                            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: tipoMeta.bg, color: tipoMeta.color }}>{tipoMeta.label}</span>
                          </div>
                          {c.description && <p className="text-xs line-clamp-1" style={{ color: '#64748b' }}>{c.description}</p>}
                          <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{c.file_count ?? 0} ficheiro{(c.file_count ?? 0) !== 1 ? 's' : ''} &middot; {new Date(c.created_at).toLocaleDateString('pt-PT')}</p>
                        </div>

                        {/* Acoes */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => toggleStatus(c)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium"
                            style={{ background: c.status === 'ativa' ? '#f0fdf4' : '#f9fafb', color: c.status === 'ativa' ? '#16a34a' : '#6b7280', border: `1px solid ${c.status === 'ativa' ? '#bbf7d0' : '#e5e7eb'}` }}>
                            {c.status === 'ativa' ? <Wifi size={11} /> : <WifiOff size={11} />}
                            {c.status === 'ativa' ? 'Activa' : 'Inactiva'}
                          </button>

                          <button onClick={() => toggleExpand(c.id)}
                            className="rounded-lg p-1" style={{ background: '#f8fafc', color: '#475569' }}>
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          <button onClick={() => deleteCategoria(c.id)} disabled={deletingCat === c.id}
                            className="rounded-lg p-1 transition-colors hover:opacity-80 disabled:opacity-40"
                            style={{ background: '#fef2f2' }} title="Apagar categoria">
                            <Trash2 size={12} style={{ color: '#dc2626' }} />
                          </button>
                        </div>
                      </div>

                      {/* Ficheiros expandidos */}
                      {isOpen && (
                        <div className="px-3 pb-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                          {c.description && <p className="text-xs py-1.5" style={{ color: '#64748b' }}>{c.description}</p>}

                          <div className="flex items-center justify-between mb-1.5 pt-1">
                            <h4 className="text-xs font-semibold" style={{ color: '#475569' }}>
                              Ficheiros <span style={{ color: '#9ca3af' }}>({catFiles.length})</span>
                            </h4>
                            <label className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer text-white"
                              style={{ background: uploading === c.id ? '#6366f1' : '#4338ca', opacity: uploading === c.id ? 0.7 : 1 }}>
                              <FileUp size={11} />
                              {uploading === c.id ? 'A carregar...' : 'Carregar ficheiro'}
                              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                                multiple disabled={uploading === c.id}
                                onChange={e => handleFileSelect(c.id, e)} className="hidden" />
                            </label>
                          </div>

                          {catFiles.length === 0 ? (
                            <div className="rounded-lg p-4 text-center" style={{ background: '#f9fafb', border: '1px dashed #d1d5db' }}>
                              <FileText size={24} style={{ color: '#d1d5db' }} className="mx-auto mb-2" />
                              <p className="text-xs" style={{ color: '#64748b' }}>Nenhum ficheiro — PDF, Word, Excel, CSV, imagens</p>
                            </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                              {catFiles.map(f => (
                                <div key={f.id} className="flex items-center justify-between rounded-lg p-2 gap-2"
                                  style={{ background: '#f9fafb', border: '1px solid #e2e8f0' }}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText size={14} style={{ color: f.file_type === 'image' ? '#0891b2' : f.file_type === 'pdf' ? '#dc2626' : '#6b7280' }} />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium truncate" style={{ color: '#1e293b' }}>{f.file_name}</p>
                                      <p className="text-xs" style={{ color: '#9ca3af' }}>{f.file_type.toUpperCase()} &middot; {formatSize(f.file_size)} &middot; {new Date(f.created_at).toLocaleDateString('pt-PT')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {f.signed_url && (
                                      <a href={f.signed_url} download={f.file_name} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-xs font-medium"
                                        style={{ background: '#f0fdf4', color: '#166534' }}>
                                        <Download size={11} />
                                      </a>
                                    )}
                                    <button onClick={() => deleteFicheiro(c.id, f.id)}
                                      className="rounded-lg p-0.5 hover:opacity-70" style={{ background: '#fef2f2' }}>
                                      <Trash2 size={11} style={{ color: '#dc2626' }} />
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
