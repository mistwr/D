'use client'

import { useState } from 'react'
import { Download, Edit2, Eye, X } from 'lucide-react'

interface ContractPdfEditorProps {
  operator: string
  documentType: 'FA' | 'Portabilidade' | 'Rescisao'
  clientData: {
    nome?: string
    nif?: string
    email?: string
    telefone?: string
    morada?: string
  }
  onSave?: (htmlContent: string) => void
}

export function ContractPdfEditor({ operator, documentType, clientData, onSave }: ContractPdfEditorProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadTemplate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/document-templates?operator=${operator}&type=${documentType}`)
      if (res.ok) {
        const data = await res.json()
        // Preencher template com dados do cliente
        let html = data.template?.template_content || `<h1>${documentType}</h1><p>Operadora: ${operator}</p>`
        html = html
          .replace(/{{nome_cliente}}/g, clientData.nome || '')
          .replace(/{{nif}}/g, clientData.nif || '')
          .replace(/{{email}}/g, clientData.email || '')
          .replace(/{{telefone}}/g, clientData.telefone || '')
          .replace(/{{morada}}/g, clientData.morada || '')
          .replace(/{{operadora}}/g, operator)
          .replace(/{{data_venda}}/g, new Date().toLocaleDateString('pt-PT'))
        
        setContent(html)
        setShowEditor(true)
      }
    } catch (e) {
      console.log('[v0] Error loading template:', e)
    }
    setLoading(false)
  }

  function downloadPDF() {
    if (!content) return
    // Gerar PDF via API
    fetch('/api/generated-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_html: content,
        document_type: documentType,
        operator: operator
      })
    }).catch(e => console.log('[v0] Error saving document:', e))
  }

  return (
    <div className="p-4 rounded-lg border" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold" style={{ color: '#1e293b' }}>{documentType}</h3>
          <p className="text-sm" style={{ color: '#64748b' }}>Operadora: {operator}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadTemplate}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-200 transition"
            title="Editar"
          >
            <Edit2 size={16} style={{ color: '#0ea5e9' }} />
          </button>
          <button
            onClick={downloadPDF}
            disabled={!content}
            className="p-2 rounded-lg hover:bg-slate-200 transition"
            title="Descarregar"
          >
            <Download size={16} style={{ color: '#22c55e' }} />
          </button>
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
              <h3 className="font-semibold" style={{ color: '#1e293b' }}>Editar {documentType}</h3>
              <button onClick={() => setShowEditor(false)}>
                <X size={20} style={{ color: '#64748b' }} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full p-3 border rounded-lg font-mono text-sm"
                style={{ borderColor: '#e2e8f0' }}
              />
            </div>

            <div className="flex gap-2 p-4 border-t" style={{ borderColor: '#e2e8f0' }}>
              <button
                onClick={() => {
                  onSave?.(content)
                  setShowEditor(false)
                }}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white"
                style={{ background: '#22c55e' }}
              >
                Guardar
              </button>
              <button
                onClick={() => setShowEditor(false)}
                className="flex-1 px-4 py-2 rounded-lg font-medium border"
                style={{ borderColor: '#e2e8f0', color: '#64748b' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
