'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Shield, Check, X, Save, Loader2 } from 'lucide-react'

interface Cargo { id: string; nome: string; nivel: number; descricao: string }
interface Permissao { id: string; cargo_id: string; permissao: string; valor: boolean }

const PERMISSOES_LISTA = [
  { key: 'ver_vendas', label: 'Ver Vendas', desc: 'Visualizar vendas da equipa' },
  { key: 'ver_comissoes', label: 'Ver Comissoes', desc: 'Visualizar comissoes' },
  { key: 'editar_contratos', label: 'Editar Contratos', desc: 'Criar e editar contratos' },
  { key: 'exportar_dados', label: 'Exportar Dados', desc: 'Exportar CSV/Excel' },
  { key: 'criar_campanhas', label: 'Criar Campanhas', desc: 'Gerir campanhas' },
  { key: 'ver_equipa_abaixo', label: 'Ver Equipa Abaixo', desc: 'Ver dados de subordinados' },
  { key: 'aprovar_vendas', label: 'Aprovar Vendas', desc: 'Aprovar/rejeitar vendas' },
  { key: 'aplicar_chargebacks', label: 'Aplicar Chargebacks', desc: 'Criar chargebacks' },
  { key: 'gerir_pipelines', label: 'Gerir Pipelines', desc: 'Configurar pipelines' },
  { key: 'gerir_unidades', label: 'Gerir Unidades', desc: 'Configurar unidades/franquias' },
  { key: 'gerir_hierarquias', label: 'Gerir Hierarquias', desc: 'Configurar estrutura comercial' },
]

export default function PermissoesPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [permissoes, setPermissoes] = useState<Permissao[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    const [cargosRes, permissoesRes] = await Promise.all([
      authFetch('/api/cargos'),
      authFetch('/api/permissoes')
    ])
    if (cargosRes.ok) setCargos(await cargosRes.json())
    if (permissoesRes.ok) setPermissoes(await permissoesRes.json())
    setLoading(false)
  }

  function getPermValue(cargoId: string, perm: string): boolean {
    if (changes[cargoId]?.[perm] !== undefined) return changes[cargoId][perm]
    const p = permissoes.find(x => x.cargo_id === cargoId && x.permissao === perm)
    return p?.valor ?? false
  }

  function togglePerm(cargoId: string, perm: string) {
    const current = getPermValue(cargoId, perm)
    setChanges(prev => ({
      ...prev,
      [cargoId]: { ...prev[cargoId], [perm]: !current }
    }))
  }

  async function saveChanges() {
    setSaving(true)
    const updates: { cargo_id: string; permissao: string; valor: boolean }[] = []
    for (const [cargoId, perms] of Object.entries(changes)) {
      for (const [perm, valor] of Object.entries(perms)) {
        updates.push({ cargo_id: cargoId, permissao: perm, valor })
      }
    }
    if (updates.length > 0) {
      await authFetch('/api/permissoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    }
    setChanges({})
    await loadData()
    setSaving(false)
  }

  const hasChanges = Object.keys(changes).length > 0

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#0ea5e9' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div>
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="w-full lg:ml-64 pt-16 lg:pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-5 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                  <Shield size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#1e293b' }}>Permissoes</h1>
                  <p style={{ color: '#64748b' }}>Configurar permissoes por cargo</p>
                </div>
              </div>
              {hasChanges && (
                <button onClick={saveChanges} disabled={saving}
                  className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  Guardar Alteracoes
                </button>
              )}
            </div>

            {/* Matrix */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider sticky left-0 bg-slate-50" style={{ color: '#64748b', minWidth: '200px' }}>
                        Permissao
                      </th>
                      {cargos.map(c => (
                        <th key={c.id} className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b', minWidth: '100px' }}>
                          <div>{c.nome}</div>
                          <div className="font-normal text-xs mt-1" style={{ color: '#94a3b8' }}>Nivel {c.nivel}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSOES_LISTA.map((perm, idx) => (
                      <tr key={perm.key} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                        <td className="px-6 py-4 sticky left-0" style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{perm.label}</p>
                          <p className="text-xs" style={{ color: '#64748b' }}>{perm.desc}</p>
                        </td>
                        {cargos.map(c => {
                          const val = getPermValue(c.id, perm.key)
                          const changed = changes[c.id]?.[perm.key] !== undefined
                          return (
                            <td key={c.id} className="px-4 py-4 text-center">
                              <button onClick={() => togglePerm(c.id, perm.key)}
                                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto transition-all"
                                style={{ 
                                  background: val ? '#dcfce7' : '#fee2e2',
                                  border: changed ? '2px solid #f97316' : '2px solid transparent'
                                }}>
                                {val ? <Check size={20} style={{ color: '#16a34a' }} /> : <X size={20} style={{ color: '#dc2626' }} />}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#dcfce7' }}>
                  <Check size={16} style={{ color: '#16a34a' }} />
                </div>
                <span className="text-sm" style={{ color: '#64748b' }}>Permitido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fee2e2' }}>
                  <X size={16} style={{ color: '#dc2626' }} />
                </div>
                <span className="text-sm" style={{ color: '#64748b' }}>Negado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fee2e2', border: '2px solid #f97316' }}>
                  <X size={16} style={{ color: '#dc2626' }} />
                </div>
                <span className="text-sm" style={{ color: '#64748b' }}>Alterado (nao guardado)</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
