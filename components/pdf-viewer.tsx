'use client'

import { useState, useRef } from 'react'
import { Download, X, Signature } from 'lucide-react'

interface PdfViewerProps {
  pdfUrl: string
  fileName: string
  saleData?: Record<string, any>
  onClose?: () => void
  onSave?: (pdfBlob: Blob) => Promise<void>
}

export function PdfViewer({ pdfUrl, fileName, saleData, onClose, onSave }: PdfViewerProps) {
  const [formData, setFormData] = useState({
    nome: saleData?.clientName || '',
    email: saleData?.clientEmail || '',
    telefone: saleData?.clientPhone || '',
    morada: saleData?.clientAddress || '',
    data: new Date().toLocaleDateString('pt-PT'),
    assinado: false,
  })
  const [saving, setSaving] = useState(false)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawingSignature, setIsDrawingSignature] = useState(false)

  function handleInputChange(field: string, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function drawSignature() {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastX = 0
    let lastY = 0

    const startDrawing = (e: MouseEvent | React.MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      lastX = (e as MouseEvent).clientX - rect.left
      lastY = (e as MouseEvent).clientY - rect.top
      setIsDrawingSignature(true)
    }

    const draw = (e: MouseEvent | React.MouseEvent) => {
      if (!isDrawingSignature) return
      const rect = canvas.getBoundingClientRect()
      const x = (e as MouseEvent).clientX - rect.left
      const y = (e as MouseEvent).clientY - rect.top

      ctx.strokeStyle = '#1a2847'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(x, y)
      ctx.stroke()

      lastX = x
      lastY = y
    }

    const stopDrawing = () => {
      setIsDrawingSignature(false)
    }

    canvas.addEventListener('mousedown', startDrawing as any)
    canvas.addEventListener('mousemove', draw as any)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseout', stopDrawing)

    return () => {
      canvas.removeEventListener('mousedown', startDrawing as any)
      canvas.removeEventListener('mousemove', draw as any)
      canvas.removeEventListener('mouseup', stopDrawing)
      canvas.removeEventListener('mouseout', stopDrawing)
    }
  }

  function clearSignature() {
    const canvas = signatureCanvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      handleInputChange('assinado', false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Download o PDF original como fallback
      const response = await fetch(pdfUrl)
      const blob = await response.blob()

      if (onSave) {
        await onSave(blob)
      } else {
        // Download direto
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('[v0] Erro ao guardar PDF:', error)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">{fileName}</h2>
            <p className="text-sm text-muted-foreground">Preencha e assine o documento</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Preview */}
            <div className="lg:col-span-2 border border-border rounded-lg p-4 bg-muted/30">
              <div className="bg-white p-8 rounded-lg text-center">
                <p className="text-muted-foreground mb-4">Visualização do PDF</p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
                >
                  Abrir PDF em nova aba
                </a>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Campos do Formulário</h3>

              {/* Campos de texto */}
              {['nome', 'email', 'telefone', 'morada'].map(field => (
                <div key={field} className="p-4 border border-border rounded-lg bg-card">
                  <label className="text-sm font-medium text-foreground block mb-2 capitalize">
                    {field}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={formData[field as keyof typeof formData] as string}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              ))}

              {/* Data */}
              <div className="p-4 border border-border rounded-lg bg-card">
                <label className="text-sm font-medium text-foreground block mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleInputChange('data', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* Assinatura */}
              <div className="p-4 border border-border rounded-lg bg-card space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Assinatura
                </label>
                <canvas
                  ref={signatureCanvasRef}
                  width={250}
                  height={100}
                  className="w-full border border-border rounded bg-white cursor-crosshair"
                  onMouseEnter={drawSignature}
                />
                <button
                  onClick={clearSignature}
                  className="w-full px-2 py-1 bg-destructive text-white rounded text-sm"
                >
                  Limpar Assinatura
                </button>
                {formData.assinado && (
                  <div className="p-2 bg-success/10 border border-success rounded text-sm text-success flex items-center gap-2">
                    <Signature size={16} />
                    Documento assinado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground bg-muted hover:bg-muted rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Download size={18} />
                Guardar & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
