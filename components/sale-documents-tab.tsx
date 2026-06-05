'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Edit2, Loader } from 'lucide-react'
import { DocumentEditor } from './document-editor'
import { PdfDocumentsSection } from './pdf-documents-section'

interface GeneratedDocument {
  id: string
  document_type: 'FA' | 'Portabilidade' | 'Rescisao'
  status: 'draft' | 'finalized'
  created_at: string
  document_html: string
  downloaded_at?: string
}

interface SaleDocumentsTabProps {
  saleId: string
  canEdit: boolean
  onGenerateDocument: (type: 'FA' | 'Portabilidade' | 'Rescisao') => void
  isGenerating: boolean
}

export function SaleDocumentsTab({ saleId, canEdit, onGenerateDocument, isGenerating }: SaleDocumentsTabProps) {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<GeneratedDocument | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [saleId])

  async function loadDocuments() {
    try {
      const res = await fetch(`/api/generated-documents?sale_id=${saleId}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (e) {
      console.log('[v0] Error loading documents:', e)
    }
    setLoading(false)
  }

  function handleEditDocument(doc: GeneratedDocument) {
    setSelectedDoc(doc)
    setShowEditor(true)
  }

  function handleDocumentSaved(newContent: string) {
    if (selectedDoc) {
      setDocuments(prev => prev.map(d => 
        d.id === selectedDoc.id 
          ? { ...d, document_html: newContent, status: 'finalized' }
          : d
      ))
    }
    setShowEditor(false)
  }

  const documentTypes: Array<'FA' | 'Portabilidade' | 'Rescisao'> = ['FA', 'Portabilidade', 'Rescisao']
  const existingTypes = new Set(documents.map(d => d.document_type))

  return (
    <div className="space-y-6">
      {/* Secção de PDFs (novo sistema) */}
      <PdfDocumentsSection saleId={saleId} canEdit={canEdit} />

      {/* Botões para gerar documentos */}
      {canEdit && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Gerar Documentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documentTypes.map(type => (
              <button
                key={type}
                onClick={() => onGenerateDocument(type)}
                disabled={isGenerating || existingTypes.has(type)}
                className="flex items-center justify-center gap-2 p-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                style={{
                  background: existingTypes.has(type) ? '#e2e8f0' : '#0ea5e9',
                  color: existingTypes.has(type) ? '#64748b' : '#fff'
                }}
              >
                {isGenerating ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
                {type === 'FA' && 'Gerar FA'}
                {type === 'Portabilidade' && 'Gerar Portabilidade'}
                {type === 'Rescisao' && 'Gerar Rescisão'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de documentos gerados */}
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Documentos Gerados</h3>
        {loading ? (
          <div className="text-center py-8" style={{ color: '#64748b' }}>A carregar...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 rounded-lg" style={{ background: '#f8fafc', color: '#64748b' }}>
            Nenhum documento gerado ainda
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="p-4 rounded-lg flex items-center justify-between" 
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-3 flex-1">
                  <FileText size={20} style={{ color: '#0ea5e9' }} />
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: '#1e293b' }}>{doc.document_type}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: doc.status === 'draft' ? '#fef3c7' : '#d1fae5',
                        color: doc.status === 'draft' ? '#92400e' : '#065f46',
                        marginRight: '8px'
                      }}>
                        {doc.status === 'draft' ? 'Rascunho' : 'Finalizado'}
                      </span>
                      {new Date(doc.created_at).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button 
                      onClick={() => handleEditDocument(doc)}
                      className="p-2 rounded-lg hover:bg-slate-300 transition"
                      title="Editar"
                    >
                      <Edit2 size={16} style={{ color: '#0ea5e9' }} />
                    </button>
                  )}
                  <button className="p-2 rounded-lg hover:bg-slate-300 transition" title="Descarregar">
                    <Download size={16} style={{ color: '#22c55e' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {showEditor && selectedDoc && (
        <DocumentEditor
          documentId={selectedDoc.id}
          documentType={selectedDoc.document_type}
          htmlContent={selectedDoc.document_html}
          status={selectedDoc.status}
          onSave={handleDocumentSaved}
          onClose={() => {
            setShowEditor(false)
            setSelectedDoc(null)
          }}
        />
      )}
    </div>
  )
}
