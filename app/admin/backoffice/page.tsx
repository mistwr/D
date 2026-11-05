'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { readJSON, loadWithState } from '@/lib/utils/request'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import {
  Upload, FileSpreadsheet, Download, RefreshCw, X, CheckCircle2, Clock, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Search, Database,
} from 'lucide-react'
import {
  CAMPOS, CAMPO_LABEL, DIVERGENCIA_LABEL, ESTADO_LABEL, OPERADORAS_CONHECIDAS, reconciliar,
  type Campo, type Estado, type FicheiroFonte, type LinhaReconciliada, type VendaCrm,
} from '@/lib/backoffice/reconcile'
import { exportarExcel, lerFicheiro, type FolhaCarregada, type TipoFolha } from '@/lib/backoffice/excel'

const COR: Record<Estado, { bg: string; color: string; icon: typeof CheckCircle2 }> = {
  ativo: { bg: '#d1fae5', color: '#065f46', icon: CheckCircle2 },
  pendente: { bg: '#fef3c7', color: '#92400e', icon: Clock },
  anulado: { bg: '#fee2e2', color: '#991b1b', icon: XCircle },
}
const STATUS_CRM_LABEL: Record<string, string> = {
  pendente: 'Pendente', em_revisao: 'Em Revisão', em_ativacao: 'Em Ativação', ativa: 'Ativa', pago: 'Pago',
  cancelado: 'Cancelado', rejeitado: 'Rejeitado', chargeback: 'Chargeback',
  pendente_ativacao_sms: 'Pend. Ativação SMS', pendente_chamada: 'Pend. Chamada', cliente_nao_atende: 'Não atende',
}
const POR_PAGINA = 200

function Badge({ estado }: { estado: Estado }) {
  const c = COR[estado]
  const Icon = c.icon
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ background: c.bg, color: c.color }}>
      <Icon size={12} /> {ESTADO_LABEL[estado]}
    </span>
  )
}

export default function BackofficePage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [vendas, setVendas] = useState<VendaCrm[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadVersion, setLoadVersion] = useState(0)

  const [folhas, setFolhas] = useState<FolhaCarregada[]>([])
  const [lendo, setLendo] = useState(false)
  const [erroFicheiro, setErroFicheiro] = useState('')
  const [aberta, setAberta] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [aba, setAba] = useState<string>('resumo')
  const [filtroEstado, setFiltroEstado] = useState<Estado | 'todos'>('todos')
  const [filtroParceiro, setFiltroParceiro] = useState('todos')
  const [pesquisa, setPesquisa] = useState('')
  const [pagina, setPagina] = useState(1)

  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [confirmar, setConfirmar] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true); setLoadError('')
    void loadWithState(() => authFetch('/api/vendas').then(readJSON), {
      success: (d) => { if (active) setVendas(d.vendas || []) },
      failure: (m) => { if (active) setLoadError(m) },
      finished: () => { if (active) setLoading(false) },
    })
    return () => { active = false }
  }, [user, authFetch, loadVersion])

  const fontes: FicheiroFonte[] = useMemo(
    () => folhas.filter((f) => f.tipo !== 'ignorar').map((f) => ({ ...f, tipo: f.tipo as FicheiroFonte['tipo'] })),
    [folhas],
  )
  const temOperadora = fontes.some((f) => f.tipo === 'operadora')
  const resultado = useMemo(() => (fontes.length ? reconciliar(vendas, fontes) : null), [vendas, fontes])

  // Por defeito ficam selecionadas as mudanças que vêm do reporte da operadora.
  useEffect(() => {
    if (!resultado) { setSelecionadas(new Set()); return }
    setSelecionadas(new Set(resultado.linhas.filter((l) => l.sugestaoStatus && l.origemEstado === 'operadora').map((l) => l.chave)))
    setConfirmar(false)
  }, [resultado])

  useEffect(() => { setPagina(1) }, [aba, filtroEstado, filtroParceiro, pesquisa])

  async function adicionarFicheiros(files: FileList | null) {
    if (!files?.length) return
    setLendo(true); setErroFicheiro(''); setMensagem('')
    try {
      const novas: FolhaCarregada[] = []
      for (const f of Array.from(files)) {
        const lidas = await lerFicheiro(f)
        if (!lidas.length) setErroFicheiro(`"${f.name}" não tem linhas com dados.`)
        novas.push(...lidas)
      }
      setFolhas((prev) => [...prev, ...novas])
      if (novas.some((n) => n.tipo !== 'ignorar')) setAba('resumo')
    } catch (e) {
      setErroFicheiro(e instanceof Error ? `Não consegui ler o ficheiro: ${e.message}` : 'Não consegui ler o ficheiro.')
    } finally {
      setLendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function atualizarFolha(id: string, patch: Partial<FolhaCarregada>) {
    setFolhas((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  function mapear(id: string, campo: Campo, coluna: string) {
    setFolhas((prev) => prev.map((f) => {
      if (f.id !== id) return f
      const m = { ...f.mapeamento }
      if (coluna) m[campo] = coluna
      else delete m[campo]
      return { ...f, mapeamento: m }
    }))
  }

  const parceiros = useMemo(() => [...new Set((resultado?.linhas ?? []).map((l) => l.parceiro))].sort(), [resultado])

  const visiveis: LinhaReconciliada[] = useMemo(() => {
    if (!resultado) return []
    const q = pesquisa.trim().toLowerCase()
    return resultado.linhas.filter((l) => {
      if (aba === 'divergencias' && !l.divergencias.length) return false
      if (aba !== 'todas' && aba !== 'divergencias' && aba !== 'resumo' && l.operadora !== aba) return false
      if (filtroEstado !== 'todos' && l.estadoFinal !== filtroEstado) return false
      if (filtroParceiro !== 'todos' && l.parceiro !== filtroParceiro) return false
      if (q && !`${l.cliente} ${l.nif} ${l.identificador} ${l.parceiro}`.toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => ({ ativo: 0, pendente: 1, anulado: 2 }[a.estadoFinal] - { ativo: 0, pendente: 1, anulado: 2 }[b.estadoFinal]) || a.cliente.localeCompare(b.cliente))
  }, [resultado, aba, filtroEstado, filtroParceiro, pesquisa])

  const contagemAba = useMemo(() => {
    const c = { ativo: 0, pendente: 0, anulado: 0 }
    if (!resultado) return c
    for (const l of resultado.linhas) {
      if (aba === 'divergencias' && !l.divergencias.length) continue
      if (aba !== 'todas' && aba !== 'divergencias' && aba !== 'resumo' && l.operadora !== aba) continue
      c[l.estadoFinal]++
    }
    return c
  }, [resultado, aba])

  const paraAplicar = (resultado?.linhas ?? []).filter((l) => l.vendaId && l.sugestaoStatus && selecionadas.has(l.chave))

  async function aplicar() {
    if (!paraAplicar.length) return
    setAplicando(true); setMensagem('')
    try {
      const res = await authFetch('/api/backoffice/aplicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: paraAplicar.map((l) => ({ id: l.vendaId, status: l.sugestaoStatus })) }),
      })
      const d = await readJSON<{ atualizadas: number; ignoradas: { id: string; motivo: string }[] }>(res)
      const ignoradas = new Set(d.ignoradas.map((i) => i.id))
      const novo = new Map(paraAplicar.filter((l) => !ignoradas.has(l.vendaId!)).map((l) => [l.vendaId!, l.sugestaoStatus!]))
      setVendas((prev) => prev.map((v) => (novo.has(v.id) ? { ...v, status: novo.get(v.id)! } : v)))
      setMensagem(`${d.atualizadas} venda(s) atualizada(s) no CRM${d.ignoradas.length ? ` · ${d.ignoradas.length} ignorada(s)` : ''}.`)
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : 'Erro ao atualizar o CRM.')
    } finally {
      setAplicando(false); setConfirmar(false)
    }
  }

  function exportar() {
    if (!resultado) return
    exportarExcel(resultado, `backoffice_operadoras_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} /></div>
  }
  if (loadError) return <div className="min-h-screen bg-slate-50"><Navbar user={user} /><Sidebar userRole={user?.role} /><main className="p-6 pt-24 md:ml-64"><p role="alert" className="mb-4 text-red-700">{loadError}</p><button className="rounded-lg bg-sky-600 px-4 py-2 text-white" onClick={() => setLoadVersion((v) => v + 1)}>Tentar novamente</button></main></div>
  if (!user) return <div>Erro de autenticacao</div>

  const abas = resultado ? ['resumo', 'todas', ...resultado.resumo.map((r) => r.operadora), 'divergencias'] : []
  const card = { background: '#ffffff', border: '1px solid #e2e8f0' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="flex-1 md:ml-64 pt-14 md:pt-16 min-w-0" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#1e293b' }}>Backoffice Operadoras</h1>
                <p style={{ color: '#64748b' }}>Cruza o CRM com os reportes das operadoras e a tua planilha: ativos, pendentes e anulados por operadora e parceiro.</p>
              </div>
              {resultado && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={exportar} className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                    <Download size={18} /> Exportar Excel
                  </button>
                </div>
              )}
            </div>

            {/* Fontes */}
            <section className="rounded-2xl p-4 md:p-5 space-y-4" style={card}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-2.5" style={{ background: '#e0f2fe' }}><Database size={20} style={{ color: '#0284c7' }} /></div>
                  <div>
                    <p className="font-semibold" style={{ color: '#1e293b' }}>CRM Soluções Diferentes</p>
                    <p className="text-sm" style={{ color: '#64748b' }}>{vendas.length} vendas lidas diretamente da base de dados</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setLoadVersion((v) => v + 1)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium" style={{ background: '#f1f5f9', color: '#334155' }}>
                    <RefreshCw size={16} /> Recarregar CRM
                  </button>
                  <button onClick={() => inputRef.current?.click()} disabled={lendo} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', opacity: lendo ? 0.6 : 1 }}>
                    <Upload size={16} /> {lendo ? 'A ler…' : 'Adicionar ficheiros'}
                  </button>
                  <input ref={inputRef} type="file" multiple accept=".xlsx,.xls,.xlsm,.csv,.ods" className="hidden" onChange={(e) => adicionarFicheiros(e.target.files)} />
                </div>
              </div>

              {!folhas.length && (
                <button
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); adicionarFicheiros(e.dataTransfer.files) }}
                  className="w-full rounded-xl border-2 border-dashed p-8 text-center"
                  style={{ borderColor: '#cbd5e1', color: '#64748b' }}
                >
                  <FileSpreadsheet size={32} className="mx-auto mb-2" style={{ color: '#94a3b8' }} />
                  <p className="font-medium" style={{ color: '#334155' }}>Arrasta para aqui os reportes das operadoras e a tua planilha</p>
                  <p className="text-sm mt-1">Excel ou CSV. Cada aba é lida em separado; as colunas (NIF, CPE, telefone, estado…) são detetadas automaticamente.</p>
                </button>
              )}
              {erroFicheiro && <p className="text-sm" style={{ color: '#b91c1c' }}>{erroFicheiro}</p>}

              {folhas.length > 0 && (
                <div className="space-y-2">
                  {folhas.map((f) => {
                    const mapeados = CAMPOS.filter((c) => f.mapeamento[c])
                    const semChave = !(f.mapeamento.nif || f.mapeamento.cpe || f.mapeamento.cui || f.mapeamento.telefone || f.mapeamento.contrato || f.mapeamento.email)
                    const semEstado = !f.mapeamento.estado && !f.estadoPadrao
                    return (
                      <div key={f.id} className="rounded-xl" style={{ border: '1px solid #e2e8f0', opacity: f.tipo === 'ignorar' ? 0.6 : 1 }}>
                        <div className="flex flex-col lg:flex-row lg:items-center gap-2 p-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileSpreadsheet size={18} style={{ color: '#16a34a' }} className="shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: '#1e293b' }}>{f.nome}</p>
                              <p className="text-xs" style={{ color: '#64748b' }}>
                                {f.totalLinhas} linhas · {mapeados.map((c) => CAMPO_LABEL[c]).join(', ') || 'sem colunas reconhecidas'}
                              </p>
                              {f.tipo !== 'ignorar' && (semChave || (f.tipo === 'operadora' && semEstado)) && (
                                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#b45309' }}>
                                  <AlertTriangle size={12} /> {semChave ? 'Falta uma coluna para cruzar (NIF, CPE, telefone…)' : 'Falta a coluna de estado'} — ajusta em “Colunas”.
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <select value={f.tipo} onChange={(e) => atualizarFolha(f.id, { tipo: e.target.value as TipoFolha })} className="rounded-lg px-2 py-1.5 text-sm" style={{ border: '1px solid #cbd5e1' }}>
                              <option value="operadora">Reporte da operadora</option>
                              <option value="interna">Planilha interna</option>
                              <option value="ignorar">Ignorar</option>
                            </select>
                            <select value={f.operadora ?? ''} onChange={(e) => atualizarFolha(f.id, { operadora: e.target.value })} className="rounded-lg px-2 py-1.5 text-sm" style={{ border: '1px solid #cbd5e1' }} title="Operadora do ficheiro (se não tiver coluna de operadora)">
                              <option value="">{f.mapeamento.operadora ? 'Operadora: da coluna' : 'Operadora: auto'}</option>
                              {OPERADORAS_CONHECIDAS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <button onClick={() => setAberta(aberta === f.id ? null : f.id)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium" style={{ background: '#f1f5f9', color: '#334155' }}>
                              Colunas {aberta === f.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button onClick={() => setFolhas((prev) => prev.filter((x) => x.id !== f.id))} className="rounded-lg p-1.5" style={{ color: '#94a3b8' }} aria-label="Remover">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        {aberta === f.id && (
                          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2 border-t p-3" style={{ borderColor: '#e2e8f0' }}>
                            {CAMPOS.map((c) => (
                              <label key={c} className="text-xs" style={{ color: '#64748b' }}>
                                {CAMPO_LABEL[c]}
                                <select value={f.mapeamento[c] ?? ''} onChange={(e) => mapear(f.id, c, e.target.value)} className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm" style={{ border: '1px solid #cbd5e1', color: '#1e293b' }}>
                                  <option value="">—</option>
                                  {f.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                                </select>
                              </label>
                            ))}
                            <label className="text-xs" style={{ color: '#64748b' }}>
                              Estado fixo (sem coluna)
                              <input value={f.estadoPadrao ?? ''} onChange={(e) => atualizarFolha(f.id, { estadoPadrao: e.target.value })} placeholder="ex.: Anulado" className="mt-1 w-full rounded-lg px-2 py-1.5 text-sm" style={{ border: '1px solid #cbd5e1', color: '#1e293b' }} />
                            </label>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {!temOperadora && fontes.length > 0 && (
                    <p className="text-sm" style={{ color: '#b45309' }}>Ainda não há nenhum reporte de operadora — o estado vem da planilha interna e do CRM.</p>
                  )}
                </div>
              )}
            </section>

            {resultado && (
              <>
                {/* Totais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['ativo', 'pendente', 'anulado'] as Estado[]).map((e) => (
                    <button key={e} onClick={() => { setAba('todas'); setFiltroEstado(e) }} className="rounded-2xl p-4 text-left" style={card}>
                      <p className="text-sm font-medium" style={{ color: COR[e].color }}>{ESTADO_LABEL[e]}</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: '#1e293b' }}>{resultado.totais[e]}</p>
                    </button>
                  ))}
                  <button onClick={() => { setAba('divergencias'); setFiltroEstado('todos') }} className="rounded-2xl p-4 text-left" style={card}>
                    <p className="text-sm font-medium" style={{ color: '#b45309' }}>Divergências</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#1e293b' }}>{resultado.totais.divergencias}</p>
                  </button>
                </div>

                {/* Aplicar ao CRM */}
                <div className="rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3" style={{ ...card, borderColor: paraAplicar.length ? '#fcd34d' : '#e2e8f0' }}>
                  <div>
                    <p className="font-semibold" style={{ color: '#1e293b' }}>
                      {paraAplicar.length ? `${paraAplicar.length} venda(s) para atualizar no CRM` : 'O CRM já está alinhado com os ficheiros selecionados'}
                    </p>
                    <p className="text-sm" style={{ color: '#64748b' }}>
                      Ativo → Ativa · Pendente → Em Ativação · Anulado → Cancelado. Vendas já pagas não são alteradas. Escolhe as linhas na tabela.
                    </p>
                    {mensagem && <p className="text-sm mt-1 font-medium" style={{ color: '#0369a1' }}>{mensagem}</p>}
                  </div>
                  {paraAplicar.length > 0 && (
                    confirmar ? (
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmar(false)} className="rounded-xl px-4 py-2 text-sm font-medium" style={{ background: '#f1f5f9', color: '#334155' }}>Cancelar</button>
                        <button onClick={aplicar} disabled={aplicando} className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: '#dc2626', opacity: aplicando ? 0.6 : 1 }}>
                          {aplicando ? 'A atualizar…' : `Confirmar ${paraAplicar.length}`}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmar(true)} className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        Atualizar CRM
                      </button>
                    )
                  )}
                </div>

                {/* Abas */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {abas.map((a) => {
                    const label = a === 'resumo' ? 'Resumo' : a === 'todas' ? 'Todas' : a === 'divergencias' ? `Divergências (${resultado.totais.divergencias})` : `${a} (${resultado.resumo.find((r) => r.operadora === a)?.total ?? 0})`
                    return (
                      <button key={a} onClick={() => setAba(a)} className="rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap"
                        style={{ background: aba === a ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : '#ffffff', color: aba === a ? '#ffffff' : '#475569', border: '1px solid #e2e8f0' }}>
                        {label}
                      </button>
                    )
                  })}
                </div>

                {aba === 'resumo' ? (
                  <div className="rounded-2xl overflow-x-auto" style={card}>
                    <table className="w-full text-sm">
                      <thead><tr style={{ background: '#f8fafc', color: '#64748b' }}>
                        {['Operadora', 'Ativos', 'Pendentes', 'Anulados', 'Divergências', 'Total', 'Reporte'].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {resultado.resumo.map((r) => (
                          <tr key={r.operadora} className="border-t cursor-pointer hover:bg-slate-50" style={{ borderColor: '#f1f5f9' }} onClick={() => setAba(r.operadora)}>
                            <td className="px-4 py-3 font-semibold" style={{ color: '#1e293b' }}>{r.operadora}</td>
                            <td className="px-4 py-3" style={{ color: COR.ativo.color }}>{r.ativo}</td>
                            <td className="px-4 py-3" style={{ color: COR.pendente.color }}>{r.pendente}</td>
                            <td className="px-4 py-3" style={{ color: COR.anulado.color }}>{r.anulado}</td>
                            <td className="px-4 py-3" style={{ color: r.divergencias ? '#b45309' : '#94a3b8' }}>{r.divergencias}</td>
                            <td className="px-4 py-3 font-semibold">{r.total}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{resultado.operadorasComReporte.includes(r.operadora) ? '✓ ficheiro' : 'só CRM'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-2xl" style={card}>
                    <div className="flex flex-col md:flex-row gap-2 p-3 border-b" style={{ borderColor: '#e2e8f0' }}>
                      <div className="flex gap-1 overflow-x-auto">
                        {(['todos', 'ativo', 'pendente', 'anulado'] as const).map((e) => (
                          <button key={e} onClick={() => setFiltroEstado(e)} className="rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap"
                            style={{ background: filtroEstado === e ? '#1e293b' : '#f1f5f9', color: filtroEstado === e ? '#ffffff' : '#475569' }}>
                            {e === 'todos' ? `Todos (${contagemAba.ativo + contagemAba.pendente + contagemAba.anulado})` : `${ESTADO_LABEL[e]} (${contagemAba[e]})`}
                          </button>
                        ))}
                      </div>
                      <select value={filtroParceiro} onChange={(e) => setFiltroParceiro(e.target.value)} className="rounded-lg px-2 py-1.5 text-sm md:ml-auto" style={{ border: '1px solid #cbd5e1' }}>
                        <option value="todos">Todos os parceiros</option>
                        {parceiros.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
                        <input value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Cliente, NIF, CPE, telefone" className="w-full md:w-60 rounded-lg py-1.5 pl-8 pr-2 text-sm" style={{ border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr style={{ background: '#f8fafc', color: '#64748b' }}>
                          <th className="px-3 py-2.5 text-left font-medium w-8">
                            <input type="checkbox" aria-label="Selecionar todas" checked={visiveis.some((l) => l.sugestaoStatus && l.vendaId) && visiveis.filter((l) => l.sugestaoStatus && l.vendaId).every((l) => selecionadas.has(l.chave))}
                              onChange={(e) => setSelecionadas((prev) => {
                                const s = new Set(prev)
                                visiveis.filter((l) => l.sugestaoStatus && l.vendaId).forEach((l) => (e.target.checked ? s.add(l.chave) : s.delete(l.chave)))
                                return s
                              })} />
                          </th>
                          {['Estado', 'Cliente', 'NIF', 'CPE / Tel.', 'Parceiro', 'Operadora', 'Operadora diz', 'Interna diz', 'CRM', 'Divergência'].map((h) => <th key={h} className="px-3 py-2.5 text-left font-medium whitespace-nowrap">{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {visiveis.slice(0, pagina * POR_PAGINA).map((l) => (
                            <tr key={l.chave} className="border-t align-top" style={{ borderColor: '#f1f5f9', background: l.divergencias.length ? '#fffbeb' : undefined }}>
                              <td className="px-3 py-2.5">
                                {l.sugestaoStatus && l.vendaId ? (
                                  <input type="checkbox" aria-label="Atualizar no CRM" checked={selecionadas.has(l.chave)}
                                    onChange={(e) => setSelecionadas((prev) => { const s = new Set(prev); if (e.target.checked) s.add(l.chave); else s.delete(l.chave); return s })} />
                                ) : null}
                              </td>
                              <td className="px-3 py-2.5"><Badge estado={l.estadoFinal} /></td>
                              <td className="px-3 py-2.5 font-medium" style={{ color: '#1e293b' }}>{l.cliente || '—'}</td>
                              <td className="px-3 py-2.5 font-mono text-xs">{l.nif || '—'}</td>
                              <td className="px-3 py-2.5 font-mono text-xs">{l.identificador || '—'}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap">{l.parceiro}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap">{l.operadora}</td>
                              <td className="px-3 py-2.5 text-xs" style={{ color: '#475569' }}>{l.estadoOperadoraTexto || '—'}</td>
                              <td className="px-3 py-2.5 text-xs" style={{ color: '#475569' }}>{l.estadoInternaTexto || '—'}</td>
                              <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: '#475569' }}>
                                {l.statusCrm ? (STATUS_CRM_LABEL[l.statusCrm] ?? l.statusCrm) : <span style={{ color: '#b45309' }}>não existe</span>}
                                {l.sugestaoStatus && <span className="block font-semibold" style={{ color: '#d97706' }}>→ {STATUS_CRM_LABEL[l.sugestaoStatus]}</span>}
                              </td>
                              <td className="px-3 py-2.5 text-xs" style={{ color: '#b45309' }}>{l.divergencias.map((d) => DIVERGENCIA_LABEL[d]).join(' · ')}</td>
                            </tr>
                          ))}
                          {!visiveis.length && <tr><td colSpan={11} className="px-3 py-8 text-center" style={{ color: '#94a3b8' }}>Sem linhas com estes filtros.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    {visiveis.length > pagina * POR_PAGINA && (
                      <div className="p-3 text-center border-t" style={{ borderColor: '#e2e8f0' }}>
                        <button onClick={() => setPagina((p) => p + 1)} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: '#f1f5f9', color: '#334155' }}>
                          Mostrar mais ({visiveis.length - pagina * POR_PAGINA} restantes)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
