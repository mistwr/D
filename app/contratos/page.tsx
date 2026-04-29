'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Plus, Download, Eye, CheckCircle } from 'lucide-react'

interface Contrato {
  id: string
  client_name: string
  client_email: string
  servico_type: string
  operadora: string
  status: string
  assinado_cliente: boolean
  assinado_vendedor: boolean
  created_at: string
}

export default function ContratosPage() {
  const [user, setUser] = useState<any>(null)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json())
        if (!me.user) window.location.href = '/login'
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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>Contratos</h1>
        <Link href="/contratos/novo" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#4338ca', color: 'white', padding: '10px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          <Plus size={18} /> Novo Contrato
        </Link>
      </div>

      {contratos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px' }}>
          <FileText size={40} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>Nenhum contrato criado ainda</p>
          <Link href="/contratos/novo" style={{ color: '#4338ca', textDecoration: 'underline' }}>Criar primeiro contrato</Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Cliente</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Serviço</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#111827' }}>Operadora</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>Estado</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>Assinaturas</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c, i) => {
                const statusInfo = statusColors[c.status] || statusColors.rascunho
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <p style={{ fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>{c.client_name}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{c.client_email}</p>
                      </div>
                    </td>
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
                      {c.assinado_cliente ? <CheckCircle size={16} style={{ color: '#10b981', display: 'inline' }} /> : <span style={{ color: '#d1d5db' }}>—</span>}
                      {' '}
                      {c.assinado_vendedor ? <CheckCircle size={16} style={{ color: '#10b981', display: 'inline' }} /> : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Link href={`/contratos/${c.id}`} style={{ color: '#4338ca', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                        <Eye size={16} /> Ver
                      </Link>
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
