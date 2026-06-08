'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, X, FileDown } from 'lucide-react'

interface VendaExport {
  id: string
  client_name: string
  client_nif: string
  client_email: string
  client_phone: string
  client_iban: string
  client_address: string
  amount: number
  status: string
  service_type: string
  operator: string
  plano: string
  energia_tipo: string
  is_dual: boolean
  created_at: string
  updated_at: string
  parceiro_name?: string
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_revisao: 'Em Revisão',
  ativa: 'Ativa',
  processado: 'Processado',
  pago: 'Pago',
  cancelado: 'Cancelado',
  rejeitado: 'Rejeitado',
}

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
  const [exporting, setExporting] = useState(false)

  // Funcao para exportar todas as vendas para Excel/CSV
  async function handleExport() {
    setExporting(true)
    try {
      const res = await authFetch('/api/vendas')
      const data = await res.json()
      const vendas: VendaExport[] = data.vendas || []

      if (vendas.length === 0) {
        setResult({ ok: false, message: 'Nenhuma venda para exportar' })
        setExporting(false)
        return
      }

      // Cabecalhos do CSV
      const headers = [
        'Nome Parceiro',
        'Nome Cliente',
        'NIF',
        'Email',
        'Telefone',
        'Morada',
        'Tipo Produto',
        'Operadora',
        'Plano',
        'IBAN',
        'Criado Em',
        'Actualizado Em',
        'Estado',
        'Valor'
      ]

      // Converter vendas para linhas CSV
      const csvRows = vendas.map(v => {
        // Determinar tipo de produto
        let tipoProduto = v.service_type || ''
        if (v.service_type === 'energia') {
          if (v.is_dual) tipoProduto = 'Luz + Gás (Dual)'
          else if (v.energia_tipo === 'gas') tipoProduto = 'Gás'
          else tipoProduto = 'Luz'
        } else if (v.service_type === 'gas') {
          tipoProduto = 'Gás'
        } else if (v.service_type === 'telecom') {
          tipoProduto = 'Telecomunicações'
        } else if (v.service_type === 'seguros') {
          tipoProduto = 'Seguros'
        }

        return [
          v.parceiro_name || '',
          v.client_name || '',
          v.client_nif || '',
          v.client_email || '',
          v.client_phone || '',
          v.client_address || '',
          tipoProduto,
          v.operator || '',
          v.plano || '',
          v.client_iban || '',
          v.created_at ? new Date(v.created_at).toLocaleDateString('pt-PT') : '',
          v.updated_at ? new Date(v.updated_at).toLocaleDateString('pt-PT') : '',
          STATUS_LABELS[v.status] || v.status || '',
          v.amount ? v.amount.toFixed(2).replace('.', ',') : '0,00'
        ]
      })

      // Criar conteudo CSV com BOM para Excel reconhecer UTF-8
      const BOM = '\uFEFF'
      const csvContent = BOM + [
        headers.join(';'),
        ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      ].join('\n')

      // Download do ficheiro
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vendas-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      setResult({ ok: true, message: `${vendas.length} venda(s) exportada(s) com sucesso` })
    } catch (err) {
      setResult({ ok: false, message: 'Erro ao exportar vendas' })
    }
    setExporting(false)
  }



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
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin} />
        <main className="w-full lg:ml-64 pt-16">
          <div className="p-4 md:p-5 max-w-4xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={28} style={{ color: '#0ea5e9' }} />
                <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Import / Export Excel</h1>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium text-white text-sm transition hover:opacity-90 disabled:opacity-50"
                style={{ background: '#059669' }}
              >
                <FileDown size={18} />
                {exporting ? 'A exportar...' : 'Exportar Vendas'}
              </button>
            </div>
            <p className="text-sm mb-8" style={{ color: '#64748b' }}>
              <strong>Import:</strong> Carregue um ficheiro CSV/Excel para actualizar o estado das vendas (colunas: email, estado).
              <br />
              <strong>Export:</strong> Exporte todas as vendas com dados de parceiros, clientes, estados e valores.
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
                <p className="text-lg font-medium mb-1" style={{ color: '#475569' }}>Arraste o ficheiro aqui</p>
                <p className="text-sm mb-6" style={{ color: '#64748b' }}>ou clique para seleccionar (CSV, XLS, XLSX)</p>
                <label className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white cursor-pointer text-sm" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  <Upload size={16} /> Seleccionar Ficheiro
                  <input type="file" accept=".csv,.xls,.xlsx,.txt" onChange={handleFileInput} className="hidden" />
                </label>
                <div className="mt-6">
                  <button onClick={downloadSample} className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#0ea5e9' }}>
                    <Download size={14} /> Descarregar modelo CSV
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={20} style={{ color: '#059669' }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{fileName}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>{rows.length} linha(s) validas encontradas</p>
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
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e2e8f0' }}>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>#</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Email Cliente</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Novo Estado</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td className="px-4 py-2 text-xs" style={{ color: '#9ca3af' }}>{i + 1}</td>
                          <td className="px-4 py-2 text-sm font-medium" style={{ color: '#1e293b' }}>{r.client_email}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#e0e7ff', color: '#0ea5e9' }}>{r.status}</span>
                          </td>
                          <td className="px-4 py-2 text-xs" style={{ color: '#64748b' }}>{r.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 50 && (
                    <div className="p-3 text-center text-xs" style={{ color: '#64748b', background: '#f9fafb' }}>
                      {`Mostrando 50 de ${rows.length} linhas`}
                    </div>
                  )}
                </div>

                <div className="p-5 flex items-center justify-between" style={{ borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <p className="text-sm" style={{ color: '#64748b' }}>
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
            <div className="mt-8 rounded-xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <h2 className="font-semibold mb-3" style={{ color: '#1e293b' }}>Como funciona</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { step: '1', title: 'Prepare o ficheiro', desc: 'Crie um CSV/Excel com colunas "email" e "estado". Os estados validos sao: pendente, em_revisao, ativa, processado, pago, cancelado, rejeitado.' },
                  { step: '2', title: 'Carregue o ficheiro', desc: 'Arraste ou seleccione o ficheiro. O sistema mostra uma pre-visualizacao antes de importar.' },
                  { step: '3', title: 'Confirme o import', desc: 'O sistema actualiza automaticamente o estado de todas as vendas que correspondam ao email do cliente.' },
                ].map(s => (
                  <div key={s.step}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white mb-2" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>{s.step}</div>
                    <h3 className="font-medium text-sm mb-1" style={{ color: '#1e293b' }}>{s.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
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
