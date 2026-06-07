'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { Trash2, Search, Crown, Shield, Users, Calendar, UserPlus, ArrowUpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface Parceiro {
  id: string
  email: string
  full_name: string
  company_name: string
}

export default function AdminsVIPPage() {
  const router = useRouter()
  const { user, authFetch } = useAuth()
  const [admins, setAdmins] = useState<AdminVIP[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [showPromote, setShowPromote] = useState(false)
  const [selectedParceiro, setSelectedParceiro] = useState<string>('')
  const [parceiroSearch, setParceiroSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user) {
      if (!user.is_superadmin) {
        router.replace('/admin/dashboard')
        return
      }
      loadAdmins()
      loadParceiros()
    }
  }, [user, router])

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

  async function loadParceiros() {
    try {
      const res = await authFetch('/api/parceiros')
      if (res.ok) {
        const data = await res.json()
        setParceiros(data.parceiros || [])
      }
    } catch (e) {
      console.error('Erro ao carregar parceiros:', e)
    }
  }

  async function promoteToAdmin() {
    if (!selectedParceiro) {
      setError('Selecione um parceiro para promover')
      return
    }
    setError(null)
    try {
      const res = await authFetch('/api/admins-vip/promover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parceiro_id: selectedParceiro })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao promover')
      setSuccess('Parceiro promovido a Admin VIP com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      setSelectedParceiro('')
      setShowPromote(false)
      loadAdmins()
      loadParceiros()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao promover')
    }
  }

  async function demoteAdmin(id: string) {
    if (!confirm('Tem a certeza que quer remover este Admin VIP? Ele voltará a ser um parceiro normal.')) return
    setError(null)
    try {
      const res = await authFetch(`/api/admins-vip/promover?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao remover')
      setSuccess('Admin VIP removido. O utilizador é agora um parceiro normal.')
      setTimeout(() => setSuccess(null), 3000)
      loadAdmins()
      loadParceiros()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover')
    }
  }

  const filteredAdmins = admins.filter(a => 
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredParceiros = parceiros.filter(p => 
    p.full_name?.toLowerCase().includes(parceiroSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(parceiroSearch.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={true} />
        <main className="flex-1 md:ml-64 pt-20 md:pt-20" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-5 max-w-5xl mx-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3" style={{ color: '#1e293b' }}>
                  <Crown className="text-amber-500" size={28} />
                  Admins VIP
                </h1>
                <p className="mt-1" style={{ color: '#64748b' }}>Promova parceiros a administradores com poderes de gestão</p>
              </div>
              <button onClick={() => setShowPromote(true)} className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                <ArrowUpCircle size={18} /> Promover Parceiro
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

            {/* Info Box */}
            <div className="mb-6 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fcd34d' }}>
              <div className="flex items-start gap-3">
                <Crown className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-amber-900">Como funciona o Admin VIP?</p>
                  <p className="text-sm text-amber-800 mt-1">
                    Um Admin VIP é um parceiro promovido que pode criar e gerir os seus próprios parceiros. 
                    Ele só vê os dados dos parceiros que criou, mantendo a sua estrutura independente.
                  </p>
                </div>
              </div>
            </div>

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
                <div className="text-sm" style={{ color: '#64748b' }}>Parceiros Geridos</div>
              </div>
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
                <Shield className="mb-2" style={{ color: '#22c55e' }} size={24} />
                <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{admins.filter(a => a.parceiros_count && a.parceiros_count > 0).length}</div>
                <div className="text-sm" style={{ color: '#64748b' }}>Com Equipa</div>
              </div>
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'white' }}>
                <UserPlus className="mb-2" style={{ color: '#8b5cf6' }} size={24} />
                <div className="text-2xl font-bold" style={{ color: '#1e293b' }}>{parceiros.length}</div>
                <div className="text-sm" style={{ color: '#64748b' }}>Parceiros Disponiveis</div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} size={20} />
              <input
                type="text"
                placeholder="Pesquisar admins VIP..."
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
                  {search ? 'Nenhum admin encontrado' : 'Ainda não existem Admins VIP. Promova um parceiro!'}
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
                            Promovido em {new Date(admin.created_at).toLocaleDateString('pt-PT')}
                          </div>
                        </div>
                        <button
                          onClick={() => demoteAdmin(admin.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          style={{ color: '#ef4444' }}
                          title="Remover Admin VIP"
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

        {/* Modal Promover Parceiro */}
        {showPromote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: 'white', maxHeight: '90vh', overflow: 'auto' }}>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: '#1e293b' }}>
                <ArrowUpCircle className="text-amber-500" size={24} />
                Promover Parceiro a Admin VIP
              </h2>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                Selecione um parceiro existente para promover. Ele terá acesso ao painel admin e poderá criar e gerir os seus próprios parceiros.
              </p>
              
              {/* Search parceiros */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} size={18} />
                <input
                  type="text"
                  placeholder="Pesquisar parceiro..."
                  value={parceiroSearch}
                  onChange={e => setParceiroSearch(e.target.value)}
                  className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              {/* Lista de parceiros */}
              <div className="border rounded-xl overflow-hidden mb-4" style={{ borderColor: '#e2e8f0', maxHeight: '300px', overflowY: 'auto' }}>
                {filteredParceiros.length === 0 ? (
                  <div className="p-4 text-center text-sm" style={{ color: '#64748b' }}>
                    {parceiroSearch ? 'Nenhum parceiro encontrado' : 'Não há parceiros disponíveis para promover'}
                  </div>
                ) : (
                  filteredParceiros.map(parceiro => (
                    <label
                      key={parceiro.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer border-b last:border-b-0 transition-colors ${selectedParceiro === parceiro.id ? 'bg-amber-50' : 'hover:bg-slate-50'}`}
                      style={{ borderColor: '#e2e8f0' }}
                    >
                      <input
                        type="radio"
                        name="parceiro"
                        value={parceiro.id}
                        checked={selectedParceiro === parceiro.id}
                        onChange={e => setSelectedParceiro(e.target.value)}
                        className="w-4 h-4 text-amber-500"
                      />
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                        <span className="text-white font-semibold text-sm">{parceiro.full_name?.charAt(0) || 'P'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate" style={{ color: '#1e293b' }}>{parceiro.full_name}</div>
                        <div className="text-xs truncate" style={{ color: '#64748b' }}>{parceiro.email}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {selectedParceiro && (
                <div className="rounded-lg p-3 mb-4" style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}>
                  <p className="text-sm text-amber-800">
                    <strong>Atenção:</strong> Ao promover este parceiro, ele terá acesso ao painel de administração e poderá criar novos parceiros.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPromote(false); setSelectedParceiro(''); setParceiroSearch(''); }}
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium"
                  style={{ borderColor: '#d1d5db', color: '#374151' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={promoteToAdmin}
                  disabled={!selectedParceiro}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                >
                  Promover a Admin VIP
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
