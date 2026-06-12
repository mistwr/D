'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { Users, Plus, Search, Upload, X, CheckCircle, Phone, Mail, Building2, Calendar } from 'lucide-react'

interface Lead {
  id: string
  nome: string
  email: string
  telefone: string
  empresa: string
  nif: string
  morada: string
  cidade: string
  servico: string
  operadora: string
  notas: string
  score: number
  convertido: boolean
  created_at: string
  pipelines?: { nome: string; cor: string }
  pipeline_estados?: { nome: string; cor: string }
}

export default function LeadsParceiroPage() {
  const { user, authFetch } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null)
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', empresa: '', nif: '',
    morada: '', cidade: '', servico: '', operadora: '', notas: ''
  })

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/leads')
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
    } catch (e) {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSaving(true)
    try {
      await authFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setForm({ nome: '', email: '', telefone: '', empresa: '', nif: '', morada: '', cidade: '', servico: '', operadora: '', notas: '' })
      setShowAdd(false)
      fetchLeads()
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = (e.currentTarget.elements.namedItem('file') as HTMLInputElement)
    const file = input?.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await authFetch('/api/leads/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setUploadResult({ success: true, message: `${data.successRows} leads importadas com sucesso de ${data.totalRows} linhas.` })
        fetchLeads()
      } else {
        setUploadResult({ success: false, message: data.error || 'Erro ao importar ficheiro.' })
      }
    } catch {
      setUploadResult({ success: false, message: 'Erro de rede ao importar.' })
    } finally {
      setUploading(false)
    }
  }

  const filtered = leads.filter(l =>
    l.nome?.toLowerCase().includes(search.toLowerCase()) ||
    l.empresa?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.telefone?.includes(search)
  )

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="flex-1 md:ml-64 pt-14 md:pt-16">
          <div className="p-4 md:p-6 max-w-6xl">

            {/* Header */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#1e293b' }}>As Minhas Leads</h1>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{leads.length} leads registadas</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition hover:bg-slate-50"
                  style={{ borderColor: '#e2e8f0', color: '#475569' }}
                >
                  <Upload size={15} /> Importar Ficheiro
                </button>
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
                  style={{ background: '#0066cc' }}
                >
                  <Plus size={15} /> Nova Lead
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Pesquisar por nome, empresa, email ou telefone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg bg-white"
                style={{ borderColor: '#e2e8f0', color: '#1e293b' }}
              />
            </div>

            {/* Leads list */}
            <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              {loading ? (
                <div className="p-8 text-center text-sm" style={{ color: '#64748b' }}>A carregar leads...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <Users size={32} className="mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                  <p className="text-sm font-medium" style={{ color: '#64748b' }}>
                    {search ? 'Nenhuma lead encontrada para essa pesquisa.' : 'Ainda não tens leads. Adiciona a primeira!'}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b" style={{ background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}>
                    <div className="col-span-3">Nome / Empresa</div>
                    <div className="col-span-3">Contacto</div>
                    <div className="col-span-2">Serviço</div>
                    <div className="col-span-2">Operadora</div>
                    <div className="col-span-1">Score</div>
                    <div className="col-span-1">Data</div>
                  </div>
                  <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                    {filtered.map(lead => (
                      <div key={lead.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-slate-50 transition">
                        <div className="col-span-12 sm:col-span-3">
                          <p className="text-sm font-medium" style={{ color: '#1e293b' }}>{lead.nome}</p>
                          {lead.empresa && (
                            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#64748b' }}>
                              <Building2 size={11} /> {lead.empresa}
                            </p>
                          )}
                        </div>
                        <div className="hidden sm:block col-span-3 space-y-0.5">
                          {lead.email && <p className="text-xs flex items-center gap-1 truncate" style={{ color: '#475569' }}><Mail size={11} />{lead.email}</p>}
                          {lead.telefone && <p className="text-xs flex items-center gap-1" style={{ color: '#475569' }}><Phone size={11} />{lead.telefone}</p>}
                        </div>
                        <div className="hidden sm:block col-span-2 text-xs" style={{ color: '#475569' }}>{lead.servico || '—'}</div>
                        <div className="hidden sm:block col-span-2 text-xs" style={{ color: '#475569' }}>{lead.operadora || '—'}</div>
                        <div className="hidden sm:block col-span-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: lead.score >= 60 ? '#d1fae5' : '#f1f5f9', color: lead.score >= 60 ? '#065f46' : '#475569' }}>
                            {lead.score ?? 0}
                          </span>
                        </div>
                        <div className="hidden sm:flex col-span-1 items-center gap-1 text-xs" style={{ color: '#94a3b8' }}>
                          <Calendar size={11} />
                          {new Date(lead.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Nova Lead */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="font-semibold text-base" style={{ color: '#1e293b' }}>Nova Lead</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Nome *</label>
                  <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0' }} placeholder="Nome completo" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Telefone</label>
                  <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Empresa</label>
                  <input value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>NIF</label>
                  <input value={form.nif} onChange={e => setForm({ ...form, nif: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Serviço</label>
                  <select value={form.servico} onChange={e => setForm({ ...form, servico: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0' }}>
                    <option value="">Selecione</option>
                    <option value="Telecomunicacoes">Telecomunicações</option>
                    <option value="Energia">Energia</option>
                    <option value="Gas">Gás</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Operadora</label>
                  <input value={form.operadora} onChange={e => setForm({ ...form, operadora: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0' }} placeholder="Ex: MEO, NOS, EDP..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Morada</label>
                  <input value={form.morada} onChange={e => setForm({ ...form, morada: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Cidade</label>
                  <input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0' }} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#475569' }}>Notas</label>
                  <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm border rounded-lg resize-none" style={{ borderColor: '#e2e8f0' }} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0', color: '#475569' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60" style={{ background: '#0066cc' }}>
                  {saving ? 'A guardar...' : 'Guardar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload Ficheiro */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="font-semibold text-base" style={{ color: '#1e293b' }}>Importar Leads</h2>
              <button onClick={() => { setShowUpload(false); setUploadResult(null) }} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-4">
              <p className="text-xs mb-4" style={{ color: '#64748b' }}>
                Carrega um ficheiro <strong>Excel (.xlsx)</strong> ou <strong>CSV (.csv)</strong> com as colunas:<br />
                <span className="font-mono text-xs" style={{ color: '#0066cc' }}>nome, email, telefone, empresa, nif, morada, cidade, servico, operadora, notas</span>
              </p>
              <form onSubmit={handleUpload} className="space-y-3">
                <input
                  name="file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  required
                  className="w-full text-sm border rounded-lg px-3 py-2"
                  style={{ borderColor: '#e2e8f0' }}
                />
                {uploadResult && (
                  <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: uploadResult.success ? '#d1fae5' : '#fee2e2', color: uploadResult.success ? '#065f46' : '#991b1b' }}>
                    {uploadResult.success ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <X size={16} className="shrink-0 mt-0.5" />}
                    {uploadResult.message}
                  </div>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowUpload(false); setUploadResult(null) }} className="flex-1 py-2 text-sm border rounded-lg" style={{ borderColor: '#e2e8f0', color: '#475569' }}>Fechar</button>
                  <button type="submit" disabled={uploading} className="flex-1 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60" style={{ background: '#0066cc' }}>
                    {uploading ? 'A importar...' : 'Importar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
