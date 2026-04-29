'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { FileText, Download, Share2 } from 'lucide-react'

interface Publicacao { id: string; title: string; message: string; document_name: string; created_at: string }

export default function PublicacoesPage() {
  const { user, loading: authLoading } = useAuth('parceiro')
  const [pubs, setPubs] = useState<Publicacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetch('/api/publicacoes', { credentials: 'include' }).then(r => r.json()).then(d => setPubs(d.publicacoes || [])).finally(() => setLoading(false))
  }, [user])

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <FileText size={28} style={{ color: '#4338ca' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Publicacoes</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>Documentos e informacoes partilhadas pela equipa</p>
              </div>
            </div>

            {pubs.length === 0 ? (
              <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <FileText size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium" style={{ color: '#374151' }}>Nenhuma publicacao</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>As publicacoes da equipa aparecerao aqui.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pubs.map(p => (
                  <div key={p.id} className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm" style={{ color: '#111827' }}>{p.title}</h3>
                        {p.message && <p className="text-sm mt-2" style={{ color: '#6b7280' }}>{p.message}</p>}
                        {p.document_name && (
                          <div className="flex items-center gap-2 mt-3 rounded-lg px-3 py-2 w-fit" style={{ background: '#eef2ff' }}>
                            <Download size={14} style={{ color: '#4338ca' }} />
                            <span className="text-xs font-medium" style={{ color: '#4338ca' }}>{p.document_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className="text-xs" style={{ color: '#9ca3af' }}>{new Date(p.created_at).toLocaleDateString('pt-PT')}</span>
                        <button
                          onClick={() => {
                            const text = `*${p.title}*%0A%0A${p.message || ''}${p.document_name ? '%0A%0ADocumento: ' + p.document_name : ''}`
                            window.open(`https://wa.me/?text=${text}`, '_blank')
                          }}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                          style={{ background: '#dcfce7', color: '#166534' }}
                          title="Enviar por WhatsApp"
                        >
                          <Share2 size={13} /> WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
