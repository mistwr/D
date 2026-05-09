'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { FileText, CheckCircle, AlertCircle } from 'lucide-react'

// Dynamic import para evitar SSR issues com canvas
const SignaturePad = dynamic(() => import('@/components/signature-pad'), { ssr: false })

interface DocumentData {
  id: string
  venda_id: string
  template_name: string
  client_name: string
  file_url: string
  signed: boolean
}

export default function AssinarDocumentoPage() {
  const params = useParams()
  const docId = params.id as string
  
  const [doc, setDoc] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signed, setSigned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'view' | 'sign' | 'done'>('view')

  useEffect(() => {
    loadDocument()
  }, [docId])

  async function loadDocument() {
    try {
      const res = await fetch(`/api/pdf-sign?id=${docId}`)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setDoc(data.document)
        if (data.document?.signed) {
          setSigned(true)
          setStep('done')
        }
      }
    } catch {
      setError('Erro ao carregar documento')
    }
    setLoading(false)
  }

  async function handleSignature(signatureDataUrl: string) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/pdf-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: docId,
          signature: signatureDataUrl,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSigned(true)
        setStep('done')
      } else {
        setError(data.error || 'Erro ao guardar assinatura')
      }
    } catch {
      setError('Erro ao processar assinatura')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9fafb' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4" style={{ borderColor: '#4f46e5' }} />
          <p style={{ color: '#6b7280' }}>A carregar documento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f9fafb' }}>
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#dc2626' }} />
          <h1 className="text-xl font-bold mb-2" style={{ color: '#111827' }}>Erro</h1>
          <p style={{ color: '#6b7280' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f9fafb' }}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: '#d1fae5' }}>
            <CheckCircle size={40} style={{ color: '#059669' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>Documento Assinado</h1>
          <p className="mb-6" style={{ color: '#6b7280' }}>
            A sua assinatura foi registada com sucesso. O documento assinado sera enviado por email.
          </p>
          <p className="text-sm" style={{ color: '#9ca3af' }}>
            Pode fechar esta pagina.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f9fafb' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-4" style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: '#eef2ff' }}>
            <FileText size={24} style={{ color: '#4f46e5' }} />
          </div>
          <div>
            <h1 className="font-semibold" style={{ color: '#111827' }}>{doc?.template_name || 'Documento'}</h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>Cliente: {doc?.client_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {step === 'view' && (
          <div className="space-y-6">
            {/* Preview do documento */}
            <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="p-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <h2 className="font-semibold" style={{ color: '#111827' }}>Pre-visualizacao do Documento</h2>
              </div>
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                {doc?.file_url ? (
                  <iframe src={doc.file_url} className="w-full h-full" title="Documento PDF" />
                ) : (
                  <p style={{ color: '#9ca3af' }}>Preview nao disponivel</p>
                )}
              </div>
            </div>

            {/* Botao para assinar */}
            <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                Ao assinar este documento, confirma que leu e aceita todos os termos e condicoes apresentados.
              </p>
              <button
                onClick={() => setStep('sign')}
                className="w-full rounded-xl py-3.5 font-semibold text-white transition hover:opacity-90"
                style={{ background: '#4f46e5' }}
              >
                Assinar Documento
              </button>
            </div>
          </div>
        )}

        {step === 'sign' && (
          <div className="space-y-6">
            <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <h2 className="font-semibold mb-2" style={{ color: '#111827' }}>A sua Assinatura</h2>
              <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                Use o dedo ou o rato para desenhar a sua assinatura na area abaixo.
              </p>
              
              <SignaturePad
                onSave={handleSignature}
                onClear={() => {}}
                width={500}
                height={200}
              />

              {submitting && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#4f46e5' }} />
                  <p className="text-sm mt-2" style={{ color: '#6b7280' }}>A processar assinatura...</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep('view')}
              className="w-full rounded-xl py-3 font-medium transition hover:opacity-80"
              style={{ background: '#f3f4f6', color: '#374151' }}
            >
              Voltar ao Documento
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 text-center" style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <p className="text-xs" style={{ color: '#9ca3af' }}>
          Assinatura digital segura. Os dados sao protegidos e encriptados.
        </p>
      </footer>
    </div>
  )
}
