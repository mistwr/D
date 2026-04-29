'use client'

import { useState } from 'react'
import { Upload, X, Check, AlertCircle } from 'lucide-react'

const OPERADORAS_ENERGIA = ['EDP', 'Endesa', 'Portologos', 'Repsol', 'Iberdrola', 'Yes Energy']
const OPERADORAS_TELECOM = ['MEO', 'NOS', 'Vodafone', 'DIGI']

interface ComissaoRow {
  operadora: string
  servico_type: string
  percentual: number
  valor_fixo: number
}

export default function AdminComissoesPage() {
  const [user, setUser] = useState<any>(null)
  const [comissoes, setComissoes] = useState<ComissaoRow[]>([])
  const [preview, setPreview] = useState<ComissaoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  // Fetch inicial
  const loadData = async () => {
    try {
      const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json())
      if (!me.user || me.user.role !== 'admin') window.location.href = '/login'
      setUser(me.user)

      const res = await fetch('/api/comissoes', { credentials: 'include' })
      const data = await res.json()
      setComissoes(data.comissoes || [])
    } catch (e) {
      console.error('[v0] Error loading:', e)
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    loadData()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setMessage('')

      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const csv = event.target?.result as string
          const linhas = csv.split('\n').slice(1).filter(l => l.trim())
          const rows: ComissaoRow[] = linhas.map(linha => {
            const cols = linha.split(',').map(c => c.trim())
            return {
              operadora: cols[0],
              servico_type: cols[1]?.toLowerCase() === 'energia' ? 'energia' : 'telecom',
              percentual: parseFloat(cols[2]) || 0,
              valor_fixo: parseFloat(cols[3]) || 0,
            }
          })
          setPreview(rows)
          setMessage(`Preview: ${rows.length} linhas carregadas`)
        } catch (err) {
          setMessage('Erro ao processar ficheiro')
        }
      }
      reader.readAsText(file)
    } finally {
      setUploading(false)
    }
  }

  const handleImport = async () => {
    if (preview.length === 0) return
    setUploading(true)
    try {
      const res = await fetch('/api/comissoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'import', linhas: preview }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(`✓ ${data.imported} comissoes importadas`)
        setComissoes(data.comissoes || [])
        setPreview([])
      } else {
        setMessage('Erro ao importar')
      }
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: '20px' }}>A carregar...</div>

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>
        Comissoes por Operadora
      </h1>

      {/* Upload Section */}
      <div style={{ marginBottom: '30px', background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#111827' }}>
          Importar do Excel
        </h2>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
          Formato: Operadora | Servico | % Comissao | Valor Fixo
        </p>
        <label style={{ display: 'block', cursor: 'pointer', background: '#eef2ff', border: '2px dashed #4338ca', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
          <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} style={{ display: 'none' }} />
          <Upload size={24} style={{ marginRight: '8px', display: 'inline' }} />
          Clique ou arraste ficheiro CSV
        </label>
        {message && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '12px' }}>
            {message}
          </div>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div style={{ marginBottom: '20px', background: '#fef3c7', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Preview - {preview.length} linhas</h3>
          <div style={{ overflowX: 'auto', marginBottom: '10px', maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fcd34d' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #f59e0b' }}>Operadora</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #f59e0b' }}>Serviço</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #f59e0b' }}>%</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #f59e0b' }}>Fixo</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f59e0b' }}>
                    <td style={{ padding: '6px' }}>{row.operadora}</td>
                    <td style={{ padding: '6px' }}>{row.servico_type === 'energia' ? 'Energia' : 'Telecom'}</td>
                    <td style={{ padding: '6px' }}>{row.percentual}%</td>
                    <td style={{ padding: '6px' }}>{row.valor_fixo}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleImport} disabled={uploading} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
            {uploading ? 'A importar...' : 'Confirmar Import'}
          </button>
          <button onClick={() => setPreview([])} style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', marginLeft: '8px' }}>
            Cancelar
          </button>
        </div>
      )}

      {/* Current Comissoes */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
          Comissoes Actuais ({comissoes.length})
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#111827', fontWeight: '600' }}>Operadora</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#111827', fontWeight: '600' }}>Serviço</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#111827', fontWeight: '600' }}>% Comissão</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#111827', fontWeight: '600' }}>Valor Fixo</th>
              </tr>
            </thead>
            <tbody>
              {comissoes.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                    Sem comissoes configuradas
                  </td>
                </tr>
              ) : (
                comissoes.map((com, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', color: '#111827', fontWeight: '500' }}>{com.operadora}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: com.servico_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: com.servico_type === 'energia' ? '#92400e' : '#4338ca', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                        {com.servico_type === 'energia' ? 'Energia' : 'Telecom'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#111827', fontWeight: '600' }}>{com.percentual}%</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#111827' }}>{com.valor_fixo}€</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Template Download */}
      <div style={{ marginTop: '20px', padding: '12px', background: '#dbeafe', borderRadius: '6px', fontSize: '12px' }}>
        <p style={{ marginBottom: '8px', color: '#1e40af', fontWeight: '600' }}>Modelo CSV:</p>
        <code style={{ display: 'block', background: '#f0f9ff', padding: '8px', borderRadius: '4px', color: '#1e40af', fontSize: '11px', overflowX: 'auto' }}>
          Operadora,Servico,% Comissao,Valor Fixo{'\n'}
          EDP,energia,3.5,50{'\n'}
          MEO,telecom,2.5,30
        </code>
      </div>
    </div>
  )
}
