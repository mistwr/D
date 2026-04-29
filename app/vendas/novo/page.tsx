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

export default function NovaVendaPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [files, setFiles] = useState<{ file: File; name: string; type: string; size: number }[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [form, setForm] = useState({
    client_name: '', client_email: '', client_phone: '', client_address: '',
    amount: '', description: '', contract_type: '', notes: '',
    service_type: 'telecom' as string, operator: 'MEO' as string, plano: '',
  })

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).then(d => {
      if (!d.user) router.push('/login')
      else setUser(d.user)
    }).catch(() => router.push('/login'))
  }, [router])

  function update(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...newFiles.map(f => ({ file: f, name: f.name, type: f.type || 'application/pdf', size: f.size }))])
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeFile(idx: number) { setFiles(prev => prev.filter((_, i) => i !== idx)) }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/vendas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro'); setLoading(false); return }

      // Upload ficheiros reais em base64
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
      setTimeout(() => router.push('/vendas'), 1500)
    } catch { setError('Erro de conexao'); setLoading(false) }
  }

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  const inputStyle = { background: '#fff', border: '1px solid #d1d5db', color: '#111827' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole={user.role} />
        <main className="flex-1 md:ml-64 pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-8 max-w-3xl">
            <Link href="/vendas" className="flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: '#4f46e5' }}>
              <ArrowLeft size={16} /> Voltar
            </Link>

            <h1 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>Registar Nova Venda</h1>
            <p className="mb-6 text-sm" style={{ color: '#6b7280' }}>Preencha os dados do cliente, anexe contratos/faturas e submeta</p>

            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg p-4 text-sm font-medium" style={{ background: '#d1fae5', color: '#065f46' }}>
                <CheckCircle size={18} /> Venda e documentos registados com sucesso!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="rounded-lg p-3 text-sm" style={{ background: '#fef2f2', color: '#b91c1c' }}>{error}</div>}

              {/* Cliente */}
              <div className="rounded-xl p-6 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                <h2 className="text-base font-semibold mb-4" style={{ color: '#111827' }}>Dados do Cliente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'client_name', label: 'Nome *', type: 'text', ph: 'Nome completo', req: true },
                    { name: 'client_email', label: 'Email *', type: 'email', ph: 'cliente@email.com', req: true },
                    { name: 'client_phone', label: 'Telefone', type: 'tel', ph: '+351 912 345 678', req: false },
                    { name: 'client_address', label: 'Morada', type: 'text', ph: 'Morada completa', req: false },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>{f.label}</label>
                      <input type={f.type} value={form[f.name as keyof typeof form]} onChange={e => update(f.name, e.target.value)}
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle} placeholder={f.ph} required={f.req} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Servico */}
              <div className="rounded-xl p-6 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                <h2 className="text-base font-semibold mb-4" style={{ color: '#111827' }}>Tipo de Servico</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Servico *</label>
                    <select value={form.service_type} onChange={e => {
                      const st = e.target.value
                      update('service_type', st)
                      update('plano', '')
                      update('operator', st === 'telecom' ? 'MEO' : st === 'seguros' ? 'Fidelidade' : 'EDP')
                    }} className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle}>
                      <option value="telecom">Telecomunicacoes</option>
                      <option value="energia">Energia</option>
                      <option value="gas">Gas</option>
                      <option value="seguros">Seguros</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Operadora *</label>
                    <select value={form.operator} onChange={e => update('operator', e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle}>
                      {(form.service_type === 'telecom'
                        ? ['MEO', 'NOS', 'Vodafone', 'NOWO', 'DIGI']
                        : form.service_type === 'seguros'
                        ? ['Fidelidade', 'Tranquilidade', 'Allianz', 'Generali', 'AXA', 'Zurich']
                        : ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Portologos']
                      ).map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  {form.service_type === 'telecom' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Plano</label>
                      <select value={form.plano} onChange={e => update('plano', e.target.value)}
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle}>
                        <option value="">Selecionar plano</option>
                        <option value="1P">1P (1 servico)</option>
                        <option value="2P">2P (2 servicos)</option>
                        <option value="3P">3P (3 servicos)</option>
                        <option value="4P">4P (4 servicos)</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Descricao do contrato</label>
                    <input type="text" value={form.contract_type} onChange={e => update('contract_type', e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle}
                      placeholder="Ex: Contrato residencial 2 anos" />
                  </div>
                </div>
              </div>

              {/* Venda */}
              <div className="rounded-xl p-6 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                <h2 className="text-base font-semibold mb-4" style={{ color: '#111827' }}>Dados da Venda</h2>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Valor (EUR) *</label>
                  <input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} step="0.01" min="0"
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none max-w-xs" style={inputStyle} placeholder="1500.00" required />
                </div>
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Descricao</label>
                  <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3}
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none" style={inputStyle} placeholder="Detalhes da venda..." />
                </div>
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>Notas internas</label>
                  <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2}
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none" style={inputStyle} placeholder="Notas..." />
                </div>
              </div>

              {/* Upload Documentos */}
              <div className="rounded-xl p-6 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                <h2 className="text-base font-semibold mb-1" style={{ color: '#111827' }}>Contratos e Documentos</h2>
                <p className="mb-4 text-sm" style={{ color: '#6b7280' }}>Anexe contratos assinados, faturas, comprovativos ou outros documentos</p>

                <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={handleFiles} className="hidden" />

                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 w-full rounded-xl px-6 py-5 text-sm font-medium transition-all text-left"
                  style={{ background: '#f8fafc', color: '#475569', border: '2px dashed #cbd5e1' }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#e0e7ff' }}>
                    <Upload size={20} style={{ color: '#4f46e5' }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#111827' }}>Clique para adicionar ficheiros</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max 10MB por ficheiro)</p>
                  </div>
                </button>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-11 items-center justify-center rounded text-xs font-bold" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                            {f.name.split('.').pop()?.toUpperCase() || 'DOC'}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#111827' }}>{f.name}</p>
                            <p className="text-xs" style={{ color: '#9ca3af' }}>{formatSize(f.size)}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeFile(i)} className="rounded p-1 transition-colors hover:opacity-70" style={{ color: '#ef4444' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs mt-2 font-medium" style={{ color: '#4f46e5' }}>{files.length} ficheiro(s) prontos para enviar</p>
                  </div>
                )}

                {uploadProgress && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#4f46e5' }} />
                    <p className="text-sm font-medium" style={{ color: '#4f46e5' }}>{uploadProgress}</p>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button type="submit" disabled={loading || success}
                  className="rounded-lg px-6 py-3 font-medium text-white disabled:opacity-50 transition-all"
                  style={{ background: '#4f46e5' }}>
                  {loading ? 'A registar...' : `Registar Venda${files.length > 0 ? ` + ${files.length} Documento(s)` : ''}`}
                </button>
                <Link href="/vendas">
                  <button type="button" className="rounded-lg px-6 py-3 font-medium transition-all" style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>
                    Cancelar
                  </button>
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
