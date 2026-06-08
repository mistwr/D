'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { ArrowLeft, Upload, Trash2, Check, X, Eye } from 'lucide-react'
import Link from 'next/link'

interface PdfTemplate {
  id: string
  nome: string
  operadora: string
  tipo: string
  file_name: string
  ativo: boolean
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
        alert('Erro ao carregar PDF: ' + res.status)
      }
    } catch (e) {
      console.log('[v0] Erro:', e)
      alert('Erro ao fazer upload: ' + (e as Error).message)
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
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 md:ml-64 pt-14 md:pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-6 max-w-5xl">

            {/* Header */}
            <div className="mb-5 flex items-center gap-2">
              <Link href="/admin" className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                <ArrowLeft size={18} style={{ color: '#64748b' }} />
              </Link>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#1e293b' }}>Templates PDF</h1>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Gerir templates de documentos por operadora</p>
              </div>
            </div>

            {/* Upload form */}
            <div className="mb-5 rounded-xl border bg-white p-4" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#1e293b' }}>Carregar Novo Template</h2>
              <form onSubmit={handleUpload}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Nome</label>
                    <input
                      type="text"
                      placeholder="Ex: FA MEO - Abril 2024"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-sm border rounded-lg"
                      style={{ borderColor: '#e2e8f0', color: '#1e293b' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Operadora</label>
                    <select
                      value={formData.operator}
                      onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-sm border rounded-lg"
                      style={{ borderColor: '#e2e8f0', color: '#1e293b' }}
                    >
                      <option value="">Selecione</option>
                      {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Tipo</label>
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-sm border rounded-lg"
                      style={{ borderColor: '#e2e8f0', color: '#1e293b' }}
                    >
                      <option value="">Selecione</option>
                      {DOCUMENT_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Ficheiro PDF</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full px-2.5 py-1.5 text-sm border rounded-lg"
                      style={{ borderColor: '#e2e8f0' }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white flex items-center gap-1.5 transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#0ea5e9' }}
                >
                  <Upload size={14} />
                  {uploading ? 'A carregar...' : 'Carregar PDF'}
                </button>
              </form>
            </div>

            {/* Templates list */}
            <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
                <h2 className="text-sm font-semibold" style={{ color: '#1e293b' }}>Templates Disponíveis</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  {templates.length} total
                </span>
              </div>

              {loading ? (
                <div className="p-6 text-center text-sm" style={{ color: '#64748b' }}>A carregar templates...</div>
              ) : templates.length === 0 ? (
                <div className="p-6 text-center text-sm" style={{ color: '#64748b' }}>Nenhum template carregado ainda.</div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium uppercase tracking-wide" style={{ background: '#f8fafc', color: '#64748b' }}>
                    <div className="col-span-4">Nome</div>
                    <div className="col-span-2">Operadora</div>
                    <div className="col-span-2">Tipo</div>
                    <div className="col-span-2">Estado</div>
                    <div className="col-span-2 text-right">Ações</div>
                  </div>
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-slate-50 transition"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <p className="text-sm font-medium truncate" style={{ color: '#1e293b' }}>{template.nome}</p>
                        <p className="text-xs truncate mt-0.5 sm:hidden" style={{ color: '#64748b' }}>{template.operadora} • {template.tipo}</p>
                        <p className="text-xs truncate mt-0.5 hidden sm:block" style={{ color: '#94a3b8' }}>{template.file_name}</p>
                      </div>
                      <div className="hidden sm:block col-span-2 text-sm" style={{ color: '#475569' }}>{template.operadora}</div>
                      <div className="hidden sm:block col-span-2 text-sm" style={{ color: '#475569' }}>{template.tipo}</div>
                      <div className="hidden sm:block col-span-2">
                        {template.ativo ? (
                          <span className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: '#d1fae5', color: '#065f46' }}>
                            <Check size={11} /> Ativo
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: '#fee2e2', color: '#991b1b' }}>
                            <X size={11} /> Inativo
                          </span>
                        )}
                      </div>
                      <div className="col-span-12 sm:col-span-2 flex items-center gap-1 sm:justify-end">
                        <button
                          onClick={() => window.open(`/api/pdf/templates/${template.id}/download`, '_blank')}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                          title="Visualizar"
                        >
                          <Eye size={15} style={{ color: '#0ea5e9' }} />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition"
                          title="Apagar"
                        >
                          <Trash2 size={15} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
