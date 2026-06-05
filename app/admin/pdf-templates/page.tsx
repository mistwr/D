'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { ArrowLeft, Upload, Trash2, Check, X, Eye } from 'lucide-react'
import Link from 'next/link'

interface PdfTemplate {
  id: string
  name: string
  operator: string
  document_type: string
  file_name: string
  has_form_fields: boolean
  active: boolean
  created_at: string
}

const DOCUMENT_TYPES = ['FA', 'Portabilidade', 'Rescisão', 'Outro']
const OPERATORS = ['MEO', 'NOS', 'Vodafone', 'DIGI', 'Endesa', 'Lusitânia', 'EDP', 'Galp', 'Saggas']

export default function PdfTemplatesPage() {
  const { user, authFetch } = useAuth()
  const [templates, setTemplates] = useState<PdfTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    operator: '',
    documentType: '',
  })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/pdf/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (e) {
      console.log('[v0] Erro ao carregar templates:', e)
    }
    setLoading(false)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !formData.name || !formData.operator || !formData.documentType) {
      alert('Preencha todos os campos')
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('name', formData.name)
      form.append('operator', formData.operator)
      form.append('documentType', formData.documentType)

      const res = await authFetch('/api/pdf/templates', {
        method: 'POST',
        body: form,
      })

      if (res.ok) {
        alert('PDF template carregado com sucesso!')
        setFile(null)
        setFormData({ name: '', operator: '', documentType: '' })
        loadTemplates()
      } else {
        alert('Erro ao carregar PDF')
      }
    } catch (e) {
      console.log('[v0] Erro:', e)
      alert('Erro ao fazer upload')
    }
    setUploading(false)
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Tem a certeza que quer apagar este template?')) return

    try {
      const res = await authFetch(`/api/pdf/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadTemplates()
      }
    } catch (e) {
      console.log('[v0] Erro ao apagar:', e)
    }
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Navbar />
        <main className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft size={20} style={{ color: '#64748b' }} />
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Templates PDF</h1>
          </div>

          {/* UPLOAD SECÇÃO */}
          <div className="mb-8 p-6 rounded-lg border" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
            <h2 className="font-semibold mb-4" style={{ color: '#1e293b' }}>Carregar Novo Template</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Nome do Template</label>
                  <input
                    type="text"
                    placeholder="Ex: FA MEO - Abril 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Operadora</label>
                  <select
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <option value="">Selecione</option>
                    {OPERATORS.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Tipo de Documento</label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <option value="">Selecione</option>
                    {DOCUMENT_TYPES.map(dt => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Ficheiro PDF</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 transition hover:opacity-90"
                style={{ background: '#0ea5e9' }}
              >
                <Upload size={16} />
                {uploading ? 'A carregar...' : 'Carregar PDF'}
              </button>
            </form>
          </div>

          {/* TEMPLATES LISTA */}
          <div className="space-y-3">
            <h2 className="font-semibold" style={{ color: '#1e293b' }}>Templates Disponíveis</h2>
            {loading ? (
              <p style={{ color: '#64748b' }}>A carregar templates...</p>
            ) : templates.length === 0 ? (
              <p style={{ color: '#64748b' }}>Nenhum template ainda</p>
            ) : (
              <div className="space-y-2">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="p-4 rounded-lg border flex items-center justify-between"
                    style={{ borderColor: '#e2e8f0', background: template.active ? '#f0f9ff' : '#f5f5f5' }}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium" style={{ color: '#1e293b' }}>{template.name}</h3>
                      <p className="text-sm" style={{ color: '#64748b' }}>
                        {template.operator} • {template.document_type} • {template.file_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {template.active ? (
                        <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: '#d1fae5', color: '#065f46' }}>
                          <Check size={14} /> Ativo
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: '#fee2e2', color: '#991b1b' }}>
                          <X size={14} /> Inativo
                        </span>
                      )}
                      <button
                        onClick={() => window.open(`/api/pdf/templates/${template.id}/download`, '_blank')}
                        className="p-2 hover:bg-slate-200 rounded transition"
                        title="Visualizar template"
                      >
                        <Eye size={16} style={{ color: '#0ea5e9' }} />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 hover:bg-red-100 rounded transition"
                        title="Apagar template"
                      >
                        <Trash2 size={16} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
