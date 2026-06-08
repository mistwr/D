'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { Users, Plus, Search, Filter, ArrowUpDown, Phone, Mail, Building2, Target, TrendingUp, UserPlus, ChevronRight, MoreHorizontal, X } from 'lucide-react'

interface Lead {
  id: string
  nome: string
  email: string
  telefone: string
  empresa: string
  nif: string
  score: number
  interesse: string
  pipeline_id: string
  estado_id: string
  atribuido_a: string
  unidade_id: string
  convertido: boolean
  created_at: string
  pipelines?: { nome: string; cor: string }
  pipeline_estados?: { nome: string; cor: string }
  users?: { full_name: string }
  unidades?: { nome: string }
}

interface Pipeline { id: string; nome: string; segmento: string; cor: string }
interface User { id: string; full_name: string }
interface Unidade { id: string; nome: string }

export default function LeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPipeline, setFilterPipeline] = useState('')
  const [filterUnidade, setFilterUnidade] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', empresa: '', nif: '', morada: '',
    interesse: '', orcamento: '', prazo: '', notas: '',
    pipeline_id: '', atribuido_a: '', unidade_id: ''
  })

  useEffect(() => {
    fetchAll()
  }, [filterPipeline, filterUnidade])

  async function fetchAll() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterPipeline) params.append('pipeline_id', filterPipeline)
      if (filterUnidade) params.append('unidade_id', filterUnidade)
      
      const [leadsRes, pipelinesRes, usersRes, unidadesRes] = await Promise.all([
        fetch(`/api/leads?${params}`),
        fetch('/api/pipelines'),
        fetch('/api/users'),
        fetch('/api/unidades')
      ])
      
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(Array.isArray(data) ? data : data.leads || [])
      } else {
        console.error('[v0] Erro ao carregar leads:', leadsRes.status)
      }
      
      if (pipelinesRes.ok) {
        const data = await pipelinesRes.json()
        setPipelines(Array.isArray(data) ? data : data.pipelines || [])
      }
      
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(Array.isArray(data) ? data : data.users || [])
      }
      
      if (unidadesRes.ok) {
        const data = await unidadesRes.json()
        setUnidades(Array.isArray(data) ? data : data.unidades || [])
      }
    } catch (error) {
      console.error('[v0] Erro ao buscar dados:', error)
    }
    setLoading(false)
  }

  const filteredLeads = leads.filter(l => 
    l.nome?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.empresa?.toLowerCase().includes(search.toLowerCase())
  )

  function openNew() {
    setEditLead(null)
    setForm({ nome: '', email: '', telefone: '', empresa: '', nif: '', morada: '',
      interesse: '', orcamento: '', prazo: '', notas: '',
      pipeline_id: pipelines[0]?.id || '', atribuido_a: '', unidade_id: '' })
    setShowModal(true)
  }

  function openEdit(lead: Lead) {
    setEditLead(lead)
    setForm({
      nome: lead.nome || '', email: lead.email || '', telefone: lead.telefone || '',
      empresa: lead.empresa || '', nif: lead.nif || '', morada: '',
      interesse: lead.interesse || '', orcamento: '', prazo: '', notas: '',
      pipeline_id: lead.pipeline_id || '', atribuido_a: lead.atribuido_a || '',
      unidade_id: lead.unidade_id || ''
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const method = editLead ? 'PUT' : 'POST'
    const body = editLead ? { id: editLead.id, ...form } : form
    
    const res = await fetch('/api/leads', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (res.ok) {
      setShowModal(false)
      fetchAll()
    }
  }

  async function handleDistribuir(leadId: string, userId: string) {
    await fetch('/api/leads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: leadId, atribuido_a: userId })
    })
    fetchAll()
  }

  function getScoreColor(score: number) {
    if (score >= 70) return '#22c55e'
    if (score >= 40) return '#f97316'
    return '#94a3b8'
  }

  const card = { background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }
  const inp = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }

  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center" >
      <p style={{ color: '#64748b' }}>Acesso restrito</p>
    </div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="w-full overflow-auto pt-16 lg:pt-16 lg:ml-64 w-full">
          <div className="p-4 md:p-5 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Gestao de Leads</h1>
                <p className="text-sm" style={{ color: '#64748b' }}>Distribuicao e scoring de leads</p>
              </div>
              <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                <Plus size={18} /> Novo Lead
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Leads', value: leads.length, icon: Users, color: '#0ea5e9' },
                { label: 'Quentes (70+)', value: leads.filter(l => l.score >= 70).length, icon: TrendingUp, color: '#22c55e' },
                { label: 'Mornos (40-69)', value: leads.filter(l => l.score >= 40 && l.score < 70).length, icon: Target, color: '#f97316' },
                { label: 'Convertidos', value: leads.filter(l => l.convertido).length, icon: UserPlus, color: '#8b5cf6' },
              ].map((s, i) => (
                <div key={i} className="p-4" style={card}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: `${s.color}15` }}>
                      <s.icon size={20} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#64748b' }}>{s.label}</p>
                      <p className="text-xl font-bold" style={{ color: '#1e293b' }}>{s.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Pesquisar leads..." className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm" style={inp} />
              </div>
              <select value={filterPipeline} onChange={e => setFilterPipeline(e.target.value)}
                className="px-4 py-2.5 rounded-xl text-sm" style={inp}>
                <option value="">Todos os Pipelines</option>
                {pipelines.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <select value={filterUnidade} onChange={e => setFilterUnidade(e.target.value)}
                className="px-4 py-2.5 rounded-xl text-sm" style={inp}>
                <option value="">Todas as Unidades</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>

            {/* Leads Table */}
            <div style={card} className="overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2" style={{ borderColor: '#0ea5e9' }}></div>
                  <p style={{ color: '#64748b' }}>A carregar...</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={40} className="mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                  <p style={{ color: '#64748b' }}>Nenhum lead encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr >
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Lead</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Contacto</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Pipeline</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Score</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Atribuido a</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Accoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map(lead => (
                        <tr key={lead.id} className="border-t transition-colors hover:bg-slate-50" style={{ borderColor: '#f1f5f9' }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                                style={{ background: getScoreColor(lead.score) }}>
                                {lead.nome?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium" style={{ color: '#1e293b' }}>{lead.nome}</p>
                                {lead.empresa && <p className="text-xs" style={{ color: '#64748b' }}>{lead.empresa}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {lead.telefone && (
                                <div className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
                                  <Phone size={14} /> {lead.telefone}
                                </div>
                              )}
                              {lead.email && (
                                <div className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
                                  <Mail size={14} /> {lead.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {lead.pipelines && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium" 
                                style={{ background: `${lead.pipelines.cor}20`, color: lead.pipelines.cor }}>
                                {lead.pipelines.nome}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" 
                              style={{ background: `${getScoreColor(lead.score)}15` }}>
                              <div className="w-2 h-2 rounded-full" style={{ background: getScoreColor(lead.score) }}></div>
                              <span className="text-sm font-semibold" style={{ color: getScoreColor(lead.score) }}>{lead.score}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {lead.users ? (
                              <span className="text-sm" style={{ color: '#475569' }}>{lead.users.full_name}</span>
                            ) : (
                              <span className="text-sm italic" style={{ color: '#94a3b8' }}>Nao atribuido</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => openEdit(lead)} className="p-2 rounded-lg transition-colors hover:bg-slate-100">
                              <MoreHorizontal size={18} style={{ color: '#64748b' }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: '#1e293b' }}>
                {editLead ? 'Editar Lead' : 'Novo Lead'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X size={20} style={{ color: '#64748b' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Nome *</label>
                  <input type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inp} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Telefone</label>
                  <input type="tel" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Empresa</label>
                  <input type="text" value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>NIF</label>
                  <input type="text" value={form.nif} onChange={e => setForm({ ...form, nif: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Pipeline</label>
                  <select value={form.pipeline_id} onChange={e => setForm({ ...form, pipeline_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inp}>
                    <option value="">Selecionar pipeline</option>
                    {pipelines.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Interesse</label>
                  <textarea value={form.interesse} onChange={e => setForm({ ...form, interesse: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={inp} rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium" >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  {editLead ? 'Guardar' : 'Criar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
