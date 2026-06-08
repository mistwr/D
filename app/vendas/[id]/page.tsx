'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, FileText, Loader } from 'lucide-react'
import Link from 'next/link'
import { SaleDocumentsTab } from '@/components/sale-documents-tab'

interface Venda {
  id: string
  client_name: string
  client_email: string
  client_phone: string
  client_nif: string
  client_address: string
  amount: number
  status: string
  operator: string
  service_type: string
  plano: string
  contract_type: string
  created_at: string
  [key: string]: any
}

export default function SaleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const saleId = params.id as string
  const { user, loading: authLoading, authFetch } = useAuth('parceiro')
  const [sale, setSale] = useState<Venda | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'details' | 'documents' | 'history'>('details')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!user || !saleId) return
    loadSale()
  }, [user, saleId, authFetch])

  async function loadSale() {
    try {
      const res = await authFetch(`/api/vendas/${saleId}`)
      const data = await res.json()
      if (data.venda) setSale(data.venda)
    } catch (e) {
      console.log('[v0] Error loading sale:', e)
    }
    setLoading(false)
  }

  async function generateDocument(type: 'FA' | 'Portabilidade' | 'Rescisao') {
    if (!sale) return
    setIsGenerating(true)
    try {
      const res = await authFetch('/api/generated-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: saleId,
          document_type: type
        })
      })
      if (res.ok) {
        alert(`${type} gerado com sucesso!`)
        // Recarregar documentos
      }
    } catch (e) {
      console.log('[v0] Error generating document:', e)
      alert('Erro ao gerar documento')
    }
    setIsGenerating(false)
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-slate-100">
        <Sidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin" size={32} />
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="flex h-screen bg-slate-100">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col">
          <Navbar user={user} />
          <div className="p-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 mb-4 hover:underline">
              <ChevronLeft size={20} /> Voltar
            </button>
            <p>Venda não encontrada</p>
          </div>
        </div>
      </div>
    )
  }

  const canEdit = user?.id === sale.user_id || user?.role === 'admin'

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} />
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {/* Cabeçalho */}
            <div className="mb-6 flex items-center justify-between">
              <button onClick={() => router.back()} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#0ea5e9' }}>
                <ChevronLeft size={18} /> Voltar às Vendas
              </button>
              <div className="text-right">
                <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>{sale.client_name}</h1>
                <p className="text-sm" style={{ color: '#64748b' }}>{sale.operator} • {sale.service_type}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b" style={{ borderColor: '#e2e8f0' }}>
              {(['details', 'documents', 'history'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2 font-medium text-sm transition-all"
                  style={{
                    color: tab === t ? '#0ea5e9' : '#64748b',
                    borderBottom: tab === t ? '2px solid #0ea5e9' : 'none'
                  }}
                >
                  {t === 'details' && 'Detalhes'}
                  {t === 'documents' && 'Documentos'}
                  {t === 'history' && 'Histórico'}
                </button>
              ))}
            </div>

            {/* Conteúdo das tabs */}
            {tab === 'details' && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Informações da Venda</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Cliente</p>
                    <p className="font-medium" style={{ color: '#1e293b' }}>{sale.client_name}</p>
                    <p className="text-sm" style={{ color: '#64748b' }}>{sale.client_email}</p>
                    <p className="text-sm" style={{ color: '#64748b' }}>{sale.client_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Documentos</p>
                    <p className="font-medium" style={{ color: '#1e293b' }}>{sale.client_nif}</p>
                    <p className="text-sm" style={{ color: '#64748b' }}>NIF: {sale.client_nif}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Venda</p>
                    <p className="font-medium" style={{ color: '#1e293b' }}>{sale.operator}</p>
                    <p className="text-sm" style={{ color: '#64748b' }}>{sale.service_type} • {sale.plano}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: '#64748b' }}>Montante</p>
                    <p className="font-medium text-lg" style={{ color: '#22c55e' }}>{sale.amount}€</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>Status: {sale.status}</p>
                  </div>
                </div>
              </div>
            )}

            {tab === 'documents' && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <SaleDocumentsTab
                  saleId={saleId}
                  canEdit={canEdit}
                  onGenerateDocument={generateDocument}
                  isGenerating={isGenerating}
                  sale={sale}
                  authFetch={authFetch}
                />
              </div>
            )}

            {tab === 'history' && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Histórico</h2>
                <p style={{ color: '#64748b' }}>Criado em {new Date(sale.created_at).toLocaleDateString('pt-PT')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
