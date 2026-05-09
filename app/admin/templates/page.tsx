'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/sidebar'
import { FileText, Upload, Trash2, Plus, X, Settings } from 'lucide-react'

interface Template {
  id: string
  nome: string
  tipo: string
  operadora: string
  servico: string
  file_path: string
  file_name: string
  campos_mapeados: Record<string, string>
  ativo: boolean
  created_at: string
}

const TIPOS = ['adesao', 'portabilidade', 'contrato', 'outro']
const SERVICOS = ['telecom', 'energia', 'gas', 'seguros']
const OPERADORAS = ['MEO', 'NOS', 'Vodafone', 'NOWO', 'EDP', 'Endesa', 'Iberdrola', 'Galp', 'Goldenergy', 'Outro']

const CAMPOS_DISPONIVEIS = [
  { key: 'client_name', label: 'Nome do Cliente' },
  { key: 'client_nif', label: 'NIF' },
  { key: 'client_cc', label: 'CC' },
  { key: 'client_phone', label: 'Telefone' },
  { key: 'client_email', label: 'Email' },
  { key: 'client_address', label: 'Morada' },
  { key: 'client_iban', label: 'IBAN' },
  { key: 'plano', label: 'Plano' },
  { key: 'operator', label: 'Operadora' },
  { key: 'cpe', label: 'CPE' },
  { key: 'cui', label: 'CUI' },
  { key: 'potencia', label: 'Potencia' },
  { key: 'data', label: 'Data Actual' },
]

export default function TemplatesPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    tipo: 'adesao',
    operadora: '',
    servico: 'telecom',
    file_path: '',
    file_name: '',
    campos_mapeados: {} as Record<string, string>,
  })

  useEffect(() => {
    if (user) loadTemplates()
  }, [user])

  async function loadTemplates() {
    const res = await authFetch('/api/pdf-templates')
    const data = await res.json()
    setTemplates(data.templates || [])
    setLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'templates')
    
    const res = await authFetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    
    const data = await res.json()
    if (data.path) {
      setForm(f => ({ ...f, file_path: data.path, file_name: file.name }))
    }
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const method = editingTemplate ? 'PATCH' : 'POST'
    const body = editingTemplate ? { ...form, id: editingTemplate.id } : form
    
    await authFetch('/api/pdf-templates', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    loadTemplates()
    closeForm()
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja desativar este template?')) return
    await authFetch(`/api/pdf-templates?id=${id}`, { method: 'DELETE' })
    loadTemplates()
  }

  function openEdit(t: Template) {
    setEditingTemplate(t)
    setForm({
      nome: t.nome,
      tipo: t.tipo,
      operadora: t.operadora || '',
      servico: t.servico || 'telecom',
      file_path: t.file_path,
      file_name: t.file_name,
      campos_mapeados: t.campos_mapeados || {},
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingTemplate(null)
    setForm({ nome: '', tipo: 'adesao', operadora: '', servico: 'telecom', file_path: '', file_name: '', campos_mapeados: {} })
  }

  function updateCampo(key: string, value: string) {
    setForm(f => ({
      ...f,
      campos_mapeados: { ...f.campos_mapeados, [key]: value }
    }))
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9fafb' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  }

  const inp = { border: '1px solid #e5e7eb', background: '#fff', color: '#111827' }

  return (
    <div className="min-h-screen flex" style={{ background: '#f9fafb' }}>
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <div className="p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Templates PDF</h1>
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Gira os templates para geracao automatica de documentos</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white transition hover:opacity-90"
              style={{ background: '#4f46e5' }}
            >
              <Plus size={18} /> Novo Template
            </button>
          </div>

          {/* Lista de Templates */}
          <div className="grid gap-4">
            {templates.map(t => (
              <div key={t.id} className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ background: '#eef2ff' }}>
                      <FileText size={24} style={{ color: '#4f46e5' }} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#111827' }}>{t.nome}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#dbeafe', color: '#1e40af' }}>{t.tipo}</span>
                        {t.operadora && <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#fef3c7', color: '#92400e' }}>{t.operadora}</span>}
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#d1fae5', color: '#065f46' }}>{t.servico}</span>
                      </div>
                      <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>{t.file_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(t)} className="p-2 rounded-lg transition hover:opacity-70" style={{ background: '#f3f4f6' }}>
                      <Settings size={16} style={{ color: '#374151' }} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg transition hover:opacity-70" style={{ background: '#fef2f2' }}>
                      <Trash2 size={16} style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="text-center py-12 rounded-xl" style={{ background: '#fff', border: '1px dashed #d1d5db' }}>
                <FileText size={48} className="mx-auto mb-4" style={{ color: '#d1d5db' }} />
                <p style={{ color: '#6b7280' }}>Nenhum template criado</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl" style={{ background: '#fff' }}>
              <div className="sticky top-0 flex items-center justify-between p-5 border-b" style={{ background: '#fff', borderColor: '#e5e7eb' }}>
                <h2 className="text-lg font-bold" style={{ color: '#111827' }}>
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </h2>
                <button onClick={closeForm} className="p-2 rounded-lg transition hover:opacity-70" style={{ background: '#f3f4f6' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Nome do Template *</label>
                  <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} required placeholder="Ex: Contrato Adesao MEO" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Tipo *</label>
                    <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}>
                      {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Servico *</label>
                    <select value={form.servico} onChange={e => setForm(f => ({ ...f, servico: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}>
                      {SERVICOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Operadora</label>
                  <select value={form.operadora} onChange={e => setForm(f => ({ ...f, operadora: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}>
                    <option value="">Todas</option>
                    {OPERADORAS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Ficheiro PDF *</label>
                  {form.file_name ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#f3f4f6' }}>
                      <FileText size={20} style={{ color: '#4f46e5' }} />
                      <span className="text-sm flex-1" style={{ color: '#374151' }}>{form.file_name}</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, file_path: '', file_name: '' }))}
                        className="text-xs px-2 py-1 rounded" style={{ color: '#dc2626' }}>Remover</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 rounded-lg cursor-pointer transition hover:opacity-80"
                      style={{ border: '2px dashed #d1d5db', background: '#fafafa' }}>
                      <Upload size={32} style={{ color: '#9ca3af' }} />
                      <span className="text-sm mt-2" style={{ color: '#6b7280' }}>
                        {uploading ? 'A carregar...' : 'Clique para carregar PDF'}
                      </span>
                      <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Mapeamento de Campos</label>
                  <p className="text-xs mb-3" style={{ color: '#6b7280' }}>
                    Configure como os dados da venda preenchem o PDF. Indique o nome do campo no PDF para cada dado.
                  </p>
                  <div className="grid gap-2">
                    {CAMPOS_DISPONIVEIS.map(c => (
                      <div key={c.key} className="flex items-center gap-3">
                        <span className="w-32 text-xs font-medium" style={{ color: '#6b7280' }}>{c.label}</span>
                        <input type="text" value={form.campos_mapeados[c.key] || ''}
                          onChange={e => updateCampo(c.key, e.target.value)}
                          className="flex-1 rounded-lg px-3 py-1.5 text-sm" style={inp}
                          placeholder={`Nome do campo no PDF para ${c.label}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeForm}
                    className="flex-1 rounded-lg py-2.5 font-medium transition hover:opacity-80"
                    style={{ background: '#f3f4f6', color: '#374151' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={!form.nome || !form.file_path}
                    className="flex-1 rounded-lg py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#4f46e5' }}>
                    {editingTemplate ? 'Guardar Alteracoes' : 'Criar Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
