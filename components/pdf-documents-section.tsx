'use client'

import { useState, useEffect } from 'react'
import { Download, Loader, Eye } from 'lucide-react'
import { PdfViewer } from './pdf-viewer'

interface PdfTemplate {
  id: string
  nome: string
  operadora: string
  tipo: string
}

interface GeneratedPdf {
  id: string
  document_type: string
  file_url: string
  created_at: string
}

interface PdfDocumentsSectionProps {
  saleId: string
  operator: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  plano: string
  authFetch: (url: string, options?: any) => Promise<Response>
}

export function PdfDocumentsSection({
  saleId,
  operator,
  clientName,
  clientEmail,
  clientPhone,
  clientAddress,
  plano,
  authFetch,
}: PdfDocumentsSectionProps) {
  const [templates, setTemplates] = useState<PdfTemplate[]>([])
  const [generatedPdfs, setGeneratedPdfs] = useState<GeneratedPdf[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [viewingPdf, setViewingPdf] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
    loadGeneratedPdfs()
  }, [saleId, operator])

  async function loadTemplates() {
    try {
      const res = await fetch(`/api/pdf/templates?operadora=${encodeURIComponent(operator)}`)
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (e) {
      console.log('[v0] Erro ao carregar templates:', e)
    }
  }

  async function loadGeneratedPdfs() {
    try {
      const res = await fetch(`/api/pdf/generated?sale_id=${saleId}`)
      if (res.ok) {
        const data = await res.json()
        setGeneratedPdfs(data.pdfs || [])
      }
    } catch (e) {
      console.log('[v0] Erro ao carregar PDFs gerados:', e)
    }
  }

  async function generatePdf(templateId: string, documentType: string) {
    setGenerating(templateId)
    try {
      const res = await authFetch('/api/pdf/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: saleId,
          template_id: templateId,
          document_type: documentType,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        console.log('[v0] PDF gerado com sucesso:', data.downloadUrl)
        loadGeneratedPdfs()
        // Auto-download
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank')
        }
      } else {
        alert('Erro ao gerar PDF')
      }
    } catch (e) {
      console.log('[v0] Erro ao gerar PDF:', e)
      alert('Erro ao gerar PDF')
    }
    setGenerating(null)
  }

  if (templates.length === 0) {
    return (
      <div className="mt-6 p-4 rounded-lg border" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
        <p style={{ color: '#991b1b' }} className="text-sm">
          Não existem templates PDF disponíveis para a operadora <strong>{operator}</strong>. 
          Peça ao administrador para carregar um template em <strong>/admin/pdf-templates</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 p-3 rounded-lg border" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
      <h2 className="font-semibold mb-3 text-sm" style={{ color: '#1a2847' }}>Documentos PDF</h2>

      <div className="space-y-2">
        {/* Botões para gerar PDFs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => generatePdf(template.id, template.tipo)}
              disabled={generating === template.id}
              className="px-3 py-1.5 rounded-lg font-medium text-white text-xs flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#0066cc' }}
            >
              {generating === template.id ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download size={14} />
                  {template.tipo}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Lista de PDFs gerados */}
        {generatedPdfs.length > 0 && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: '#e2e8f0' }}>
            <h3 className="font-medium mb-3" style={{ color: '#1e293b' }}>PDFs Gerados</h3>
            <div className="space-y-2">
              {generatedPdfs.map(pdf => (
                <div
                  key={pdf.id}
                  className="p-3 rounded-lg flex items-center justify-between"
                  style={{ background: '#f0f9ff', borderColor: '#0ea5e9' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1e293b' }}>
                      {pdf.document_type}
                    </p>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {new Date(pdf.created_at).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingPdf(pdf.file_url)}
                      className="p-2 rounded-lg hover:bg-blue-100 transition"
                      title="Visualizar e assinar"
                    >
                      <Eye size={16} style={{ color: '#0ea5e9' }} />
                    </button>
                    <a
                      href={pdf.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-blue-100 transition"
                      title="Descarregar"
                    >
                      <Download size={16} style={{ color: '#0ea5e9' }} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <PdfViewer
          pdfUrl={viewingPdf}
          fileName="Documento de Venda"
          saleData={{
            clientName,
            clientEmail,
            clientPhone,
            clientAddress,
          }}
          onClose={() => setViewingPdf(null)}
          onSave={async (pdfBlob) => {
            // Aqui seria a lógica para guardar o PDF assinado
            const url = URL.createObjectURL(pdfBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'documento-assinado.pdf'
            a.click()
            URL.revokeObjectURL(url)
          }}
        />
      )}
    </div>
  )
}
