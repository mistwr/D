'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, X } from 'lucide-react'

const STATUS_MAP: Record<string, string> = {
  pendente: 'pendente', em_revisao: 'em_revisao', ativa: 'ativa', ativo: 'ativa',
  processado: 'processado', pago: 'pago', cancelado: 'cancelado', rejeitado: 'rejeitado',
  active: 'ativa', paid: 'pago', cancelled: 'cancelado', rejected: 'rejeitado',
  pending: 'pendente', processing: 'processado', review: 'em_revisao',
}

function parseCSV(text: string) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const header = lines[0].toLowerCase().split(/[,;\t]/).map(h => h.trim().replace(/"/g, ''))
  const emailIdx = header.findIndex(h => h.includes('email'))
  const statusIdx = header.findIndex(h => h.includes('estado') || h.includes('status'))
  const notesIdx = header.findIndex(h => h.includes('nota') || h.includes('notes') || h.includes('obs'))
  if (emailIdx === -1 || statusIdx === -1) return []
  return lines.slice(1).map(line => {
    const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/"/g, ''))
    const rawStatus = cols[statusIdx]?.toLowerCase().replace(/\s+/g, '_') || ''
    return {
      client_email: cols[emailIdx] || '',
      status: STATUS_MAP[rawStatus] || rawStatus,
      notes: notesIdx >= 0 ? cols[notesIdx] : undefined,
    }
  }).filter(r => r.client_email && r.status)
}

export default function ImportPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<{ client_email: string; status: string; notes?: string }[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)



  const processFile = useCallback((file: File) => {
    setResult(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
    }
    reader.readAsText(file)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  async function handleImport() {
    setImporting(true)
    setResult(null)
    try {
      const res = await authFetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      setResult({ ok: res.ok, message: data.message || data.error || 'Erro desconhecido' })
      if (res.ok) { setRows([]); setFileName('') }
    } catch {
      setResult({ ok: false, message: 'Erro de conexao' })
    }
    setImporting(false)
  }

  function clearFile() {
    setRows([])
    setFileName('')
    setResult(null)
  }

  const sampleCSV = 'email;estado;observacoes\ncliente@email.com;ativa;Contrato activado\noutro@email.com;pago;Pagamento confirmado'

  function downloadSample() {
    const blob = new Blob([sampleCSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo-import.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8f9fb' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8 max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
              <FileSpreadsheet size={28} style={{ color: '#4338ca' }} />
              <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>{'Import Excel / CSV'}</h1>
            </div>
            <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
              Carregue um ficheiro CSV ou Excel para actualizar automaticamente o estado das vendas dos parceiros.
              O ficheiro deve ter colunas: <strong>email</strong> (do cliente) e <strong>estado</strong>.
            </p>

            {result && (
              <div className="flex items-center gap-2 rounded-lg p-4 mb-6" style={{ background: result.ok ? '#d1fae5' : '#fef2f2', border: `1px solid ${result.ok ? '#6ee7b7' : '#fca5a5'}` }}>
                {result.ok ? <CheckCircle2 size={18} style={{ color: '#059669' }} /> : <AlertTriangle size={18} style={{ color: '#dc2626' }} />}
                <span className="text-sm font-medium" style={{ color: result.ok ? '#065f46' : '#991b1b' }}>{result.message}</span>
              </div>
            )}

            {/* Upload zone */}
            {rows.length === 0 ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className="rounded-xl p-12 text-center transition-colors"
                style={{
                  background: dragOver ? '#eef2ff' : '#fff',
                  border: `2px dashed ${dragOver ? '#4338ca' : '#d1d5db'}`,
                }}
              >
                <Upload size={48} style={{ color: dragOver ? '#4338ca' : '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium mb-1" style={{ color: '#374151' }}>Arraste o ficheiro aqui</p>
                <p className="text-sm mb-6" style={{ color: '#6b7280' }}>ou clique para seleccionar (CSV, XLS, XLSX)</p>
                <label className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white cursor-pointer text-sm" style={{ background: '#4338ca' }}>
                  <Upload size={16} /> Seleccionar Ficheiro
                  <input type="file" accept=".csv,.xls,.xlsx,.txt" onChange={handleFileInput} className="hidden" />
                </label>
                <div className="mt-6">
                  <button onClick={downloadSample} className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#4338ca' }}>
                    <Download size={14} /> Descarregar modelo CSV
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={20} style={{ color: '#059669' }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#111827' }}>{fileName}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{rows.length} linha(s) validas encontradas</p>
                    </div>
                  </div>
                  <button onClick={clearFile} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium" style={{ color: '#dc2626', border: '1px solid #fca5a5' }}>
                    <X size={14} /> Remover
                  </button>
                </div>

                {/* Preview */}
                <div className="overflow-x-auto" style={{ maxHeight: '320px' }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>#</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Email Cliente</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Novo Estado</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: '#6b7280' }}>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td className="px-4 py-2 text-xs" style={{ color: '#9ca3af' }}>{i + 1}</td>
                          <td className="px-4 py-2 text-sm font-medium" style={{ color: '#111827' }}>{r.client_email}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#e0e7ff', color: '#4338ca' }}>{r.status}</span>
                          </td>
                          <td className="px-4 py-2 text-xs" style={{ color: '#6b7280' }}>{r.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 50 && (
                    <div className="p-3 text-center text-xs" style={{ color: '#6b7280', background: '#f9fafb' }}>
                      {`Mostrando 50 de ${rows.length} linhas`}
                    </div>
                  )}
                </div>

                <div className="p-5 flex items-center justify-between" style={{ borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    {rows.length} venda(s) serao actualizadas com base no email do cliente
                  </p>
                  <button onClick={handleImport} disabled={importing}
                    className="flex items-center gap-2 rounded-lg px-6 py-2.5 font-medium text-white text-sm disabled:opacity-50"
                    style={{ background: '#059669' }}>
                    <CheckCircle2 size={16} />
                    {importing ? 'A importar...' : 'Confirmar Import'}
                  </button>
                </div>
              </div>
            )}

            {/* Instrucoes */}
            <div className="mt-8 rounded-xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <h2 className="font-semibold mb-3" style={{ color: '#111827' }}>Como funciona</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: '1', title: 'Prepare o ficheiro', desc: 'Crie um CSV/Excel com colunas "email" e "estado". Os estados validos sao: pendente, em_revisao, ativa, processado, pago, cancelado, rejeitado.' },
                  { step: '2', title: 'Carregue o ficheiro', desc: 'Arraste ou seleccione o ficheiro. O sistema mostra uma pre-visualizacao antes de importar.' },
                  { step: '3', title: 'Confirme o import', desc: 'O sistema actualiza automaticamente o estado de todas as vendas que correspondam ao email do cliente.' },
                ].map(s => (
                  <div key={s.step}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white mb-2" style={{ background: '#4338ca' }}>{s.step}</div>
                    <h3 className="font-medium text-sm mb-1" style={{ color: '#111827' }}>{s.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
