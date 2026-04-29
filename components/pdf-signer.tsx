'use client'

import { useRef, useEffect, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'

interface PDFSignerProps {
  pdfUrl: string
  clientName: string
  clientPhone: string
  onSignatureSubmit: (signatureImage: string) => void
}

export function PDFSigner({ pdfUrl, clientName, clientPhone, onSignatureSubmit }: PDFSignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    // Inicializar canvas de assinatura
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = 200 * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    setContext(ctx)
    setLoading(false)
  }, [])

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const coords = getCoordinates(e)
    if (coords && context) {
      context.beginPath()
      context.moveTo(coords.x, coords.y)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const coords = getCoordinates(e)
    if (coords && context) {
      context.lineTo(coords.x, coords.y)
      context.stroke()
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    if (context) {
      context.closePath()
    }
  }

  const handleClearSignature = () => {
    const canvas = canvasRef.current
    if (canvas && context) {
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handleSubmitSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      alert('Erro ao processar assinatura')
      return
    }

    // Verificar se canvas tem conteúdo
    const imageData = context?.getImageData(0, 0, canvas.width, canvas.height)
    if (!imageData) {
      alert('Por favor assine o formulário')
      return
    }

    let hasContent = false
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] > 128) { // Alpha channel
        hasContent = true
        break
      }
    }

    if (!hasContent) {
      alert('Por favor assine o formulário')
      return
    }

    setSubmitting(true)
    const signatureImage = canvas.toDataURL('image/png')
    onSignatureSubmit(signatureImage)
    setTimeout(() => setSubmitting(false), 1000)
  }

  return (
    <div className="space-y-6">
      {/* PDF Viewer */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <iframe
          id="pdf-viewer"
          className="w-full"
          style={{ height: '600px' }}
          src={`${pdfUrl}#toolbar=0&navpanes=0`}
          title="PDF Contrato"
        />
      </div>

      {/* Dados do Cliente */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Dados Pré-Preenchidos</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <p className="font-medium">Nome:</p>
            <p>{clientName}</p>
          </div>
          <div>
            <p className="font-medium">Contacto:</p>
            <p>{clientPhone}</p>
          </div>
        </div>
      </div>

      {/* Assinatura Digital */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold mb-3 text-gray-900">Assinatura Digital</h3>
        <p className="text-sm text-gray-600 mb-3">Desenhe a sua assinatura no espaço abaixo:</p>
        <canvas
          ref={canvasRef}
          className="w-full border-2 border-gray-300 rounded bg-white cursor-crosshair"
          style={{ height: '200px', touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleClearSignature}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 flex-1"
          >
            <Trash2 size={16} /> Limpar
          </button>
          <button
            onClick={handleSubmitSignature}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-1 disabled:opacity-50"
          >
            <Download size={16} /> {submitting ? 'A assinar...' : 'Assinar e Submeter'}
          </button>
        </div>
      </div>
    </div>
  )
}
