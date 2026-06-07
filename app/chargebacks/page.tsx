'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { AlertTriangle } from 'lucide-react'

interface Chargeback {
  id: string
  valor: number
  motivo: string
  observacoes: string
  created_at: string
  venda: { id: string; client_name: string; service_type: string; operator: string } | null
}

export default function ChargebacksParceiroPage() {
  const { user, authFetch } = useAuth('parceiro')
  const [chargebacks, setChargebacks] = useState<Chargeback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    authFetch('/api/chargebacks').then(r => r.json()).then(d => {
      setChargebacks(d.chargebacks || [])
      setLoading(false)
    })
  }, [user, authFetch])

  const total = chargebacks.reduce((s, c) => s + c.valor, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="flex-1 md:ml-64 pt-16" style={{ minHeight: '100vh' }}>
          <div className="p-4 md:p-5 max-w-5xl mx-auto w-full mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle size={28} style={{ color: '#7c2d12' }} />
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Meus Chargebacks</h1>
                  <p className="text-sm" style={{ color: '#64748b' }}>Historico de estornos nas suas comissoes</p>
                </div>
              </div>
              {chargebacks.length > 0 && (
                <div className="rounded-xl px-5 py-3 shadow-sm" style={{ background: '#fee2e2', border: '1px solid #fecaca' }}>
                  <p className="text-xs font-medium" style={{ color: '#991b1b' }}>Total Debitado</p>
                  <p className="text-xl font-bold" style={{ color: '#991b1b' }}>-{total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} EUR</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="rounded-xl p-4 mb-6" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <p className="text-sm" style={{ color: '#92400e' }}>
                Os chargebacks sao debitos aplicados quando uma venda e cancelada, rejeitada ou anulada apos o processamento inicial.
                Estes valores sao descontados automaticamente das suas comissoes.
              </p>
            </div>

            {/* List */}
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              {chargebacks.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#d1fae5' }}>
                    <AlertTriangle size={24} style={{ color: '#059669' }} />
                  </div>
                  <p className="font-medium" style={{ color: '#1e293b' }}>Sem chargebacks</p>
                  <p className="text-sm mt-1" style={{ color: '#64748b' }}>Nao tem nenhum chargeback aplicado. Continue o bom trabalho!</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                  {chargebacks.map(c => (
                    <div key={c.id} className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium" style={{ color: '#1e293b' }}>{c.venda?.client_name || 'Venda removida'}</p>
                          <p className="text-sm" style={{ color: '#64748b' }}>{c.venda?.operator} - {c.venda?.service_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: '#dc2626' }}>-{c.valor.toFixed(2)} EUR</p>
                          <p className="text-xs" style={{ color: '#64748b' }}>{new Date(c.created_at).toLocaleDateString('pt-PT')}</p>
                        </div>
                      </div>
                      <div className="rounded-lg px-3 py-2" style={{ background: '#fef2f2' }}>
                        <p className="text-sm font-medium" style={{ color: '#991b1b' }}>{c.motivo}</p>
                        {c.observacoes && <p className="text-xs mt-1" style={{ color: '#7f1d1d' }}>{c.observacoes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
