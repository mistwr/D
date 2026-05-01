'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { ArrowLeft, Upload, X, FileText, CheckCircle } from 'lucide-react'
import Link from 'next/link'

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const OPERADORAS: Record<string, string[]> = {
  telecom: ['MEO', 'NOS', 'Vodafone', 'NOWO', 'DIGI', 'Outro'],
  energia: ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Outro'],
  gas:     ['Galp', 'EDP', 'Endesa', 'Iberdrola', 'Gold Energy', 'Outro'],
  seguros: ['Fidelidade', 'Tranquilidade', 'Allianz', 'Generali', 'AXA', 'Zurich', 'Outro'],
}

interface FileItem { file: File; name: string; type: string; size: number }

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function NovaVendaPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploadProgress, setUploadProgress] = useState('')

  const [form, setForm] = useState({
    service_type: 'telecom',
    operator: 'MEO',
    plano: '',
    contract_type: '',
    client_name: '',
    client_nif: '',
    client_cc: '',
    client_phone: '',
    client_email: '',
    client_iban: '',
    client_address: '',
    amount: '',
    description: '',
    notes: '',
    energia_tipo: 'eletricidade',
    cpe: '',
    cui: '',
    potencia: '',
    escalao: '',
    is_dual: false,
  })

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).then(d => {
      if (!d.user) router.push('/login')
      else setUser(d.user)
    }).catch(() => router.push('/login'))
  }, [router])

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...newFiles.map(f => ({ file: f, name: f.name, type: f.type || 'application/pdf', size: f.size }))])
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeFile(idx: number) { setFiles(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_nif.trim()) { setError('O NIF do cliente e obrigatorio'); return }
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        is_dual: form.service_type === 'energia' && form.energia_tipo === 'dual',
        energia_tipo: form.service_type === 'energia' ? form.energia_tipo : null,
        cpe: form.service_type === 'energia' ? form.cpe : null,
        cui: form.service_type === 'energia' ? form.cui : null,
        potencia: form.service_type === 'energia' ? form.potencia : null,
        escalao: form.service_type === 'energia' ? form.escalao : null,
      }
      const res = await fetch('/api/vendas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao registar venda'); setLoading(false); return }

      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`A carregar ${i + 1}/${files.length}: ${files[i].name}`)
          const base64 = await toBase64(files[i].file)
          await fetch('/api/documentos', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({
              venda_id: data.venda.id,
              file_name: files[i].name,
              file_type: files[i].type,
              file_size: files[i].size,
              file_data: base64,
            }),
          })
        }
        setUploadProgress('')
      }
      setSuccess(true)
      setTimeout(() => router.push('/vendas'), 2000)
    } catch { setError('Erro de conexao'); setLoading(false) }
  }

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: '#f3f4f6' }}>
      <div className="rounded-full p-4" style={{ background: '#d1fae5' }}>
        <CheckCircle size={48} style={{ color: '#059669' }} />
      </div>
      <p className="text-xl font-bold" style={{ color: '#111827' }}>Venda registada com sucesso!</p>
      <p className="text-sm" style={{ color: '#6b7280' }}>A redirecionar para as suas vendas...</p>
    </div>
  )

  const inp = { background: '#fff', border: '1px solid #d1d5db', color: '#111827' }
  const ops = OPERADORAS[form.service_type] || OPERADORAS.telecom
  const isEnergia = form.service_type === 'energia'

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole={user?.role || 'parceiro'} />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Link href="/vendas" className="rounded-lg p-2 transition hover:bg-gray-200" style={{ color: '#6b7280' }}>
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Registar Nova Venda</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>Preencha os dados do contrato e do cliente</p>
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 mb-4 text-sm font-medium" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* TIPO DE SERVICO */}
              <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: '#6b7280' }}>1. Tipo de Servico</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['telecom', 'energia', 'gas', 'seguros'] as const).map(s => (
                    <button key={s} type="button"
                      onClick={() => { update('service_type', s); update('operator', OPERADORAS[s][0]); update('plano', '') }}
                      className="rounded-lg py-3 text-sm font-semibold border transition"
                      style={{
                        background: form.service_type === s ? '#4f46e5' : '#f9fafb',
                        color: form.service_type === s ? '#fff' : '#374151',
                        border: form.service_type === s ? '1px solid #4f46e5' : '1px solid #e5e7eb',
                      }}>
                      {s === 'telecom' ? 'Telecom' : s === 'energia' ? 'Energia' : s === 'gas' ? 'Gas' : 'Seguros'}
                    </button>
                  ))}
                </div>
              </div>

              {/* OPERADORA */}
              <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: '#6b7280' }}>2. Operadora e Plano</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Operadora *</label>
                    <select value={form.operator} onChange={e => update('operator', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} required>
                      {ops.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Plano / Pacote</label>
                    <input type="text" value={form.plano} onChange={e => update('plano', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}
                      placeholder={form.service_type === 'telecom' ? 'Ex: 3P, 4P, Pack Familia' : 'Ex: Simples, Bi-horario'} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Tipo de Contrato</label>
                    <input type="text" value={form.contract_type} onChange={e => update('contract_type', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}
                      placeholder="Ex: Residencial 24 meses, Empresarial, Mensal" />
                  </div>
                </div>

                {/* ENERGIA: tipo + CPE/CUI */}
                {isEnergia && (
                  <div className="mt-4 space-y-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Tipo de Fornecimento</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { v: 'eletricidade', l: 'Eletricidade' },
                          { v: 'gas', l: 'Gas' },
                          { v: 'dual', l: 'Dual (Elet. + Gas)' },
                        ].map(({ v, l }) => (
                          <button key={v} type="button"
                            onClick={() => update('energia_tipo', v)}
                            className="rounded-lg py-2.5 text-sm font-semibold border transition"
                            style={{
                              background: form.energia_tipo === v ? '#f59e0b' : '#f9fafb',
                              color: form.energia_tipo === v ? '#fff' : '#374151',
                              border: form.energia_tipo === v ? '1px solid #f59e0b' : '1px solid #e5e7eb',
                            }}>
                            {l}
                          </button>
                        ))}
                      </div>
                      {form.energia_tipo === 'dual' && (
                        <p className="mt-2 text-xs" style={{ color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px' }}>
                          Contrato dual: eletricidade e gas associados ao mesmo cliente e processo.
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(form.energia_tipo === 'eletricidade' || form.energia_tipo === 'dual') && (
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>CPE (Eletricidade)</label>
                          <input type="text" value={form.cpe} onChange={e => update('cpe', e.target.value)}
                            className="w-full rounded-lg px-3 py-2.5 text-sm font-mono" style={inp}
                            placeholder="PT00XXXXXXXXXX" />
                        </div>
                      )}
                      {(form.energia_tipo === 'gas' || form.energia_tipo === 'dual') && (
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>CUI (Gas)</label>
                          <input type="text" value={form.cui} onChange={e => update('cui', e.target.value)}
                            className="w-full rounded-lg px-3 py-2.5 text-sm font-mono" style={inp}
                            placeholder="PT00XXXXXXXXXXXX" />
                        </div>
                      )}
                      {(form.energia_tipo === 'eletricidade' || form.energia_tipo === 'dual') && (
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                            Potencia Contratada <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(kVA)</span>
                          </label>
                          <select value={form.potencia} onChange={e => update('potencia', e.target.value)}
                            className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}>
                            <option value="">Selecionar potencia...</option>
                            {['1.15', '2.3', '3.45', '4.6', '5.75', '6.9', '10.35', '13.8', '17.25', '20.7', '27.6', '34.5', '41.4'].map(p => (
                              <option key={p} value={p}>{p} kVA</option>
                            ))}
                            <option value="outro">Outro</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                          Escalao / Ciclo Horario
                        </label>
                        <select value={form.escalao} onChange={e => update('escalao', e.target.value)}
                          className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}>
                          <option value="">Selecionar escalao...</option>
                          <option value="simples">Simples</option>
                          <option value="bi-horario">Bi-horario (Vazio / Fora de Vazio)</option>
                          <option value="tri-horario">Tri-horario (Ponta / Cheia / Vazio)</option>
                          <option value="tetra-horario">Tetra-horario</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DADOS CLIENTE */}
              <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: '#6b7280' }}>3. Dados do Cliente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Nome Completo *</label>
                    <input type="text" value={form.client_name} onChange={e => update('client_name', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} required placeholder="Nome completo do cliente" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>NIF *</label>
                    <input type="text" value={form.client_nif} onChange={e => update('client_nif', e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-lg px-3 py-2.5 text-sm font-mono" style={inp}
                      required placeholder="123456789" maxLength={9} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                      Numero do CC <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(opcional)</span>
                    </label>
                    <input type="text" value={form.client_cc} onChange={e => update('client_cc', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm font-mono" style={inp}
                      placeholder="XXXXXXXX X XXXXXXXX X" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Telefone</label>
                    <input type="tel" value={form.client_phone} onChange={e => update('client_phone', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} placeholder="9XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                      Email <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(opcional)</span>
                    </label>
                    <input type="email" value={form.client_email} onChange={e => update('client_email', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} placeholder="email@exemplo.pt" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                      IBAN <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(opcional)</span>
                    </label>
                    <input type="text" value={form.client_iban} onChange={e => update('client_iban', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm font-mono" style={inp}
                      placeholder="PT50 XXXX XXXX XXXX XXXX XXXX X" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Morada</label>
                    <input type="text" value={form.client_address} onChange={e => update('client_address', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}
                      placeholder="Rua, numero, localidade, codigo postal" />
                  </div>
                </div>
              </div>

              {/* VENDA */}
              <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: '#6b7280' }}>4. Dados da Venda</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Valor do Contrato (€)</label>
                    <input type="number" step="0.01" min="0" value={form.amount} onChange={e => update('amount', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} placeholder="0.00" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Descricao</label>
                    <textarea rows={2} value={form.description} onChange={e => update('description', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm resize-none" style={inp}
                      placeholder="Descricao do servico contratado..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                      Notas Internas <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(apenas visivel para si e admin)</span>
                    </label>
                    <textarea rows={2} value={form.notes} onChange={e => update('notes', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm resize-none" style={inp}
                      placeholder="Notas internas..." />
                  </div>
                </div>
              </div>

              {/* DOCUMENTOS */}
              <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <h2 className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: '#6b7280' }}>5. Documentos Anexos</h2>
                <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>Contratos, faturas, comprovativos ou outros documentos</p>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 w-full rounded-xl px-5 py-4 text-sm transition"
                  style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', color: '#475569' }}>
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg flex-shrink-0" style={{ background: '#eef2ff' }}>
                    <Upload size={18} style={{ color: '#4f46e5' }} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm" style={{ color: '#111827' }}>Clique para adicionar ficheiros</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>PDF, DOC, JPG, PNG</p>
                  </div>
                </button>
                {uploadProgress && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium" style={{ color: '#4f46e5' }}>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2" style={{ borderColor: '#4f46e5' }} />
                    {uploadProgress}
                  </div>
                )}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                        style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                        <FileText size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{f.name}</p>
                          <p className="text-xs" style={{ color: '#9ca3af' }}>{formatSize(f.size)}</p>
                        </div>
                        <button type="button" onClick={() => removeFile(i)} className="rounded p-1 hover:opacity-70">
                          <X size={14} style={{ color: '#dc2626' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ACOES */}
              <div className="flex gap-3 pb-8">
                <Link href="/vendas" className="flex-1">
                  <button type="button" className="w-full rounded-lg py-3 text-sm font-semibold border transition hover:bg-gray-50"
                    style={{ color: '#374151', border: '1px solid #d1d5db' }}>
                    Cancelar
                  </button>
                </Link>
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#4f46e5' }}>
                  {loading ? (uploadProgress || 'A registar...') : `Registar Venda${files.length > 0 ? ` + ${files.length} doc.` : ''}`}
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
