'use client'

import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onClear?: () => void
  width?: number
  height?: number
}

export default function SignaturePad({ onSave, onClear, width = 400, height = 200 }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [dimensions, setDimensions] = useState({ width, height })

  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        setDimensions({
          width: Math.min(containerWidth - 4, width),
          height: height
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [width, height])

  function handleClear() {
    sigRef.current?.clear()
    setIsEmpty(true)
    onClear?.()
  }

  function handleSave() {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL('image/png')
      onSave(dataUrl)
    }
  }

  function handleEnd() {
    setIsEmpty(sigRef.current?.isEmpty() ?? true)
  }

  return (
    <div className="space-y-3">
      <div 
        ref={containerRef}
        className="relative rounded-xl overflow-hidden"
        style={{ 
          border: '2px dashed #d1d5db',
          background: '#fafafa',
        }}
      >
        <SignatureCanvas
          ref={sigRef}
          penColor="#1f2937"
          canvasProps={{
            width: dimensions.width,
            height: dimensions.height,
            className: 'signature-canvas',
            style: { 
              touchAction: 'none',
              cursor: 'crosshair',
            }
          }}
          onEnd={handleEnd}
        />
        {isEmpty && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ color: '#9ca3af' }}
          >
            <p className="text-sm text-center px-4">
              Assine aqui com o dedo ou rato
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 rounded-lg py-2.5 text-sm font-medium transition hover:opacity-80"
          style={{ background: '#f3f4f6', color: '#374151' }}
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty}
          className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: '#059669' }}
        >
          Confirmar Assinatura
        </button>
      </div>
    </div>
  )
}
