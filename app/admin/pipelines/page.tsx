'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { GitBranch, Plus, Pencil, Trash2, Save, X, GripVertical, Circle } from 'lucide-react'

interface PipelineEstado { id?: string; nome: string; cor: string; is_final: boolean; ordem: number }
interface Pipeline { id: string; nome: string; segmento: string; descricao: string; cor: string; ativo: boolean; ordem: number; pipeline_estados: PipelineEstado[] }

const CORES = ['#0ea5e9', '#f97316', '#22c55e', '#ef4444', '#8b5cf6', '#f43f5e', '#eab308', '#64748b', '#06b6d4', '#ec4899']

export default function PipelinesPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newPipeline, setNewPipeline] = useState({ nome: '', segmento: '', descricao: '', cor: '#0ea5e9', estados: [] as PipelineEstado[] })
  const [newEstado, setNewEstado] = useState({ nome: '', cor: '#64748b', is_final: false })

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    try {
      const data = await authFetch('/api/pipelines').then(r => r.json())
      setPipelines(data || [])
    } catch { }
    setLoading(false)
  }

  async function savePipeline() {
    if (!editingPipeline) return
    await authFetch('/api/pipelines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingPipeline) })
    setEditingPipeline(null)
    loadData()
  }

  async function addPipeline() {
    if (!newPipeline.nome || !newPipeline.segmento) return
    await authFetch('/api/pipelines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPipeline) })
    setNewPipeline({ nome: '', segmento: '', descricao: '', cor: '#0ea5e9', estados: [] })
    setShowAdd(false)
    loadData()
  }

  async function deletePipeline(id: string) {
    if (!confirm('Tem a certeza que quer eliminar este pipeline?')) return
    await authFetch(`/api/pipelines?id=${id}`, { method: 'DELETE' })
    loadData()
  }

  function addEstadoToNew() {
    if (!newEstado.nome) return
    setNewPipeline({ ...newPipeline, estados: [...newPipeline.estados, { ...newEstado, ordem: newPipeline.estados.length }] })
    setNewEstado({ nome: '', cor: '#64748b', is_final: false })
  }

  function addEstadoToEditing() {
    if (!editingPipeline || !newEstado.nome) return
    setEditingPipeline({ ...editingPipeline, pipeline_estados: [...editingPipeline.pipeline_estados, { ...newEstado, ordem: editingPipeline.pipeline_estados.length }] })
    setNewEstado({ nome: '', cor: '#64748b', is_final: false })
  }

  function removeEstadoFromNew(index: number) {
    setNewPipeline({ ...newPipeline, estados: newPipeline.estados.filter((_, i) => i !== index) })
  }

  function removeEstadoFromEditing(index: number) {
    if (!editingPipeline) return
    setEditingPipeline({ ...editingPipeline, pipeline_estados: editingPipeline.pipeline_estados.filter((_, i) => i !== index) })
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} /></div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div>
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="pt-16 lg:ml-64 min-h-screen overflow-x-hidden" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-5 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#1e293b' }}>Pipelines</h1>
                <p className="mt-1" style={{ color: '#64748b' }}>Gerir pipelines e estados de vendas</p>
              </div>
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                <Plus size={18} /> Novo Pipeline
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#e0f2fe' }}>
                    <GitBranch size={22} style={{ color: '#0ea5e9' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{pipelines.length}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Pipelines</p>
              </div>
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#dcfce7' }}>
                    <Circle size={22} style={{ color: '#22c55e' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{pipelines.reduce((acc, p) => acc + (p.pipeline_estados?.length || 0), 0)}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Estados</p>
              </div>
              <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: '#fef3c7' }}>
                    <GitBranch size={22} style={{ color: '#f59e0b' }} />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: '#1e293b' }}>{pipelines.filter(p => p.ativo).length}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>Ativos</p>
              </div>
            </div>

            {/* Modal Adicionar Pipeline */}
            {showAdd && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" style={{ background: '#ffffff' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Novo Pipeline</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Nome</label>
                        <input type="text" value={newPipeline.nome} onChange={e => setNewPipeline({ ...newPipeline, nome: e.target.value })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Segmento</label>
                        <input type="text" value={newPipeline.segmento} onChange={e => setNewPipeline({ ...newPipeline, segmento: e.target.value })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} placeholder="telecom, energia, etc" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Descricao</label>
                      <textarea value={newPipeline.descricao} onChange={e => setNewPipeline({ ...newPipeline, descricao: e.target.value })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm" rows={2} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Cor</label>
                      <div className="flex gap-2 flex-wrap">
                        {CORES.map(c => (
                          <button key={c} onClick={() => setNewPipeline({ ...newPipeline, cor: c })} 
                            className="w-8 h-8 rounded-lg" style={{ background: c, border: newPipeline.cor === c ? '3px solid #1e293b' : '2px solid transparent' }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Estados do Pipeline</label>
                      <div className="space-y-2 mb-3">
                        {newPipeline.estados.map((e, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: '#f8fafc' }}>
                            <GripVertical size={16} style={{ color: '#94a3b8' }} />
                            <div className="w-4 h-4 rounded-full" style={{ background: e.cor }} />
                            <span className="flex-1 text-sm" style={{ color: '#1e293b' }}>{e.nome}</span>
                            {e.is_final && <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#dcfce7', color: '#22c55e' }}>Final</span>}
                            <button onClick={() => removeEstadoFromNew(i)} className="p-1"><X size={14} style={{ color: '#ef4444' }} /></button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Nome do estado" value={newEstado.nome} onChange={e => setNewEstado({ ...newEstado, nome: e.target.value })}
                          className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                        <select value={newEstado.cor} onChange={e => setNewEstado({ ...newEstado, cor: e.target.value })}
                          className="rounded-lg px-2 py-2 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          {CORES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <label className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                          <input type="checkbox" checked={newEstado.is_final} onChange={e => setNewEstado({ ...newEstado, is_final: e.target.checked })} /> Final
                        </label>
                        <button onClick={addEstadoToNew} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#0ea5e9' }}>+</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#64748b' }}>Cancelar</button>
                    <button onClick={addPipeline} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0ea5e9' }}>Guardar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Editar Pipeline */}
            {editingPipeline && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" style={{ background: '#ffffff' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Editar Pipeline</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Nome</label>
                        <input type="text" value={editingPipeline.nome} onChange={e => setEditingPipeline({ ...editingPipeline, nome: e.target.value })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#475569' }}>Segmento</label>
                        <input type="text" value={editingPipeline.segmento} onChange={e => setEditingPipeline({ ...editingPipeline, segmento: e.target.value })}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Cor</label>
                      <div className="flex gap-2 flex-wrap">
                        {CORES.map(c => (
                          <button key={c} onClick={() => setEditingPipeline({ ...editingPipeline, cor: c })} 
                            className="w-8 h-8 rounded-lg" style={{ background: c, border: editingPipeline.cor === c ? '3px solid #1e293b' : '2px solid transparent' }} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="ativo" checked={editingPipeline.ativo} onChange={e => setEditingPipeline({ ...editingPipeline, ativo: e.target.checked })} />
                      <label htmlFor="ativo" className="text-sm" style={{ color: '#475569' }}>Pipeline Ativo</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Estados</label>
                      <div className="space-y-2 mb-3">
                        {editingPipeline.pipeline_estados?.map((e, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: '#f8fafc' }}>
                            <GripVertical size={16} style={{ color: '#94a3b8' }} />
                            <div className="w-4 h-4 rounded-full" style={{ background: e.cor }} />
                            <span className="flex-1 text-sm" style={{ color: '#1e293b' }}>{e.nome}</span>
                            {e.is_final && <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#dcfce7', color: '#22c55e' }}>Final</span>}
                            <button onClick={() => removeEstadoFromEditing(i)} className="p-1"><X size={14} style={{ color: '#ef4444' }} /></button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Nome do estado" value={newEstado.nome} onChange={e => setNewEstado({ ...newEstado, nome: e.target.value })}
                          className="flex-1 rounded-lg px-3 py-2 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
                        <select value={newEstado.cor} onChange={e => setNewEstado({ ...newEstado, cor: e.target.value })}
                          className="rounded-lg px-2 py-2 text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          {CORES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <label className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                          <input type="checkbox" checked={newEstado.is_final} onChange={e => setNewEstado({ ...newEstado, is_final: e.target.checked })} /> Final
                        </label>
                        <button onClick={addEstadoToEditing} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#0ea5e9' }}>+</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setEditingPipeline(null)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#64748b' }}>Cancelar</button>
                    <button onClick={savePipeline} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0ea5e9' }}>Guardar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Pipelines */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pipelines.map(p => (
                <div key={p.id} className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div className="p-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: p.cor }} />
                        <h3 className="font-semibold" style={{ color: '#1e293b' }}>{p.nome}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingPipeline(p)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil size={14} style={{ color: '#64748b' }} /></button>
                        <button onClick={() => deletePipeline(p.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={14} style={{ color: '#ef4444' }} /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>{p.segmento}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: p.ativo ? '#dcfce7' : '#fee2e2', color: p.ativo ? '#22c55e' : '#ef4444' }}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>ESTADOS ({p.pipeline_estados?.length || 0})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.pipeline_estados?.sort((a, b) => a.ordem - b.ordem).map((e, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: e.cor + '20', color: e.cor }}>
                          {e.nome}
                        </span>
                      ))}
                      {(!p.pipeline_estados || p.pipeline_estados.length === 0) && (
                        <span className="text-xs" style={{ color: '#94a3b8' }}>Sem estados definidos</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
