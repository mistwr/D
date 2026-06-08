'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Plus, Edit, Trash2, X, Save, ChevronDown, ChevronUp, FileText } from 'lucide-react'

interface DocumentTemplate {
  id: string
  operator_name: string
  template_type: string
  template_name: string
  template_content: string
  fields_mapping: Record<string, any>
  created_at: string
  created_by: string
}

const OPERADORAS = ['MEO', 'NOS', 'VODAFONE', 'DIGI', 'EDP', 'GALP', 'OUTRO']
const TEMPLATE_TYPES = ['FA', 'Portabilidade', 'Rescisao', 'Paineis_Solares']

const PLACEHOLDERS = [
  { label: 'Nome do Cliente', placeholder: '{{nome_cliente}}' },
  { label: 'NIF', placeholder: '{{nif}}' },
  { label: 'Morada', placeholder: '{{morada}}' },
  { label: 'Telefone', placeholder: '{{telefone}}' },
  { label: 'Email', placeholder: '{{email}}' },
  { label: 'Operadora', placeholder: '{{operadora}}' },
  { label: 'Serviço', placeholder: '{{servico}}' },
  { label: 'Data da Venda', placeholder: '{{data_venda}}' },
  { label: 'Vendedor', placeholder: '{{vendedor}}' },
  { label: 'Parceiro', placeholder: '{{parceiro}}' },
]

export default function DocumentTemplatesPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    operator_name: 'MEO',
    template_type: 'FA',
    template_name: '',
    template_content: '',
  })
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function flash(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  useEffect(() => {
    if (!user) return
    loadTemplates()
  }, [user])

  async function loadTemplates() {
    try {
      const res = await authFetch('/api/document-templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch {
      flash('Erro ao carregar templates', 'err')
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.template_name.trim() || !form.template_content.trim()) {
      flash('Preenchimento obrigatório', 'err')
      return
    }

    setSaving(true)
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { id: editing, ...form } : form

    try {
      const res = await authFetch('/api/document-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (res.ok) {
        if (editing) {
          setTemplates(prev => prev.map(t => t.id === editing ? data : t))
          flash('Template atualizado')
        } else {
          setTemplates(prev => [data, ...prev])
          flash('Template criado')
        }
        resetForm()
      } else {
        flash(data.error || 'Erro ao guardar', 'err')
      }
    } catch (err) {
      flash('Erro ao guardar', 'err')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar este template?')) return
    try {
      await authFetch(`/api/document-templates?id=${id}`, { method: 'DELETE' })
      setTemplates(prev => prev.filter(t => t.id !== id))
      flash('Template apagado')
    } catch {
      flash('Erro ao apagar', 'err')
    }
  }

  function resetForm() {
    setForm({ operator_name: 'MEO', template_type: 'FA', template_name: '', template_content: '' })
    setShowForm(false)
    setEditing(null)
  }

  function startEdit(t: DocumentTemplate) {
    setForm({
      operator_name: t.operator_name,
      template_type: t.template_type,
      template_name: t.template_name,
      template_content: t.template_content,
    })
    setEditing(t.id)
    setShowForm(true)
  }

  function insertPlaceholder(placeholder: string) {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const newContent = form.template_content.slice(0, start) + placeholder + form.template_content.slice(end)
      setForm({ ...form, template_content: newContent })
    }
  }

  if (authLoading || loading) return <div className="p-4">A carregar...</div>

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} />
        <div className="w-full overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold" style={{ color: '#1e293b' }}>Templates de Documentos</h1>
              <button
                onClick={() => { resetForm(); setShowForm(true) }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                <Plus size={18} /> Novo Template
              </button>
            </div>

            {msg && (
              <div className="mb-4 p-4 rounded-lg" style={{
                background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${msg.type === 'ok' ? '#86efac' : '#fecaca'}`,
                color: msg.type === 'ok' ? '#166534' : '#b91c1c'
              }}>
                {msg.text}
              </div>
            )}

            {showForm && (
              <div className="mb-6 rounded-xl shadow-sm p-6" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: '#1e293b' }}>
                    {editing ? 'Editar Template' : 'Novo Template'}
                  </h2>
                  <button onClick={resetForm} className="p-1"><X size={20} style={{ color: '#64748b' }} /></button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Operadora</label>
                      <select value={form.operator_name} onChange={e => setForm({ ...form, operator_name: e.target.value })}
                        disabled={!!editing}
                        className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#d1d5db', color: '#1e293b' }}>
                        {OPERADORAS.map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Tipo de Documento</label>
                      <select value={form.template_type} onChange={e => setForm({ ...form, template_type: e.target.value })}
                        disabled={!!editing}
                        className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#d1d5db', color: '#1e293b' }}>
                        {TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Nome do Template</label>
                    <input type="text" value={form.template_name} onChange={e => setForm({ ...form, template_name: e.target.value })}
                      placeholder="ex: FA Padrão MEO"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: '#d1d5db', color: '#1e293b' }} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium" style={{ color: '#475569' }}>Conteúdo do Template (HTML)</label>
                      <details className="text-xs">
                        <summary style={{ color: '#0284c7', cursor: 'pointer' }}>Ver placeholders</summary>
                        <div className="mt-2 space-y-1 p-2 bg-blue-50 rounded">
                          {PLACEHOLDERS.map(p => (
                            <button key={p.placeholder} type="button"
                              onClick={() => insertPlaceholder(p.placeholder)}
                              className="block w-full text-left px-2 py-1 text-xs rounded hover:bg-blue-100"
                              style={{ color: '#0284c7' }}>
                              {p.label}: <code>{p.placeholder}</code>
                            </button>
                          ))}
                        </div>
                      </details>
                    </div>
                    <textarea id="template-content" value={form.template_content} onChange={e => setForm({ ...form, template_content: e.target.value })}
                      placeholder="Insira o HTML do template com {{placeholders}}"
                      rows={10}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm font-mono" style={{ borderColor: '#d1d5db', color: '#1e293b' }} />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                      <Save size={16} /> {saving ? 'A guardar...' : 'Guardar'}
                    </button>
                    <button type="button" onClick={resetForm}
                      className="px-4 py-2.5 rounded-lg font-medium" style={{ background: '#f1f5f9', color: '#475569' }}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#64748b' }}>
                  <FileText size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhum template criado ainda</p>
                </div>
              ) : (
                templates.map(t => (
                  <div key={t.id} className="rounded-xl shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                      <div className="flex items-center gap-3">
                        {expandedId === t.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        <div>
                          <p className="font-semibold" style={{ color: '#1e293b' }}>{t.template_name}</p>
                          <p className="text-xs" style={{ color: '#64748b' }}>{t.operator_name} • {t.template_type}</p>
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => startEdit(t)} className="p-2 rounded-lg hover:bg-blue-50">
                          <Edit size={18} style={{ color: '#0284c7' }} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-red-50">
                          <Trash2 size={18} style={{ color: '#dc2626' }} />
                        </button>
                      </div>
                    </div>

                    {expandedId === t.id && (
                      <div className="px-4 pb-4 border-t" style={{ borderColor: '#e2e8f0' }}>
                        <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm font-mono overflow-auto max-h-48"
                          style={{ color: '#1e293b' }}>
                          <pre>{t.template_content.substring(0, 500)}{t.template_content.length > 500 ? '...' : ''}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
