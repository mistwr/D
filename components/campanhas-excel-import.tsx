'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { FileSpreadsheet, Upload, X, ChevronRight, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'

const CAMPAIGN_FIELDS = [
  { key: 'title', label: 'Titulo', required: true },
  { key: 'service_type', label: 'Servico (telecom/energia/gas/seguros)', required: true },
  { key: 'operator', label: 'Operadora', required: true },
  { key: 'description', label: 'Descricao', required: false },
  { key: 'status', label: 'Estado (ativa/inativa)', required: false },
]

const VALID_SERVICES = ['telecom', 'energia', 'gas', 'seguros']
const SERVICE_MAP: Record<string, string> = {
  'telecomunicacoes': 'telecom', 'telecomunicação': 'telecom', 'telecomunicacao': 'telecom',
  'telecom': 'telecom', 'energia': 'energia', 'gas': 'gas', 'gás': 'gas',
  'seguros': 'seguros', 'seguro': 'seguros',
}

interface ExcelImportProps {
  onImport: (rows: ImportedCampanha[]) => Promise<{ imported: number; errors: string[] }>
  onClose: () => void
}

export interface ImportedCampanha {
  title: string
  service_type: string
  operator: string
  description?: string
  status?: string
}

type Step = 'upload' | 'map' | 'preview' | 'result'

export function CampanhasExcelImport({ onImport, onClose }: ExcelImportProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, any>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<ImportedCampanha[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const [parseError, setParseError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParseError('')
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        if (!json.length || !json[0]) { setParseError('Ficheiro vazio ou sem cabecalho'); return }
        const hdrs = (json[0] as any[]).map(h => String(h ?? '').trim())
        const dataRows = json.slice(1).filter(r => (r as any[]).some(c => c !== undefined && c !== ''))
        const records = dataRows.map((r: any) => {
          const obj: Record<string, any> = {}
          hdrs.forEach((h, i) => { obj[h] = r[i] ?? '' })
          return obj
        })
        setHeaders(hdrs)
        setRows(records)
        // Auto-map columns
        const autoMap: Record<string, string> = {}
        CAMPAIGN_FIELDS.forEach(f => {
          const match = hdrs.find(h =>
            h.toLowerCase().includes(f.key.toLowerCase()) ||
            (f.key === 'service_type' && (h.toLowerCase().includes('servico') || h.toLowerCase().includes('service') || h.toLowerCase().includes('tipo'))) ||
            (f.key === 'operator' && (h.toLowerCase().includes('operador') || h.toLowerCase().includes('operator'))) ||
            (f.key === 'title' && (h.toLowerCase().includes('titulo') || h.toLowerCase().includes('title') || h.toLowerCase().includes('nome') || h.toLowerCase().includes('campanha'))) ||
            (f.key === 'description' && (h.toLowerCase().includes('descricao') || h.toLowerCase().includes('descricão') || h.toLowerCase().includes('description')))
          )
          if (match) autoMap[f.key] = match
        })
        setMapping(autoMap)
        setStep('map')
      } catch (err) {
        setParseError('Erro ao ler o ficheiro. Verifique se e um Excel valido (.xlsx ou .xls)')
      }
    }
    reader.readAsArrayBuffer(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  function buildPreview() {
    const mapped: ImportedCampanha[] = []
    for (const row of rows) {
      const item: any = {}
      CAMPAIGN_FIELDS.forEach(f => {
        const col = mapping[f.key]
        if (col && row[col] !== undefined && row[col] !== '') {
          item[f.key] = String(row[col]).trim()
        }
      })
      if (!item.title || !item.operator) continue
      // Normalize service_type
      if (item.service_type) {
        const normalized = SERVICE_MAP[item.service_type.toLowerCase()] || item.service_type.toLowerCase()
        item.service_type = VALID_SERVICES.includes(normalized) ? normalized : 'telecom'
      } else {
        item.service_type = 'telecom'
      }
      if (!item.status) item.status = 'ativa'
      mapped.push(item as ImportedCampanha)
    }
    setPreview(mapped)
    setStep('preview')
  }

  async function handleImport() {
    setImporting(true)
    const res = await onImport(preview)
    setResult(res)
    setStep('result')
    setImporting(false)
  }

  const inp = { background: '#fff', border: '1px solid #d1d5db', color: '#1e293b' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" style={{ background: '#fff' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3">
            {step !== 'upload' && step !== 'result' && (
              <button onClick={() => setStep(step === 'preview' ? 'map' : 'upload')} className="rounded-lg p-1.5 hover:bg-gray-100">
                <ArrowLeft size={16} style={{ color: '#64748b' }} />
              </button>
            )}
            <FileSpreadsheet size={20} style={{ color: '#16a34a' }} />
            <h2 className="font-bold text-base" style={{ color: '#1e293b' }}>
              {step === 'upload' && 'Importar Excel'}
              {step === 'map' && 'Mapear Colunas'}
              {step === 'preview' && `Pre-visualizacao (${preview.length} campanhas)`}
              {step === 'result' && 'Resultado da Importacao'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100">
            <X size={18} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className="rounded-xl p-8 text-center cursor-pointer transition-colors"
                style={{ border: '2px dashed #d1d5db', background: '#f9fafb' }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={40} className="mx-auto mb-3" style={{ color: '#9ca3af' }} />
                <p className="font-semibold text-sm mb-1" style={{ color: '#1e293b' }}>Clique para escolher ficheiro Excel</p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>Formatos suportados: .xlsx, .xls, .csv</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
              </div>
              {parseError && (
                <div className="rounded-lg p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{parseError}</div>
              )}
              <div className="rounded-lg p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#166534' }}>Formato esperado</p>
                <p className="text-xs mb-2" style={{ color: '#15803d' }}>O ficheiro deve ter colunas com os seguintes dados:</p>
                <div className="flex flex-wrap gap-2">
                  {CAMPAIGN_FIELDS.map(f => (
                    <span key={f.key} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: '#dcfce7', color: '#166534' }}>
                      {f.label}{f.required ? ' *' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Map columns */}
          {step === 'map' && (
            <div className="space-y-4">
              <div className="rounded-lg p-3 text-sm" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                <strong>{rows.length}</strong> linhas encontradas em <strong>{fileName}</strong>. Mapeie as colunas abaixo.
              </div>
              <div className="space-y-3">
                {CAMPAIGN_FIELDS.map(f => (
                  <div key={f.key} className="flex items-center gap-3">
                    <div className="w-48 flex-shrink-0">
                      <p className="text-sm font-medium" style={{ color: '#1e293b' }}>{f.label}</p>
                      {f.required && <p className="text-xs" style={{ color: '#dc2626' }}>Obrigatorio</p>}
                    </div>
                    <ChevronRight size={14} style={{ color: '#9ca3af' }} className="flex-shrink-0" />
                    <select
                      value={mapping[f.key] || ''}
                      onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                      className="flex-1 rounded-lg px-3 py-2 text-sm"
                      style={inp}
                    >
                      <option value="">-- Nao mapear --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <p className="text-xs mb-2" style={{ color: '#64748b' }}>Primeiras 3 linhas do ficheiro:</p>
                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #e2e8f0' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {headers.map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap" style={{ color: '#475569' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 3).map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                          {headers.map(h => (
                            <td key={h} className="px-3 py-2 whitespace-nowrap" style={{ color: '#1e293b' }}>{String(row[h] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-3">
              {preview.length === 0 ? (
                <div className="rounded-lg p-6 text-center" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <AlertTriangle size={32} className="mx-auto mb-2" style={{ color: '#dc2626' }} />
                  <p className="text-sm font-medium" style={{ color: '#b91c1c' }}>Nenhuma linha valida encontrada</p>
                  <p className="text-xs mt-1" style={{ color: '#dc2626' }}>Verifique se o mapeamento de colunas esta correto</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #e2e8f0' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Titulo', 'Servico', 'Operadora', 'Descricao', 'Estado'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: '#475569' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 20).map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td className="px-3 py-2 font-medium max-w-[160px] truncate" style={{ color: '#1e293b' }}>{row.title}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#f0fdf4', color: '#16a34a' }}>{row.service_type}</span>
                          </td>
                          <td className="px-3 py-2 text-xs" style={{ color: '#475569' }}>{row.operator}</td>
                          <td className="px-3 py-2 text-xs max-w-[160px] truncate" style={{ color: '#64748b' }}>{row.description || '-'}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: row.status === 'ativa' ? '#dcfce7' : '#f9fafb', color: row.status === 'ativa' ? '#166534' : '#6b7280' }}>{row.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 20 && (
                    <p className="px-3 py-2 text-xs" style={{ color: '#9ca3af', borderTop: '1px solid #f1f5f9' }}>
                      + {preview.length - 20} linhas adicionais
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && result && (
            <div className="space-y-4">
              {result.imported > 0 && (
                <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <CheckCircle size={32} style={{ color: '#16a34a' }} />
                  <div>
                    <p className="font-bold text-base" style={{ color: '#166534' }}>{result.imported} campanhas importadas</p>
                    <p className="text-sm mt-0.5" style={{ color: '#15803d' }}>As campanhas foram criadas com sucesso.</p>
                  </div>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <p className="font-semibold text-sm mb-2" style={{ color: '#b91c1c' }}>{result.errors.length} erros durante a importacao:</p>
                  <ul className="space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs" style={{ color: '#dc2626' }}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 flex-shrink-0" style={{ borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm font-medium"
            style={{ border: '1px solid #d1d5db', color: '#475569' }}>
            {step === 'result' ? 'Fechar' : 'Cancelar'}
          </button>
          {step === 'map' && (
            <button
              onClick={buildPreview}
              disabled={!mapping['title'] || !mapping['operator']}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}
            >
              Pre-visualizar
            </button>
          )}
          {step === 'preview' && preview.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
            >
              {importing ? 'A importar...' : `Importar ${preview.length} campanhas`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
