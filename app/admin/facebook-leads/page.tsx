'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  Facebook, Search, Filter, Users, Briefcase, Phone, Mail,
  MapPin, Tag, ChevronDown, Check, Trash2, ExternalLink, Copy, RefreshCw
} from 'lucide-react'

interface FacebookLead {
  id: string
  created_at: string
  nome: string | null
  email: string | null
  telefone: string | null
  empresa: string | null
  cidade: string | null
  servico: string | null
  tipo: 'vendas' | 'recrutamento'
  estado: 'novo' | 'contactado' | 'qualificado' | 'convertido' | 'sem_interesse'
  notas: string | null
  form_name: string | null
  campaign_name: string | null
  ad_name: string | null
  atribuido_a: string | null
  lead_id: string | null
}

const ESTADOS: { value: string; label: string; color: string; bg: string }[] = [
  { value: 'novo',           label: 'Novo',           color: '#0ea5e9', bg: '#e0f2fe' },
  { value: 'contactado',     label: 'Contactado',     color: '#f97316', bg: '#fff7ed' },
  { value: 'qualificado',    label: 'Qualificado',    color: '#8b5cf6', bg: '#ede9fe' },
  { value: 'convertido',     label: 'Convertido',     color: '#16a34a', bg: '#dcfce7' },
  { value: 'sem_interesse',  label: 'Sem Interesse',  color: '#64748b', bg: '#f1f5f9' },
]

function estadoMeta(v: string) {
  return ESTADOS.find(e => e.value === v) ?? ESTADOS[0]
}

export default function FacebookLeadsPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [leads, setLeads] = useState<FacebookLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [selected, setSelected] = useState<FacebookLead | null>(null)
  const [notasEdit, setNotasEdit] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)

  function flash(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  async function fetchLeads() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterTipo) params.set('tipo', filterTipo)
    if (filterEstado) params.set('estado', filterEstado)
    if (search) params.set('search', search)
    const res = await authFetch(`/api/facebook-leads?${params}`)
    if (res.ok) {
      const data = await res.json()
      setLeads(data.leads || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    fetchLeads()
  }, [user, filterTipo, filterEstado]) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateEstado(id: string, estado: string) {
    const res = await authFetch('/api/facebook-leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    if (res.ok) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, estado: estado as FacebookLead['estado'] } : l))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, estado: estado as FacebookLead['estado'] } : prev)
      flash('Estado actualizado')
    }
  }

  async function saveNotas() {
    if (!selected) return
    setSaving(true)
    const res = await authFetch('/api/facebook-leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, notas: notasEdit }),
    })
    if (res.ok) {
      setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, notas: notasEdit } : l))
      setSelected(prev => prev ? { ...prev, notas: notasEdit } : prev)
      flash('Notas guardadas')
    }
    setSaving(false)
  }

  async function deleteLead(id: string) {
    if (!confirm('Apagar este lead?')) return
    await authFetch('/api/facebook-leads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLeads(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
    flash('Lead apagado')
  }

  function openDetail(lead: FacebookLead) {
    setSelected(lead)
    setNotasEdit(lead.notas ?? '')
  }

  const filteredLeads = leads.filter(l =>
    !search || [l.nome, l.email, l.telefone, l.empresa].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  const counts = {
    total: leads.length,
    vendas: leads.filter(l => l.tipo === 'vendas').length,
    recrutamento: leads.filter(l => l.tipo === 'recrutamento').length,
    novos: leads.filter(l => l.estado === 'novo').length,
  }

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8f9fb' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#1877f2' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">

            {msg && (
              <div className="fixed top-20 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg"
                style={{ background: msg.type === 'ok' ? '#f0fdf4' : '#fef2f2', color: msg.type === 'ok' ? '#166534' : '#dc2626', border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecaca'}` }}>
                {msg.text}
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5" style={{ background: '#e7f0fd' }}>
                  <Facebook size={24} style={{ color: '#1877f2' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Facebook Leads</h1>
                  <p className="text-sm" style={{ color: '#64748b' }}>Leads de anuncios Facebook / Meta Lead Ads</p>
                </div>
              </div>
              <button onClick={fetchLeads} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                style={{ border: '1px solid #d1d5db', color: '#475569', background: '#fff' }}>
                <RefreshCw size={14} />
                Atualizar
              </button>
            </div>

            {/* Setup info */}
            <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <p className="font-semibold mb-1" style={{ color: '#1d4ed8' }}>Configuracao do Webhook</p>
              <p style={{ color: '#3b82f6' }}>
                URL do Webhook: <code className="bg-white px-2 py-0.5 rounded font-mono text-xs">{typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/facebook</code>
              </p>
              <p className="mt-1" style={{ color: '#3b82f6' }}>
                Verify Token: <code className="bg-white px-2 py-0.5 rounded font-mono text-xs">parcendi_fb_webhook_2026</code>
                {' '}(configuravel via variavel de ambiente <code className="text-xs">FACEBOOK_WEBHOOK_VERIFY_TOKEN</code>)
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Leads', value: counts.total, color: '#1877f2', bg: '#e7f0fd', icon: Facebook },
                { label: 'Vendas', value: counts.vendas, color: '#0ea5e9', bg: '#e0f2fe', icon: Tag },
                { label: 'Recrutamento', value: counts.recrutamento, color: '#8b5cf6', bg: '#ede9fe', icon: Briefcase },
                { label: 'Novos', value: counts.novos, color: '#f97316', bg: '#fff7ed', icon: Users },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className="rounded-xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-[200px]" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <Search size={16} style={{ color: '#94a3b8' }} />
                <input type="text" placeholder="Pesquisar nome, email, telefone..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchLeads()}
                  className="flex-1 text-sm outline-none bg-transparent" style={{ color: '#1e293b' }} />
              </div>
              <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>
                <option value="">Todos os tipos</option>
                <option value="vendas">Vendas</option>
                <option value="recrutamento">Recrutamento</option>
              </select>
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>
                <option value="">Todos os estados</option>
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>

            {/* Table + Detail split */}
            <div className="flex gap-4" style={{ minHeight: 400 }}>
              {/* List */}
              <div className="flex-1 rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                {loading ? (
                  <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#1877f2' }} /></div>
                ) : filteredLeads.length === 0 ? (
                  <div className="p-12 text-center">
                    <Facebook size={40} style={{ color: '#d1d5db' }} className="mx-auto mb-3" />
                    <p className="font-medium" style={{ color: '#475569' }}>Nenhum lead encontrado</p>
                    <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Configure o webhook do Facebook para receber leads automaticamente.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8f9fb' }}>
                          <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: '#64748b' }}>Nome / Contacto</th>
                          <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: '#64748b' }}>Tipo</th>
                          <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: '#64748b' }}>Estado</th>
                          <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: '#64748b' }}>Campanha</th>
                          <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: '#64748b' }}>Data</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map(lead => {
                          const em = estadoMeta(lead.estado)
                          return (
                            <tr key={lead.id}
                              className="cursor-pointer transition-colors hover:bg-slate-50"
                              style={{ borderBottom: '1px solid #f1f5f9', background: selected?.id === lead.id ? '#eff6ff' : undefined }}
                              onClick={() => openDetail(lead)}>
                              <td className="px-4 py-3">
                                <p className="font-medium" style={{ color: '#1e293b' }}>{lead.nome || '—'}</p>
                                <p className="text-xs" style={{ color: '#64748b' }}>{lead.email || lead.telefone || '—'}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ background: lead.tipo === 'vendas' ? '#e0f2fe' : '#ede9fe', color: lead.tipo === 'vendas' ? '#0ea5e9' : '#8b5cf6' }}>
                                  {lead.tipo === 'vendas' ? 'Vendas' : 'Recrutamento'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: em.bg, color: em.color }}>
                                  {em.label}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-xs truncate max-w-[140px]" style={{ color: '#475569' }}>{lead.campaign_name || lead.form_name || '—'}</p>
                              </td>
                              <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                {new Date(lead.created_at).toLocaleDateString('pt-PT')}
                              </td>
                              <td className="px-4 py-3">
                                <button onClick={e => { e.stopPropagation(); deleteLead(lead.id) }}
                                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50"
                                  style={{ color: '#ef4444' }}>
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Detail panel */}
              {selected && (
                <div className="w-80 flex-shrink-0 rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                  <div className="p-4 border-b" style={{ borderColor: '#f1f5f9', background: '#f8f9fb' }}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm" style={{ color: '#1e293b' }}>{selected.nome || 'Lead sem nome'}</h3>
                      <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-slate-200" style={{ color: '#64748b' }}>
                        ×
                      </button>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium mt-1 inline-block"
                      style={{ background: selected.tipo === 'vendas' ? '#e0f2fe' : '#ede9fe', color: selected.tipo === 'vendas' ? '#0ea5e9' : '#8b5cf6' }}>
                      {selected.tipo === 'vendas' ? 'Vendas' : 'Recrutamento'}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Contact info */}
                    {[
                      { icon: Mail, label: selected.email, href: `mailto:${selected.email}` },
                      { icon: Phone, label: selected.telefone, href: `tel:${selected.telefone}` },
                      { icon: MapPin, label: selected.cidade },
                      { icon: Briefcase, label: selected.empresa },
                    ].filter(i => i.label).map(({ icon: Icon, label, href }) => (
                      <div key={label} className="flex items-center gap-2">
                        <Icon size={14} style={{ color: '#94a3b8' }} />
                        {href ? (
                          <a href={href} className="text-sm hover:underline" style={{ color: '#0ea5e9' }}>{label}</a>
                        ) : (
                          <span className="text-sm" style={{ color: '#475569' }}>{label}</span>
                        )}
                      </div>
                    ))}

                    {/* Campaign info */}
                    {selected.campaign_name && (
                      <div className="rounded-lg p-2" style={{ background: '#f8f9fb', border: '1px solid #e2e8f0' }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: '#64748b' }}>Campanha</p>
                        <p className="text-xs" style={{ color: '#475569' }}>{selected.campaign_name}</p>
                        {selected.ad_name && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Anuncio: {selected.ad_name}</p>}
                      </div>
                    )}

                    {/* Estado */}
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Estado</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ESTADOS.map(e => (
                          <button key={e.value}
                            onClick={() => updateEstado(selected.id, e.value)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: selected.estado === e.value ? e.bg : '#f8f9fb',
                              color: selected.estado === e.value ? e.color : '#64748b',
                              border: `1px solid ${selected.estado === e.value ? e.color + '66' : '#e2e8f0'}`,
                            }}>
                            {selected.estado === e.value && <Check size={10} />}
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notas */}
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Notas</p>
                      <textarea value={notasEdit} onChange={e => setNotasEdit(e.target.value)} rows={3}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                        style={{ background: '#f8f9fb', border: '1px solid #e2e8f0', color: '#1e293b' }}
                        placeholder="Adicionar notas sobre este lead..." />
                      <button onClick={saveNotas} disabled={saving}
                        className="mt-2 w-full rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #1877f2 0%, #0c5fdb 100%)' }}>
                        {saving ? 'A guardar...' : 'Guardar Notas'}
                      </button>
                    </div>

                    {/* Delete */}
                    <button onClick={() => deleteLead(selected.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium"
                      style={{ color: '#ef4444', border: '1px solid #fecaca', background: '#fef2f2' }}>
                      <Trash2 size={14} />
                      Apagar Lead
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
