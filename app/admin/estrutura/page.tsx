'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Users, Building2, ChevronDown, ChevronRight, Plus, Pencil, Trash2, Save, X, UserCircle } from 'lucide-react'

interface Cargo { id: string; nome: string; nivel: number; descricao: string }
interface User { id: string; full_name: string; email: string; role: string; cargo_id: string; responsavel_id: string; unidade_id: string; company_name: string }
interface Unidade { id: string; nome: string }

export default function EstruturaComericalPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null)
  const [newCargo, setNewCargo] = useState({ nome: '', nivel: 5, descricao: '' })
  const [showAddCargo, setShowAddCargo] = useState(false)
  const [expandedUsers, setExpandedUsers] = useState<string[]>([])
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [userChanges, setUserChanges] = useState<Partial<User>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    try {
      const safeJson = async (res: Response) => {
        if (!res.ok) return null
        const text = await res.text()
        if (!text) return null
        try { return JSON.parse(text) } catch { return null }
      }
      const [c, u, un] = await Promise.all([
        authFetch('/api/cargos').then(safeJson),
        authFetch('/api/users').then(safeJson),
        authFetch('/api/unidades').then(safeJson)
      ])
      setCargos(c || [])
      setUsers(u?.users || u || [])
      setUnidades(un || [])
    } catch (e) {
      console.log('[v0] Error loading data:', e)
    }
    setLoading(false)
  }

  async function saveCargo(cargo: Cargo) {
    setError(null)
    try {
      const res = await authFetch('/api/cargos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cargo) })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error || 'Erro ao guardar cargo')
      setSuccess('Cargo guardado com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      setEditingCargo(null)
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar cargo')
    }
  }

  async function addCargo() {
    if (!newCargo.nome) return
    setError(null)
    try {
      const res = await authFetch('/api/cargos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCargo) })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error || 'Erro ao criar cargo')
      setSuccess('Cargo criado com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      setNewCargo({ nome: '', nivel: 5, descricao: '' })
      setShowAddCargo(false)
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar cargo')
    }
  }

  async function deleteCargo(id: string) {
    if (!confirm('Tem a certeza que quer eliminar este cargo?')) return
    setError(null)
    try {
      const res = await authFetch(`/api/cargos?id=${id}`, { method: 'DELETE' })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error || 'Erro ao eliminar cargo')
      setSuccess('Cargo eliminado com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao eliminar cargo')
    }
  }

  async function saveUserHierarchy(userId: string) {
    setError(null)
    try {
      const res = await authFetch('/api/users', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id: userId, ...userChanges }) 
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error || 'Erro ao guardar hierarquia')
      setSuccess('Hierarquia guardada com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
      setEditingUser(null)
      setUserChanges({})
      loadData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar hierarquia')
    }
  }

  function toggleUserExpand(cargoId: string) {
    setExpandedUsers(prev => prev.includes(cargoId) ? prev.filter(id => id !== cargoId) : [...prev, cargoId])
  }

  function getUsersByCargo(cargoId: string | null) {
    if (cargoId === null) {
      return users.filter(u => !u.cargo_id)
    }
    return users.filter(u => u.cargo_id === cargoId)
  }

  function getUserName(id: string) {
    return users.find(u => u.id === id)?.full_name || '-'
  }

  const usersWithoutCargo = users.filter(u => !u.cargo_id)

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} /></div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 md:ml-64 pt-14 md:pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#1e293b' }}>Estrutura Comercial</h1>
                <p className="mt-1" style={{ color: '#64748b' }}>Gerir hierarquias, cargos e equipas</p>
              </div>
              <button onClick={() => setShowAddCargo(true)} className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                <Plus size={18} /> Novo Cargo
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#e0f2fe' }}>
                    <Building2 size={22} style={{ color: '#0ea5e9' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{cargos.length}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Cargos</p>
              </div>
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#dcfce7' }}>
                    <Users size={22} style={{ color: '#22c55e' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{users.length}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Utilizadores</p>
              </div>
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#fef3c7' }}>
                    <UserCircle size={22} style={{ color: '#f59e0b' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{users.filter(u => u.responsavel_id).length}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Com Responsavel</p>
              </div>
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#f1f5f9' }}>
                    <Building2 size={22} style={{ color: '#64748b' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{unidades.length}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Unidades</p>
              </div>
            </div>

            {/* Modal Adicionar Cargo */}
            {showAddCargo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="rounded-2xl p-6 w-full max-w-md shadow-xl" style={{ background: '#ffffff' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Novo Cargo</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Nome</label>
                      <input type="text" value={newCargo.nome} onChange={e => setNewCargo({ ...newCargo, nome: e.target.value })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Nivel (1=mais alto)</label>
                      <input type="number" min="1" max="10" value={newCargo.nivel} onChange={e => setNewCargo({ ...newCargo, nivel: parseInt(e.target.value) })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Descricao</label>
                      <textarea value={newCargo.descricao} onChange={e => setNewCargo({ ...newCargo, descricao: e.target.value })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm" rows={2} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowAddCargo(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#64748b' }}>Cancelar</button>
                    <button onClick={addCargo} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0ea5e9' }}>Guardar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Cargos com Utilizadores */}
            <div className="space-y-4">
              {cargos.map(cargo => {
                const cargoUsers = getUsersByCargo(cargo.id)
                const isExpanded = expandedUsers.includes(cargo.id)
                const isEditing = editingCargo?.id === cargo.id

                return (
                  <div key={cargo.id} className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                    {/* Header do Cargo */}
                    <div className="p-4 flex items-center justify-between" style={{ background: '#f8fafc', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleUserExpand(cargo.id)}>
                        {isExpanded ? <ChevronDown size={20} style={{ color: '#64748b' }} /> : <ChevronRight size={20} style={{ color: '#64748b' }} />}
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                          {cargo.nivel}
                        </div>
                        {isEditing ? (
                          <input type="text" value={editingCargo.nome} onChange={e => setEditingCargo({ ...editingCargo, nome: e.target.value })}
                            className="font-semibold px-2 py-1 rounded" style={{ color: '#1e293b', background: '#ffffff', border: '1px solid #e2e8f0' }} />
                        ) : (
                          <div>
                            <p className="font-semibold" style={{ color: '#1e293b' }}>{cargo.nome}</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>{cargo.descricao || 'Sem descricao'}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                          {cargoUsers.length} utilizadores
                        </span>
                        {isEditing ? (
                          <>
                            <button onClick={() => saveCargo(editingCargo)} className="p-1.5 rounded-lg" style={{ background: '#dcfce7' }}><Save size={16} style={{ color: '#22c55e' }} /></button>
                            <button onClick={() => setEditingCargo(null)} className="p-1.5 rounded-lg" style={{ background: '#fee2e2' }}><X size={16} style={{ color: '#ef4444' }} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingCargo(cargo)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil size={16} style={{ color: '#64748b' }} /></button>
                            <button onClick={() => deleteCargo(cargo.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={16} style={{ color: '#ef4444' }} /></button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Lista de Utilizadores do Cargo */}
                    {isExpanded && cargoUsers.length > 0 && (
                      <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                        {cargoUsers.map(u => (
                          <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                                <span className="text-white font-semibold text-sm">{u.full_name?.charAt(0) || '?'}</span>
                              </div>
                              <div>
                                <p className="font-medium" style={{ color: '#1e293b' }}>{u.full_name}</p>
                                <p className="text-xs" style={{ color: '#64748b' }}>{u.email}</p>
                              </div>
                            </div>
                            {editingUser === u.id ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <select value={userChanges.cargo_id ?? u.cargo_id ?? ''} onChange={e => setUserChanges({ ...userChanges, cargo_id: e.target.value })}
                                  className="text-sm rounded-lg px-2 py-1.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <option value="">Sem Cargo</option>
                                  {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                                <select value={userChanges.responsavel_id ?? u.responsavel_id ?? ''} onChange={e => setUserChanges({ ...userChanges, responsavel_id: e.target.value })}
                                  className="text-sm rounded-lg px-2 py-1.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <option value="">Sem Responsavel</option>
                                  {users.filter(x => x.id !== u.id).map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                                </select>
                                <select value={userChanges.unidade_id ?? u.unidade_id ?? ''} onChange={e => setUserChanges({ ...userChanges, unidade_id: e.target.value })}
                                  className="text-sm rounded-lg px-2 py-1.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <option value="">Sem Unidade</option>
                                  {unidades.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
                                </select>
                                <button onClick={() => saveUserHierarchy(u.id)} className="p-1.5 rounded-lg" style={{ background: '#dcfce7' }}><Save size={16} style={{ color: '#22c55e' }} /></button>
                                <button onClick={() => { setEditingUser(null); setUserChanges({}) }} className="p-1.5 rounded-lg" style={{ background: '#fee2e2' }}><X size={16} style={{ color: '#ef4444' }} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                {u.responsavel_id && (
                                  <span className="text-xs px-2 py-1 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                    Resp: {getUserName(u.responsavel_id)}
                                  </span>
                                )}
                                <button onClick={() => setEditingUser(u.id)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil size={16} style={{ color: '#64748b' }} /></button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {isExpanded && cargoUsers.length === 0 && (
                      <div className="p-6 text-center" style={{ color: '#94a3b8' }}>
                        Nenhum utilizador com este cargo
                      </div>
                    )}
                  </div>
                )
                      })}

              {/* Utilizadores sem Cargo Atribuído */}
              {usersWithoutCargo.length > 0 && (
                <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#ffffff', border: '1px solid #f59e0b' }}>
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleUserExpand('sem-cargo')}
                    style={{ background: '#fef3c7', borderBottom: expandedUsers.includes('sem-cargo') ? '1px solid #fcd34d' : 'none' }}>
                    <div className="flex items-center gap-3">
                      {expandedUsers.includes('sem-cargo') ? <ChevronDown size={20} style={{ color: '#92400e' }} /> : <ChevronRight size={20} style={{ color: '#92400e' }} />}
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm text-white" style={{ background: '#f59e0b' }}>
                        ?
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: '#92400e' }}>Sem Cargo Atribuido</p>
                        <p className="text-xs" style={{ color: '#b45309' }}>Atribua um cargo a estes utilizadores</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#fde68a', color: '#92400e' }}>
                      {usersWithoutCargo.length} utilizadores
                    </span>
                  </div>

                  {expandedUsers.includes('sem-cargo') && (
                    <div className="divide-y" style={{ borderColor: '#fef3c7' }}>
                      {usersWithoutCargo.map(u => (
                        <div key={u.id} className="p-4 flex items-center justify-between hover:bg-amber-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                              <span className="text-white font-semibold text-sm">{u.full_name?.charAt(0) || '?'}</span>
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: '#1e293b' }}>{u.full_name}</p>
                              <p className="text-xs" style={{ color: '#64748b' }}>{u.email}</p>
                            </div>
                          </div>
                          {editingUser === u.id ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <select value={userChanges.cargo_id || ''} onChange={e => setUserChanges({ ...userChanges, cargo_id: e.target.value })}
                                className="text-sm rounded-lg px-2 py-1.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <option value="">Selecionar Cargo</option>
                                {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                              </select>
                              <select value={userChanges.responsavel_id || u.responsavel_id || ''} onChange={e => setUserChanges({ ...userChanges, responsavel_id: e.target.value })}
                                className="text-sm rounded-lg px-2 py-1.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <option value="">Sem Responsavel</option>
                                {users.filter(x => x.id !== u.id).map(x => <option key={x.id} value={x.id}>{x.full_name}</option>)}
                              </select>
                              <button onClick={() => saveUserHierarchy(u.id)} className="p-1.5 rounded-lg" style={{ background: '#dcfce7' }}><Save size={16} style={{ color: '#22c55e' }} /></button>
                              <button onClick={() => { setEditingUser(null); setUserChanges({}) }} className="p-1.5 rounded-lg" style={{ background: '#fee2e2' }}><X size={16} style={{ color: '#ef4444' }} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setEditingUser(u.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium" 
                              style={{ background: '#0ea5e9', color: '#fff' }}>
                              <Plus size={14} /> Atribuir Cargo
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
