'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Plus, Users, UserPlus, Trash2, X, Eye, EyeOff, Phone, Mail, Building2 } from 'lucide-react'

interface Membro {
  id: string
  full_name: string
  email: string
  phone?: string
  company_name?: string
  role: string
  created_at: string
  cargo_id?: string
  cargos?: { nome: string }
}

interface Cargo {
  id: string
  nome: string
  nivel: number
}

export default function EquipaPage() {
  const { user, authFetch, loading } = useAuth()
  const [equipa, setEquipa] = useState<Membro[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    full_name: '', 
    phone: '', 
    company_name: '',
    cargo_id: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    const [equipaRes, cargosRes] = await Promise.all([
      authFetch('/api/equipa'),
      authFetch('/api/cargos')
    ])
    if (equipaRes.ok) setEquipa(await equipaRes.json())
    if (cargosRes.ok) setCargos(await cargosRes.json())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await authFetch('/api/equipa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Erro ao criar membro')
      
      setSuccess('Membro adicionado com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      setFormData({ email: '', password: '', full_name: '', phone: '', company_name: '', cargo_id: '' })
      setShowAdd(false)
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar membro')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(id: string, nome: string) {
    if (!confirm(`Tem a certeza que quer remover ${nome} da sua equipa?`)) return
    
    setError(null)
    try {
      const res = await authFetch(`/api/equipa?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao remover')
      setSuccess('Membro removido da equipa')
      setTimeout(() => setSuccess(null), 3000)
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#0ea5e9' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="flex-1 md:ml-64 pt-14 md:pt-16 pb-20 md:pb-8" style={{ minHeight: '100vh' }}>
          <div className="p-3 sm:p-4 md:p-8">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#1e293b' }}>A Minha Equipa</h1>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                  {equipa.length} membro{equipa.length !== 1 ? 's' : ''} na sua equipa
                </p>
              </div>
              <button 
                onClick={() => setShowAdd(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}
              >
                <UserPlus size={18} /> Adicionar Membro
              </button>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="mb-4 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                {success}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="rounded-xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: '#dbeafe' }}>
                    <Users size={20} style={{ color: '#2563eb' }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{equipa.length}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>Total Equipa</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: '#dcfce7' }}>
                    <UserPlus size={20} style={{ color: '#16a34a' }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>
                      {equipa.filter(m => {
                        const created = new Date(m.created_at)
                        const now = new Date()
                        return (now.getTime() - created.getTime()) < 30 * 24 * 60 * 60 * 1000
                      }).length}
                    </p>
                    <p className="text-xs" style={{ color: '#64748b' }}>Novos (30 dias)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Membros */}
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              {equipa.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                    <Users size={32} style={{ color: '#94a3b8' }} />
                  </div>
                  <p className="text-lg font-medium mb-2" style={{ color: '#475569' }}>Ainda nao tem membros na equipa</p>
                  <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>Adicione parceiros a sua equipa para comecar a crescer</p>
                  <button 
                    onClick={() => setShowAdd(true)}
                    className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}
                  >
                    Adicionar Primeiro Membro
                  </button>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                  {equipa.map(m => (
                    <div key={m.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm"
                            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                            {m.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate" style={{ color: '#1e293b' }}>{m.full_name}</p>
                            {m.cargos?.nome && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                                {m.cargos.nome}
                              </span>
                            )}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs" style={{ color: '#64748b' }}>
                              <span className="flex items-center gap-1">
                                <Mail size={12} /> {m.email}
                              </span>
                              {m.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={12} /> {m.phone}
                                </span>
                              )}
                              {m.company_name && (
                                <span className="flex items-center gap-1">
                                  <Building2 size={12} /> {m.company_name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                              Desde {new Date(m.created_at).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemove(m.id, m.full_name)}
                          className="p-2 rounded-lg transition hover:bg-red-50"
                          style={{ color: '#ef4444' }}
                          title="Remover da equipa"
                        >
                          <Trash2 size={18} />
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

      {/* Modal Adicionar Membro */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-xl p-6" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#1e293b' }}>Adicionar Membro</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Nome Completo *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                  placeholder="Nome do membro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                    placeholder="Minimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#64748b' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                  placeholder="912 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Empresa</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                  placeholder="Nome da empresa"
                />
              </div>

              {cargos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Cargo</label>
                  <select
                    value={formData.cargo_id}
                    onChange={e => setFormData({ ...formData, cargo_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
                  >
                    <option value="">Selecionar cargo...</option>
                    {cargos.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: '#f1f5f9', color: '#475569' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}
                >
                  {submitting ? 'A criar...' : 'Criar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
