'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { PDFSigner } from '@/components/pdf-signer'

interface Contrato {
  id: string
  client_name: string
  client_phone: string
  client_cc: string
  client_nif: string
  client_morada: string
  client_email: string
  servico_type: 'energia' | 'telecom'
  operadora: string
  status: string
  assinado_cliente: boolean
  assinado_vendedor: boolean
}

const PDF_TEMPLATES: Record<string, string> = {
  'Vodafone': '/contratos/Contrato_Unico_Vodafone.pdf',
  'MEO': '/contratos/adesao_MEO_M1_M2_M3.pdf',
  'NOS': '/contratos/adesao_NOSfixo.pdf',
  'DIGI': '/contratos/adesao_MEO_M1_M2_M3.pdf',
  'EDP': '/contratos/Contrato_EDP_Adesao.pdf',
  'Endesa': '/contratos/Contrato_EDP_Adesao.pdf',
  'Portologos': '/contratos/Contrato_EDP_Adesao.pdf',
  'Repsol': '/contratos/Contrato_EDP_Adesao.pdf',
  'Iberdrola': '/contratos/Contrato_EDP_Adesao.pdf',
}

export default function ContratoPage() {
  const params = useParams()
  const contratoId = params.id as string
  const { user, loading: authLoading, authFetch } = useAuth()

  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      try {
        const contratoRes = await authFetch(`/api/contratos/${contratoId}`)

        const contratoData = await contratoRes.json()
        if (contratoData.contrato) {
          setContrato(contratoData.contrato)
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user, authFetch, contratoId])

  const handleSignatureSubmit = async (signatureImage: string) => {
    try {
      const res = await authFetch(`/api/contratos/${contratoId}/assinar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_image_base64: signatureImage,
          tipo: user?.id === contrato?.user_id ? 'vendedor' : 'cliente',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('Assinatura submetida com sucesso!')
        setContrato(data.contrato)
      } else {
        alert('Erro ao submeter assinatura: ' + data.error)
      }
    } catch (e) {
      console.log('[v0] Error:', e)
      alert('Erro ao submeter assinatura')
    }
  }

  if (authLoading || loading) return <div style={{ padding: '20px' }}>A carregar...</div>
  if (!contrato) return <div style={{ padding: '20px' }}>Contrato não encontrado</div>

  const pdfUrl = PDF_TEMPLATES[contrato.operadora] || PDF_TEMPLATES['Vodafone']
  const userIsParceiro = user?.id === contrato.user_id
  const canSign = (userIsParceiro && !contrato.assinado_vendedor) || (!userIsParceiro && !contrato.assinado_cliente)

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Link href="/contratos" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#4338ca', textDecoration: 'none', marginBottom: '20px', fontSize: '14px' }}>
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>Contrato #{contratoId.slice(0, 8)}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {contrato.assinado_cliente && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669' }}><CheckCircle size={18} /> Cliente Assinado</div>}
          {!contrato.assinado_cliente && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}><AlertCircle size={18} /> Aguardando Cliente</div>}
          {contrato.assinado_vendedor && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669' }}><CheckCircle size={18} /> Vendedor Assinado</div>}
          {!contrato.assinado_vendedor && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}><AlertCircle size={18} /> Aguardando Vendedor</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '12px', color: '#111827' }}>Dados do Cliente</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 6px 0' }}><strong>Nome:</strong> {contrato.client_name}</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>Contacto:</strong> {contrato.client_phone}</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>CC:</strong> {contrato.client_cc}</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>NIF:</strong> {contrato.client_nif}</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>Morada:</strong> {contrato.client_morada}</p>
            {contrato.client_email && <p style={{ margin: 0 }}><strong>Email:</strong> {contrato.client_email}</p>}
          </div>
        </div>

        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '12px', color: '#111827' }}>Detalhes</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 6px 0' }}><strong>Serviço:</strong> {contrato.servico_type === 'energia' ? 'Energia' : 'Telecom'}</p>
            <p style={{ margin: '0 0 6px 0' }}><strong>Operadora:</strong> {contrato.operadora}</p>
            <p style={{ margin: 0 }}><strong>Status:</strong> {contrato.status}</p>
          </div>
        </div>
      </div>

      {canSign && (
        <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #fcd34d' }}>
          <AlertCircle size={20} style={{ color: '#b45309', flexShrink: 0 }} />
          <span style={{ color: '#92400e' }}>Aguardando sua assinatura digital para completar este contrato</span>
        </div>
      )}

      <PDFSigner
        pdfUrl={pdfUrl}
        clientName={contrato.client_name}
        clientPhone={contrato.client_phone}
        onSignatureSubmit={handleSignatureSubmit}
      />
    </div>
  )
}
