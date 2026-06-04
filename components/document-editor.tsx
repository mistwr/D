'use client'

import { useState } from 'react'
import { Download, Edit2, X, Save } from 'lucide-react'
import { generatePDFFromHTML } from '@/lib/pdf-generator'

interface DocumentEditorProps {
  documentId: string
  documentType: 'FA' | 'Portabilidade' | 'Rescisao'
  htmlContent: string
  status: 'draft' | 'finalized'
  onSave?: (newContent: string) => void
  onClose?: () => void
}

export function DocumentEditor({ documentId, documentType, htmlContent, status, onSave, onClose }: DocumentEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(htmlContent)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleDownloadPDF() {
    setIsGenerating(true)
    try {
      const blob = await generatePDFFromHTML({
        filename: `${documentType}-${new Date().getTime()}`,
        htmlContent: editContent,
        documentType
      })
      
      // Criar link de download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${documentType}-${documentId.slice(0, 8)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.log('[v0] Error generating PDF:', error)
      alert('Erro ao gerar PDF')
    }
    setIsGenerating(false)
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      // Fazer POST para guardar alterações
      const res = await fetch('/api/generated-documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: documentId,
          document_html: editContent,
          status: 'finalized'
        })
      })
      
      if (res.ok) {
        onSave?.(editContent)
        setIsEditing(false)
        alert('Documento guardado com sucesso!')
      }
    } catch (error) {
      console.log('[v0] Error saving document:', error)
      alert('Erro ao guardar documento')
    }
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-96 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <h3 className="font-bold" style={{ color: '#1e293b' }}>{documentType}</h3>
            <p className="text-xs" style={{ color: '#64748b' }}>
              {isEditing ? 'Modo edição' : 'Pré-visualização'} • {status === 'finalized' ? 'Finalizado' : 'Rascunho'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-full p-4 rounded font-mono text-sm resize-none"
              style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#1e293b' }}
            />
          ) : (
            <div
              className="bg-white p-6 rounded"
              style={{ border: '1px solid #e2e8f0' }}
              dangerouslySetInnerHTML={{ __html: editContent }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-white" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-white"
                style={{ background: '#0ea5e9' }}
              >
                <Edit2 size={16} /> Editar
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#22c55e' }}
                >
                  <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setEditContent(htmlContent)
                    setIsEditing(false)
                  }}
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-50"
            style={{ background: '#10b981' }}
          >
            <Download size={16} /> {isGenerating ? 'A gerar...' : 'Descarregar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
