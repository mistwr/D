'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/sidebar'
import { Menu, Plus, Trash2, Search, Crown, Shield, Users, Calendar } from 'lucide-react'

interface AdminVIP {
  id: string
  email: string
  full_name: string
  company_name: string
  phone: string
  created_at: string
  created_by: string
  parceiros_count?: number
}

export default function AdminsVIPPage() {
  const { user, authFetch } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [admins, setAdmins] = useState<AdminVIP[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', full_name: '', company_name: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user) loadAdmins()
  }, [user])

  async function loadAdmins() {
    setLoading(true)
    try {
      const res = await authFetch('/api/admins-vip')
      if (res.ok) {
        const data = await res.json()
        setAdmins(data)
      }
    } catch (e) {
      console.error('Erro ao carregar admins:', e)
    }
    setLoading(false)
  }

  async function createAdmin() {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.full_name) {
      setError('Email, password e nome são obrigatórios')
      return
    }
    setError(null)
    try {
      const res = await authFetch('/api/admins-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar admin')
      setSuccess('Admin VIP criado com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      setNewAdmin({ email: '', password: '', full_name: '', company_name: '', phone: '' })
      setShowAdd(false)
      loadAdmins()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar admin')
    }
  }

  async function deleteAdmin(id: string) {
    if (!confirm('Tem a certeza que quer eliminar este Admin VIP? Os parceiros associados serão mantidos.')) return
    setError(null)
    try {
      const res = await authFetch(`/api/admins-vip?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao eliminar')
      setSuccess('Admin VIP eliminado com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      loadAdmins()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao eliminar')
    }
  }

  const filteredAdmins = admins.filter(a => 
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen" style={{ background: '#f1f5f9' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 md:ml-72">
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 shadow-sm md:px-8" style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden rounded-lg p-2" style={{ color: '#64748b' }}>
              <Menu size={24} />
            </button>
            <span className="text-sm font-medium" style={{ color: '#64748b' }}>Painel de Administracao</span>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3" style={{ color: '#1e293b' }}>
                <Crown className="text-amber-500" size={28} />
                Admins VIP
              </h1>
              <p className="mt-1" style={{ color: '#64748b' }}>Gerir administradores com poderes independentes</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <Plus size={18} /> Novo Admin VIP
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
              <Crown className="mb-2" style={{ color: '#f59e0b' }} size={24} />
              <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{admins.length}</div>
              <div className="text-sm" style={{ color: '#64748b' }}>Admins VIP</div>
            </div>
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
              <Users className="mb-2" style={{ color: '#0ea5e9' }} size={24} />
              <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{admins.reduce((acc, a) => acc + (a.parceiros_count || 0), 0)}</div>
              <div className="text-sm" style={{ color: '#64748b' }}>Total Parceiros</div>
            </div>
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
              <Shield className="mb-2" style={{ color: '#22c55e' }} size={24} />
              <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{admins.filter(a => a.parceiros_count && a.parceiros_count > 0).length}</div>
              <div className="text-sm" style={{ color: '#64748b' }}>Com Equipa</div>
            </div>
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
              <Calendar className="mb-2" style={{ color: '#8b5cf6' }} size={24} />
              <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{admins.filter(a => {
                const d = new Date(a.created_at)
                const now = new Date()
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              }).length}</div>
              <div className="text-sm" style={{ color: '#64748b' }}>Este Mes</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} size={20} />
            <input
              type="text"
              placeholder="Pesquisar admins..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#e2e8f0', background: 'white' }}
            />
          </div>

          {/* Lista */}
          <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'white' }}>
            {loading ? (
              <div className="p-8 text-center" style={{ color: '#64748b' }}>A carregar...</div>
            ) : filteredAdmins.length === 0 ? (
              <div className="p-8 text-center" style={{ color: '#64748b' }}>
                {search ? 'Nenhum admin encontrado' : 'Ainda não existem Admins VIP'}
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#e2e8f0' }}>
                {filteredAdmins.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)' }}>
                        <Crown className="text-amber-600" size={20} />
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: '#1e293b' }}>{admin.full_name}</div>
                        <div className="text-sm" style={{ color: '#64748b' }}>{admin.email}</div>
                        {admin.company_name && (
                          <div className="text-xs" style={{ color: '#94a3b8' }}>{admin.company_name}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium" style={{ color: '#0ea5e9' }}>{admin.parceiros_count || 0} parceiros</div>
                        <div className="text-xs" style={{ color: '#94a3b8' }}>
                          {new Date(admin.created_at).toLocaleDateString('pt-PT')}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAdmin(admin.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: '#ef4444' }}
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

      {/* Modal Novo Admin */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'white' }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#1e293b' }}>
              <Crown className="text-amber-500" size={24} />
              Novo Admin VIP
            </h2>
            <p className="text-sm mb-4" style={{ color: '#64748b' }}>
              O Admin VIP terá acesso total ao sistema mas com dados independentes (parceiros, vendas, etc.)
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Nome Completo *</label>
                <input
                  type="text"
                  value={newAdmin.full_name}
                  onChange={e => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="Nome do admin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Email *</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Password *</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="Minimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Empresa</label>
                <input
                  type="text"
                  value={newAdmin.company_name}
                  onChange={e => setNewAdmin({ ...newAdmin, company_name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="Nome da empresa (opcional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Telefone</label>
                <input
                  type="tel"
                  value={newAdmin.phone}
                  onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="+351 912 345 678"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: '#d1d5db', color: '#374151' }}
              >
                Cancelar
              </button>
              <button
                onClick={createAdmin}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
              >
                Criar Admin VIP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
