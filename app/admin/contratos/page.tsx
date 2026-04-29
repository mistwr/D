'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Eye, CheckCircle, Clock } from 'lucide-react'

interface Contrato {
  id: string
  user_id: string
  client_name: string
  operadora: string
  servico_type: string
  status: string
  assinado_cliente: boolean
  assinado_vendedor: boolean
  created_at: string
}

export default function AdminContratosPage() {
  const [user, setUser] = useState<any>(null)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('todos')

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json())
        if (!me.user || me.user.role !== 'admin') window.location.href = '/login'
        setUser(me.user)

        const res = await fetch('/api/contratos', { credentials: 'include' })
        const data = await res.json()
        setContratos(data.contratos || [])
      } catch (e) {
        console.error('[v0] Error:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px' }}>A carregar...</div>

  const statusColors: Record<string, { bg: string; color: string }> = {
    rascunho: { bg: '#f3f4f6', color: '#6b7280' },
    pendente_cliente: { bg: '#fef3c7', color: '#92400e' },
    pendente_vendedor: { bg: '#dbeafe', color: '#1e40af' },
    finalizado: { bg: '#d1fae5', color: '#065f46' },
    rejeitado: { bg: '#fee2e2', color: '#991b1b' },
  }

  const filteredContratos = filterStatus === 'todos' 
    ? contratos 
    : contratos.filter(c => c.status === filterStatus)

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', color: '#111827' }}>
        Contratos ({filteredContratos.length})
      </h1>

      {/* Filtro */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['todos', 'rascunho', 'pendente_cliente', 'pendente_vendedor', 'finalizado', 'rejeitado'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              background: filterStatus === status ? '#4338ca' : '#f3f4f6',
              color: filterStatus === status ? 'white' : '#111827',
            }}
          >
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {filteredContratos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px' }}>
          <FileText size={40} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
          <p style={{ color: '#6b7280' }}>Nenhum contrato com este filtro</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Parceiro/Cliente</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Serviço</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Operadora</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>Estado</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>Assinaturas</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>Data</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredContratos.map((c, i) => {
                const statusInfo = statusColors[c.status] || statusColors.rascunho
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', color: '#111827', fontWeight: '500' }}>{c.client_name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: c.servico_type === 'energia' ? '#fef3c7' : '#e0e7ff', color: c.servico_type === 'energia' ? '#92400e' : '#4338ca', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                        {c.servico_type === 'energia' ? 'Energia' : 'Telecom'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#111827' }}>{c.operadora}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ background: statusInfo.bg, color: statusInfo.color, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        {c.assinado_cliente ? (
                          <span title="Cliente assinado"><CheckCircle size={16} style={{ color: '#10b981' }} /></span>
                        ) : (
                          <span title="Pendente cliente"><Clock size={16} style={{ color: '#f59e0b' }} /></span>
                        )}
                        {c.assinado_vendedor ? (
                          <span title="Vendedor assinado"><CheckCircle size={16} style={{ color: '#10b981' }} /></span>
                        ) : (
                          <span title="Pendente vendedor"><Clock size={16} style={{ color: '#f59e0b' }} /></span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                      {new Date(c.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button style={{ background: '#eef2ff', color: '#4338ca', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={14} /> Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
