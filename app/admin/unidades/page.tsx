'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Building2, Plus, Pencil, Trash2, Save, X, MapPin, Target, Users, TrendingUp } from 'lucide-react'

interface Unidade { id: string; nome: string; responsavel_id: string; segmento: string; localizacao: string; objectivo_mensal: number; comissao_percentagem: number; ativo: boolean }
interface User { id: string; full_name: string; email: string }

export default function UnidadesPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newUnidade, setNewUnidade] = useState({ nome: '', responsavel_id: '', segmento: '', localizacao: '', objectivo_mensal: 0, comissao_percentagem: 0 })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    try {
      const [u, us] = await Promise.all([
        authFetch('/api/unidades').then(r => r.json()),
        authFetch('/api/users').then(r => r.json())
      ])
      setUnidades(u || [])
      setUsers(us.users || us || [])
    } catch { }
    setLoading(false)
  }

  async function saveUnidade() {
    if (!editingUnidade) return
    setError(null)
    try {
      const res = await authFetch('/api/unidades', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingUnidade) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao guardar unidade')
      setSuccess('Unidade guardada com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      setEditingUnidade(null)
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar unidade')
    }
  }

  async function addUnidade() {
    if (!newUnidade.nome) return
    setError(null)
    try {
      const res = await authFetch('/api/unidades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUnidade) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar unidade')
      setSuccess('Unidade criada com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      setNewUnidade({ nome: '', responsavel_id: '', segmento: '', localizacao: '', objectivo_mensal: 0, comissao_percentagem: 0 })
      setShowAdd(false)
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar unidade')
    }
  }

  async function deleteUnidade(id: string) {
    if (!confirm('Tem a certeza que quer eliminar esta unidade?')) return
    setError(null)
    try {
      const res = await authFetch(`/api/unidades?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao eliminar unidade')
      setSuccess('Unidade eliminada com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao eliminar unidade')
    }
  }

  function getUserName(id: string) {
    return users.find(u => u.id === id)?.full_name || '-'
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} /></div>
  }

  const totalObjectivo = unidades.reduce((acc, u) => acc + (u.objectivo_mensal || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-14 md:pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#1e293b' }}>Unidades / Franquias</h1>
                <p className="mt-1" style={{ color: '#64748b' }}>Gerir unidades de negocio e equipas</p>
              </div>
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                <Plus size={18} /> Nova Unidade
              </button>
            </div>

            {/* Mensagens de Erro/Sucesso */}
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
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#e0f2fe' }}>
                    <Building2 size={22} style={{ color: '#0ea5e9' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{unidades.length}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Unidades</p>
              </div>
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#dcfce7' }}>
                    <Users size={22} style={{ color: '#22c55e' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{unidades.filter(u => u.ativo).length}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Ativas</p>
              </div>
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#fef3c7' }}>
                    <Target size={22} style={{ color: '#f59e0b' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{'\u20AC'}{totalObjectivo.toLocaleString()}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Objectivo Total</p>
              </div>
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#f1f5f9' }}>
                    <TrendingUp size={22} style={{ color: '#64748b' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{unidades.length > 0 ? (unidades.reduce((acc, u) => acc + (u.comissao_percentagem || 0), 0) / unidades.length).toFixed(1) : 0}%</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Comissao Media</p>
              </div>
            </div>

            {/* Modal Adicionar */}
            {showAdd && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="rounded-2xl p-6 w-full max-w-lg shadow-xl" style={{ background: '#ffffff' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Nova Unidade</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Nome</label>
                      <input type="text" value={newUnidade.nome} onChange={e => setNewUnidade({ ...newUnidade, nome: e.target.value })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Segmento</label>
                        <select value={newUnidade.segmento} onChange={e => setNewUnidade({ ...newUnidade, segmento: e.target.value })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <option value="">Selecionar...</option>
                          <option value="telecom">Telecomunicacoes</option>
                          <option value="energia">Energia</option>
                          <option value="solar">Solar</option>
                          <option value="empresas">Empresas</option>
                          <option value="misto">Misto</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Localizacao</label>
                        <input type="text" value={newUnidade.localizacao} onChange={e => setNewUnidade({ ...newUnidade, localizacao: e.target.value })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} placeholder="Lisboa, Porto..." />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Responsavel</label>
                      <select value={newUnidade.responsavel_id} onChange={e => setNewUnidade({ ...newUnidade, responsavel_id: e.target.value })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <option value="">Selecionar...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Objectivo Mensal ({'\u20AC'})</label>
                        <input type="number" min="0" value={newUnidade.objectivo_mensal} onChange={e => setNewUnidade({ ...newUnidade, objectivo_mensal: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Comissao (%)</label>
                        <input type="number" min="0" max="100" step="0.1" value={newUnidade.comissao_percentagem} onChange={e => setNewUnidade({ ...newUnidade, comissao_percentagem: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#64748b' }}>Cancelar</button>
                    <button onClick={addUnidade} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0ea5e9' }}>Guardar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Editar */}
            {editingUnidade && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="rounded-2xl p-6 w-full max-w-lg shadow-xl" style={{ background: '#ffffff' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Editar Unidade</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Nome</label>
                      <input type="text" value={editingUnidade.nome} onChange={e => setEditingUnidade({ ...editingUnidade, nome: e.target.value })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Segmento</label>
                        <select value={editingUnidade.segmento || ''} onChange={e => setEditingUnidade({ ...editingUnidade, segmento: e.target.value })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <option value="">Selecionar...</option>
                          <option value="telecom">Telecomunicacoes</option>
                          <option value="energia">Energia</option>
                          <option value="solar">Solar</option>
                          <option value="empresas">Empresas</option>
                          <option value="misto">Misto</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Localizacao</label>
                        <input type="text" value={editingUnidade.localizacao || ''} onChange={e => setEditingUnidade({ ...editingUnidade, localizacao: e.target.value })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Responsavel</label>
                      <select value={editingUnidade.responsavel_id || ''} onChange={e => setEditingUnidade({ ...editingUnidade, responsavel_id: e.target.value })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <option value="">Selecionar...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Objectivo Mensal ({'\u20AC'})</label>
                        <input type="number" min="0" value={editingUnidade.objectivo_mensal || 0} onChange={e => setEditingUnidade({ ...editingUnidade, objectivo_mensal: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Comissao (%)</label>
                        <input type="number" min="0" max="100" step="0.1" value={editingUnidade.comissao_percentagem || 0} onChange={e => setEditingUnidade({ ...editingUnidade, comissao_percentagem: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="ativo" checked={editingUnidade.ativo} onChange={e => setEditingUnidade({ ...editingUnidade, ativo: e.target.checked })} />
                      <label htmlFor="ativo" className="text-sm" style={{ color: '#475569' }}>Unidade Ativa</label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setEditingUnidade(null)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#64748b' }}>Cancelar</button>
                    <button onClick={saveUnidade} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0ea5e9' }}>Guardar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Unidades */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unidades.map(u => (
                <div key={u.id} className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                          <Building2 size={24} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold" style={{ color: '#1e293b' }}>{u.nome}</h3>
                          {u.localizacao && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={12} style={{ color: '#94a3b8' }} />
                              <span className="text-xs" style={{ color: '#64748b' }}>{u.localizacao}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingUnidade(u)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil size={14} style={{ color: '#64748b' }} /></button>
                        <button onClick={() => deleteUnidade(u.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} style={{ color: '#ef4444' }} /></button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {u.segmento && <span className="text-xs px-2 py-1 rounded" style={{ background: '#e0f2fe', color: '#0284c7' }}>{u.segmento}</span>}
                      <span className="text-xs px-2 py-1 rounded" style={{ background: u.ativo ? '#dcfce7' : '#fee2e2', color: u.ativo ? '#22c55e' : '#ef4444' }}>
                        {u.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <div>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>Objectivo</p>
                        <p className="font-semibold" style={{ color: '#1e293b' }}>{'\u20AC'}{(u.objectivo_mensal || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: '#94a3b8' }}>Comissao</p>
                        <p className="font-semibold" style={{ color: '#1e293b' }}>{u.comissao_percentagem || 0}%</p>
                      </div>
                    </div>

                    {u.responsavel_id && (
                      <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: '#f97316' }}>
                          {getUserName(u.responsavel_id).charAt(0)}
                        </div>
                        <span className="text-sm" style={{ color: '#64748b' }}>{getUserName(u.responsavel_id)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {unidades.length === 0 && (
              <div className="rounded-2xl p-12 text-center" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <Building2 size={48} className="mx-auto mb-4" style={{ color: '#94a3b8' }} />
                <p className="text-lg font-medium mb-2" style={{ color: '#64748b' }}>Nenhuma unidade criada</p>
                <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0ea5e9' }}>
                  Criar Primeira Unidade
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
