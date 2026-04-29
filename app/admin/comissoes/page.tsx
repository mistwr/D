'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Percent, Plus, Trash2, Upload, X, Check, Download, Zap, Flame, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

const OPERADORAS_ENERGIA = ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy']
const OPERADORAS_TELECOM = ['MEO', 'NOS', 'Vodafone', 'NOWO', 'DIGI']
const PLANOS_TELECOM = ['1P', '2P', '3P', '4P']
const OPERADORAS_SEGUROS = ['Fidelidade', 'Allianz', 'Generali', 'Tranquilidade', 'Zurich', 'Ageas']

interface ComissaoOp {
  id: string
  operadora: string
  servico_type: string
  plano: string
  valor_comissao: number
  percentagem: number
}

interface FormRow {
  operadora: string
  servico_type: string
  plano: string
  valor_comissao: string
  percentagem: string
}

export default function AdminComissoesPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comissoesOp, setComissoesOp] = useState<ComissaoOp[]>([])
  const [tab, setTab] = useState<'energia' | 'telecom' | 'seguros'>('energia')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormRow>({ operadora: OPERADORAS_ENERGIA[0], servico_type: 'energia', plano: '', valor_comissao: '', percentagem: '' })
  const [preview, setPreview] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    async function load() {
      const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).catch(() => null)
      if (!me?.user || me.user.role !== 'admin') { router.push('/login'); return }
      setUser(me.user)
      const res = await fetch('/api/comissoes', { credentials: 'include' }).then(r => r.json())
      setComissoesOp(res.comissoesOp ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  function flash(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg(text); setMsgType(type)
    setTimeout(() => setMsg(''), 4000)
  }

  async function saveRow() {
    if (!form.operadora) return
    setSaving(true)
    const res = await fetch('/api/comissoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'upsert_operadora', ...form }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) { setComissoesOp(data.comissoesOp ?? []); setShowForm(false); flash('Guardado com sucesso') }
    else flash(data.error || 'Erro ao guardar', 'err')
  }

  async function deleteRow(id: string) {
    await fetch('/api/comissoes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id }),
    })
    setComissoesOp(prev => prev.filter(c => c.id !== id))
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const parsed = rows.map(r => ({
        operadora: String(r['Operadora'] || r['operadora'] || ''),
        servico_type: String(r['Servico'] || r['servico_type'] || 'energia').toLowerCase(),
        plano: String(r['Plano'] || r['plano'] || ''),
        valor_comissao: Number(r['Valor Fixo'] ?? r['valor_comissao'] ?? 0),
        percentagem: Number(r['Percentagem'] ?? r['percentagem'] ?? 0),
      })).filter(r => r.operadora)
      setPreview(parsed)
      setShowPreview(true)
    }
    reader.readAsArrayBuffer(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function importarExcel() {
    if (!preview.length) return
    setImporting(true)
    const res = await fetch('/api/comissoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'import_operadoras', linhas: preview }),
    })
    const data = await res.json()
    setImporting(false)
    if (res.ok) { setComissoesOp(data.comissoesOp ?? []); setShowPreview(false); setPreview([]); flash(`${data.imported} comissoes importadas`) }
  }

  function downloadTemplate() {
    const rows = [
      { Operadora: 'EDP', Servico: 'energia', Plano: '', 'Valor Fixo': 50, Percentagem: 2 },
      { Operadora: 'Yes Energy', Servico: 'energia', Plano: '', 'Valor Fixo': 45, Percentagem: 2.5 },
      { Operadora: 'MEO', Servico: 'telecom', Plano: '3P', 'Valor Fixo': 30, Percentagem: 0 },
      { Operadora: 'MEO', Servico: 'telecom', Plano: '4P', 'Valor Fixo': 40, Percentagem: 0 },
      { Operadora: 'NOS', Servico: 'telecom', Plano: '2P', 'Valor Fixo': 20, Percentagem: 0 },
      { Operadora: 'Fidelidade', Servico: 'seguros', Plano: '', 'Valor Fixo': 20, Percentagem: 5 },
    ]
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Comissoes')
    XLSX.writeFile(wb, 'template_comissoes.xlsx')
  }

  function openForm(tipo: 'energia' | 'telecom' | 'seguros') {
    const opMap = { energia: OPERADORAS_ENERGIA[0], telecom: OPERADORAS_TELECOM[0], seguros: OPERADORAS_SEGUROS[0] }
    setForm({ operadora: opMap[tipo], servico_type: tipo, plano: tipo === 'telecom' ? '3P' : '', valor_comissao: '', percentagem: '' })
    setShowForm(true)
  }

  const tabData = comissoesOp.filter(c => c.servico_type === tab)
  const tabColors = { energia: { text: '#d97706', bg: '#fffbeb', border: '#fde68a' }, telecom: { text: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' }, seguros: { text: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' } }
  const tc = tabColors[tab]
  const inputStyle = { border: '1px solid #d1d5db', background: '#fff', color: '#111827' }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4338ca' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: '#4338ca' }}>
              <ArrowLeft size={16} /> Voltar
            </Link>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Percent size={28} style={{ color: '#4338ca' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Tabela de Comissoes</h1>
                  <p className="text-sm" style={{ color: '#6b7280' }}>Defina os valores por operadora, servico e plano</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={downloadTemplate}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition"
                  style={{ border: '1px solid #d1d5db', color: '#374151', background: '#fff' }}>
                  <Download size={15} /> Template Excel
                </button>
                <label className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer transition"
                  style={{ border: '1px solid #d1d5db', color: '#374151', background: '#fff' }}>
                  <Upload size={15} /> Upload Excel
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                </label>
                <button onClick={() => openForm(tab)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ background: '#4338ca' }}>
                  <Plus size={15} /> Adicionar
                </button>
              </div>
            </div>

            {msg && (
              <div className="mb-5 flex items-center gap-2 rounded-lg p-3 text-sm font-medium"
                style={{ background: msgType === 'ok' ? '#f0fdf4' : '#fef2f2', color: msgType === 'ok' ? '#166534' : '#b91c1c', border: `1px solid ${msgType === 'ok' ? '#86efac' : '#fecaca'}` }}>
                <Check size={15} /> {msg}
              </div>
            )}

            {/* Modal Preview Excel */}
            {showPreview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div className="w-full max-w-2xl rounded-2xl shadow-2xl" style={{ background: '#fff' }}>
                  <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <h2 className="font-bold" style={{ color: '#111827' }}>Preview — {preview.length} linhas</h2>
                    <button onClick={() => { setShowPreview(false); setPreview([]) }} className="rounded-lg p-1.5 hover:bg-gray-100">
                      <X size={18} style={{ color: '#6b7280' }} />
                    </button>
                  </div>
                  <div className="overflow-auto max-h-80 p-4">
                    <table className="w-full text-sm">
                      <thead><tr style={{ background: '#f9fafb' }}>
                        {['Operadora', 'Servico', 'Plano', 'Valor Fixo', '%'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {preview.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td className="px-3 py-2 font-medium" style={{ color: '#111827' }}>{r.operadora}</td>
                            <td className="px-3 py-2" style={{ color: '#374151' }}>{r.servico_type}</td>
                            <td className="px-3 py-2" style={{ color: '#374151' }}>{r.plano || '-'}</td>
                            <td className="px-3 py-2" style={{ color: '#374151' }}>{'\u20AC'}{r.valor_comissao}</td>
                            <td className="px-3 py-2" style={{ color: '#374151' }}>{r.percentagem}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-3 p-5" style={{ borderTop: '1px solid #e5e7eb' }}>
                    <button onClick={() => { setShowPreview(false); setPreview([]) }}
                      className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium"
                      style={{ border: '1px solid #d1d5db', color: '#374151' }}>Cancelar</button>
                    <button onClick={importarExcel} disabled={importing}
                      className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                      style={{ background: '#4338ca' }}>{importing ? 'A importar...' : 'Confirmar Importacao'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Adicionar */}
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
                <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: '#fff' }}>
                  <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <h2 className="font-bold" style={{ color: '#111827' }}>Adicionar Comissao</h2>
                    <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                      <X size={18} style={{ color: '#6b7280' }} />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Servico</label>
                      <select value={form.servico_type} onChange={e => {
                        const tipo = e.target.value as any
                        const opMap: any = { energia: OPERADORAS_ENERGIA[0], telecom: OPERADORAS_TELECOM[0], seguros: OPERADORAS_SEGUROS[0] }
                        setForm(f => ({ ...f, servico_type: tipo, operadora: opMap[tipo], plano: tipo === 'telecom' ? '3P' : '' }))
                      }} className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}>
                        <option value="energia">Energia (Luz / Gas)</option>
                        <option value="telecom">Telecomunicacoes</option>
                        <option value="seguros">Seguros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Operadora</label>
                      <select value={form.operadora} onChange={e => setForm(f => ({ ...f, operadora: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}>
                        {(form.servico_type === 'energia' ? OPERADORAS_ENERGIA : form.servico_type === 'telecom' ? OPERADORAS_TELECOM : OPERADORAS_SEGUROS).map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    {form.servico_type === 'telecom' && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Plano</label>
                        <select value={form.plano} onChange={e => setForm(f => ({ ...f, plano: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle}>
                          {PLANOS_TELECOM.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Valor Fixo (EUR)</label>
                        <input type="number" step="0.01" min="0" value={form.valor_comissao}
                          onChange={e => setForm(f => ({ ...f, valor_comissao: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle} placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Percentagem (%)</label>
                        <input type="number" step="0.1" min="0" max="100" value={form.percentagem}
                          onChange={e => setForm(f => ({ ...f, percentagem: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle} placeholder="0.0" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium"
                        style={{ border: '1px solid #d1d5db', color: '#374151' }}>Cancelar</button>
                      <button onClick={saveRow} disabled={saving}
                        className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                        style={{ background: '#4338ca' }}>{saving ? 'A guardar...' : 'Guardar'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {([
                { key: 'energia', label: 'Energia / Gas', Icon: Flame },
                { key: 'telecom', label: 'Telecomunicacoes', Icon: Zap },
                { key: 'seguros', label: 'Seguros', Icon: Shield },
              ] as const).map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition"
                  style={{
                    background: tab === key ? '#4338ca' : '#fff',
                    color: tab === key ? '#fff' : '#374151',
                    border: '1px solid #e5e7eb',
                  }}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            {/* Tabela */}
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="p-5 flex items-center justify-between" style={{ background: tc.bg, borderBottom: `1px solid ${tc.border}` }}>
                <h2 className="font-bold" style={{ color: tc.text }}>
                  {tab === 'energia' ? 'Energia / Gas' : tab === 'telecom' ? 'Telecomunicacoes' : 'Seguros'} — {tabData.length} {tabData.length === 1 ? 'linha' : 'linhas'}
                </h2>
                <button onClick={() => openForm(tab)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                  style={{ background: tc.text }}>
                  <Plus size={13} /> Adicionar
                </button>
              </div>

              {tabData.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    Nenhuma comissao definida para este servico. Adicione manualmente ou importe via Excel.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Operadora</th>
                        {tab === 'telecom' && (
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Plano</th>
                        )}
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Valor Fixo</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Percentagem</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {tabData.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td className="px-5 py-4 font-medium text-sm" style={{ color: '#111827' }}>{c.operadora}</td>
                          {tab === 'telecom' && (
                            <td className="px-5 py-4">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                                {c.plano || '-'}
                              </span>
                            </td>
                          )}
                          <td className="px-5 py-4 text-sm font-semibold" style={{ color: '#059669' }}>
                            {'\u20AC'}{(c.valor_comissao ?? 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold" style={{ color: '#374151' }}>
                            {(c.percentagem ?? 0).toFixed(1)}%
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => deleteRow(c.id)}
                              className="rounded-lg p-1.5 transition hover:opacity-70"
                              style={{ background: '#fef2f2' }}>
                              <Trash2 size={15} style={{ color: '#dc2626' }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
