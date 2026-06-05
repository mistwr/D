import { useState } from 'react'
import { CheckCircle, FileText, Download, ArrowRight } from 'lucide-react'

interface VendaSuccessModalProps {
  vendaId: string
  clientName: string
  showPDF: boolean
  onClose: () => void
  onEditPDF?: (vendaId: string) => void
}

export function VendaSuccessModal({ vendaId, clientName, showPDF, onClose, onEditPDF }: VendaSuccessModalProps) {
  const [loadingPDF, setLoadingPDF] = useState(false)

  async function generateAndEditPDF() {
    setLoadingPDF(true)
    try {
      const res = await fetch('/api/vendas/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: vendaId })
      })
      
      if (res.ok) {
        onEditPDF?.(vendaId)
      }
    } catch (e) {
      console.log('[v0] Error generating PDF:', e)
    }
    setLoadingPDF(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#fff' }}>
        {/* Ícone de sucesso */}
        <div className="flex flex-col items-center justify-center py-8 px-6">
          <div className="rounded-full p-4 mb-4" style={{ background: '#d1fae5' }}>
            <CheckCircle size={48} style={{ color: '#059669' }} />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: '#1e293b' }}>
            Venda Registada com Sucesso!
          </h2>
          
          <p className="text-sm text-center mb-4" style={{ color: '#64748b' }}>
            Venda de <strong>{clientName}</strong> foi registada no sistema.
          </p>

          {/* Opções */}
          <div className="w-full space-y-3 mt-6">
            {showPDF && (
              <button
                onClick={generateAndEditPDF}
                disabled={loadingPDF}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition"
                style={{
                  background: '#0ea5e9',
                  color: '#fff',
                  opacity: loadingPDF ? 0.7 : 1,
                  cursor: loadingPDF ? 'not-allowed' : 'pointer'
                }}
              >
                <FileText size={18} />
                {loadingPDF ? 'A gerar PDF...' : 'Editar PDF da FA'}
                {!loadingPDF && <ArrowRight size={16} />}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg font-semibold text-sm transition border"
              style={{
                background: '#f8fafc',
                color: '#0ea5e9',
                borderColor: '#0ea5e9'
              }}
            >
              Ir para as Minhas Vendas
            </button>
          </div>

          <p className="text-xs mt-4 text-center" style={{ color: '#9ca3af' }}>
            Pode editar o PDF e descarregar sempre que precisar
          </p>
        </div>
      </div>
    </div>
  )
}
