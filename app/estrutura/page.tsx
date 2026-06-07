'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Network, Plus, X, Users, Mail, Building2, Eye, EyeOff, Trash2, AlertTriangle, Check, Crown, UserPlus } from 'lucide-react'

interface Membro { id: string; full_name: string; email: string; company_name?: string; created_at: string }
interface NovoForm { email: string; password: string; full_name: string; company_name: string; phone: string }

export default function MinhaEstruturaPage() {
  const { user, loading: authLoading, authFetch } = useAuth()
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)
  const [permissoes, setPermissoes] = useState({ pode_criar_estrutura: false, pode_criar_parceiros: false })

  // Novo membro
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState<NovoForm>({ email: '', password: '', full_name: '', company_name: '', phone: '' })
  const [novoLoading, setNovoLoading] = useState(false)
  const [novoError, setNovoError] = useState('')
  const [novoSuccess, setNovoSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Apagar
  const [confirmDelete, setConfirmDelete] = useState<Membro | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!user) return
    async function load() {
      const safeJson = async (res: Response) => {
        if (!res.ok) return null
        const text = await res.text()
        if (!text) return null
        try { return JSON.parse(text) } catch { return null }
      }
      // Buscar permissoes do utilizador
      const perfil = await authFetch('/api/profile').then(safeJson)
      setPermissoes({
        pode_criar_estrutura: perfil?.profile?.pode_criar_estrutura || false,
        pode_criar_parceiros: perfil?.profile?.pode_criar_parceiros || false,
      })
      
      // Buscar membros da estrutura (parceiros criados por este utilizador)
      const res = await authFetch('/api/estrutura/membros').then(safeJson)
      setMembros(res?.membros || [])
      setLoading(false)
    }
    load()
  }, [user, authFetch])

  async function criarMembro() {
    setNovoError(''); setNovoSuccess('')
    if (!novoForm.email || !novoForm.password || !novoForm.full_name) {
      setNovoError('Email, password e nome sao obrigatorios'); return
    }
    setNovoLoading(true)
    try {
      const res = await authFetch('/api/estrutura/membros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...novoForm, role: 'parceiro' }),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
    setNovoLoading(false)
    if (!res.ok) { setNovoError(data?.error || 'Erro ao criar membro'); return }
    setNovoSuccess(`Membro ${data?.user?.full_name || novoForm.full_name} criado com sucesso!`)
    setNovoForm({ email: '', password: '', full_name: '', company_name: '', phone: '' })
    // Recarregar membros
    const mRes = await authFetch('/api/estrutura/membros')
    const mText = await mRes.text()
    const m = mText ? JSON.parse(mText) : null
    setMembros(m?.membros || [])
    setTimeout(() => { setShowNovo(false); setNovoSuccess('') }, 2000)
  } catch (e) {
    setNovoLoading(false)
    setNovoError('Erro ao criar membro')
  }
  }

  async function apagarMembro(membro: Membro) {
    setDeleting(true); setDeleteError('')
    const res = await authFetch('/api/estrutura/membros', { 
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: membro.id })
    })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) { setDeleteError(data.error || 'Erro ao apagar'); return }
    setConfirmDelete(null)
    const m = await authFetch('/api/estrutura/membros').then(r => r.json())
    setMembros(m.membros || [])
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0ea5e9', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return null

  const canCreate = permissoes.pode_criar_estrutura || permissoes.pode_criar_parceiros

  if (!canCreate) {
    return (
      <div className="min-h-screen" style={{ background: '#f8fafc' }}>
        <Navbar user={user} />
        <Sidebar user={user} />
        <main className="pt-16 lg:pl-64 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
            <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <AlertTriangle size={48} style={{ color: '#f59e0b' }} className="mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2" style={{ color: '#1e293b' }}>Sem Permissao</h2>
              <p style={{ color: '#64748b' }}>Nao tens permissao para criar estrutura comercial.</p>
              <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>Contacta o teu gestor para solicitar acesso.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const inputStyle = { background: '#fff', border: '1px solid #d1d5db', color: '#1e293b' }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <Navbar user={user} />
      <Sidebar user={user} />
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Minha Estrutura</h1>
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>Gere a tua equipa comercial</p>
            </div>
            <button onClick={() => { setShowNovo(true); setNovoError(''); setNovoSuccess('') }}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: '0 4px 14px rgba(14,165,233,0.3)' }}>
              <UserPlus size={18} />Adicionar Membro
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{membros.length}</p>
                  <p className="text-sm" style={{ color: '#64748b' }}>Membros da Equipa</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: permissoes.pode_criar_estrutura ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0' }}>
                  <Network size={24} style={{ color: permissoes.pode_criar_estrutura ? '#fff' : '#64748b' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>Criar Estrutura</p>
                  <p className="text-xs" style={{ color: permissoes.pode_criar_estrutura ? '#059669' : '#64748b' }}>
                    {permissoes.pode_criar_estrutura ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: permissoes.pode_criar_parceiros ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : '#e2e8f0' }}>
                  <UserPlus size={24} style={{ color: permissoes.pode_criar_parceiros ? '#fff' : '#64748b' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>Criar Parceiros</p>
                  <p className="text-xs" style={{ color: permissoes.pode_criar_parceiros ? '#7c3aed' : '#64748b' }}>
                    {permissoes.pode_criar_parceiros ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Membros */}
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="p-5" style={{ borderBottom: '1px solid #e2e8f0', background: '#f9fafb' }}>
              <h2 className="font-bold" style={{ color: '#1e293b' }}>Membros da Equipa</h2>
            </div>
            {membros.length === 0 ? (
              <div className="p-12 text-center">
                <Network size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p style={{ color: '#64748b' }}>Ainda nao tens membros na tua equipa.</p>
                <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Clica em "Adicionar Membro" para comecar.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                {membros.map(m => (
                  <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                        <span className="text-white font-semibold text-sm">{m.full_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{m.full_name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                            <Mail size={12} />{m.email}
                          </span>
                          {m.company_name && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                              <Building2 size={12} />{m.company_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setDeleteError(''); setConfirmDelete(m) }}
                      className="rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: '#fef2f2' }} title="Remover membro">
                      <Trash2 size={16} style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Novo Membro */}
      {showNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: '#fff' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  <UserPlus size={20} className="text-white" />
                </div>
                <h2 className="font-bold text-lg" style={{ color: '#1e293b' }}>Novo Membro</h2>
              </div>
              <button onClick={() => setShowNovo(false)} className="rounded-full p-2 hover:bg-slate-100"><X size={20} style={{ color: '#64748b' }} /></button>
            </div>
            <div className="p-5 space-y-4">
              {novoError && <div className="rounded-lg p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{novoError}</div>}
              {novoSuccess && <div className="rounded-lg p-3 text-sm flex items-center gap-2" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}><Check size={16} />{novoSuccess}</div>}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Nome Completo *</label>
                <input value={novoForm.full_name} onChange={e => setNovoForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Nome do membro" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Email *</label>
                <input type="email" value={novoForm.email} onChange={e => setNovoForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Password *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={novoForm.password}
                    onChange={e => setNovoForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none pr-10" style={inputStyle} placeholder="Minimo 6 caracteres" />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-2.5">
                    {showPass ? <EyeOff size={16} style={{ color: '#9ca3af' }} /> : <Eye size={16} style={{ color: '#9ca3af' }} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Empresa</label>
                <input value={novoForm.company_name} onChange={e => setNovoForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Nome da empresa (opcional)" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Telefone</label>
                <input value={novoForm.phone} onChange={e => setNovoForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="912 345 678" />
              </div>
            </div>
            <div className="flex gap-3 p-5" style={{ borderTop: '1px solid #e2e8f0', background: '#f9fafb' }}>
              <button onClick={() => setShowNovo(false)} className="flex-1 rounded-lg py-2.5 text-sm font-medium" style={{ background: '#fff', border: '1px solid #d1d5db', color: '#475569' }}>Cancelar</button>
              <button onClick={criarMembro} disabled={novoLoading}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                {novoLoading ? 'A criar...' : 'Criar Membro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Apagar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6" style={{ background: '#fff' }}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#fef2f2' }}>
                <AlertTriangle size={28} style={{ color: '#dc2626' }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1e293b' }}>Remover Membro?</h3>
              <p className="text-sm mb-1" style={{ color: '#64748b' }}>Tens a certeza que queres remover</p>
              <p className="font-semibold" style={{ color: '#1e293b' }}>{confirmDelete.full_name}?</p>
              {deleteError && <p className="text-sm mt-3" style={{ color: '#dc2626' }}>{deleteError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-lg py-2.5 text-sm font-medium" style={{ background: '#f3f4f6', color: '#475569' }}>Cancelar</button>
              <button onClick={() => apagarMembro(confirmDelete)} disabled={deleting}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#dc2626' }}>
                {deleting ? 'A remover...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
