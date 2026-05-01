'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Newspaper, FileText, Download, Share2 } from 'lucide-react'

interface Publicacao {
  id: string
  title: string
  content: string
  message: string
  file_name: string
  document_name: string
  file_path: string
  signed_url: string | null
  author_name: string
  created_at: string
}

export default function PublicacoesPage() {
  const { user, loading: authLoading } = useAuth('parceiro')
  const [pubs, setPubs] = useState<Publicacao[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!user) return
    fetch('/api/publicacoes', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setPubs(d.publicacoes || []))
      .finally(() => setLoading(false))
  }, [user])

  function openFile(url: string) {
    window.open(url, '_blank', 'noreferrer')
  }

  function handleWhatsApp(pub: Publicacao, withFile: boolean) {
    const title = pub.title || ''
    const body = pub.content || pub.message || ''
    const fileName = pub.file_name || ''
    let text = `*${title}*`
    if (body) text += `\n\n${body}`

    if (withFile && pub.signed_url) {
      // Abrir o ficheiro numa nova tab para o utilizador guardar e anexar manualmente no WhatsApp
      openFile(pub.signed_url)
      text += `\n\n_(Ficheiro "${fileName}" aberto — guarde e annexe a esta conversa.)_`
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noreferrer')
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4338ca' }} />
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
              <div className="rounded-xl p-2.5" style={{ background: '#eef2ff' }}>
                <Newspaper size={24} style={{ color: '#4338ca' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Publicacoes</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  {pubs.length === 0 ? 'Sem publicacoes' : `${pubs.length} publicacao${pubs.length !== 1 ? 'es' : ''} disponivel${pubs.length !== 1 ? 'eis' : ''}`}
                </p>
              </div>
            </div>

            {pubs.length === 0 ? (
              <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                <Newspaper size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium" style={{ color: '#374151' }}>Nenhuma publicacao</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>As publicacoes da equipa aparecerao aqui.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pubs.map(p => {
                  const hasFile = !!(p.file_path || p.document_name || p.file_name)
                  const displayName = p.file_name || p.document_name || ''
                  const bodyText = p.content || p.message || ''

                  return (
                    <div key={p.id} className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base mb-1" style={{ color: '#111827' }}>{p.title}</h3>
                          {bodyText && (
                            <p className="text-sm leading-relaxed mb-3" style={{ color: '#6b7280' }}>{bodyText}</p>
                          )}

                          {hasFile && p.signed_url && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {/* Ver / descarregar ficheiro directamente */}
                              <a
                                href={p.signed_url}
                                download={p.file_name || true}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80"
                                style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                                <FileText size={13} />
                                {displayName || 'Ver documento'}
                                <Download size={12} />
                              </a>

                              {/* WhatsApp com ficheiro: abre ficheiro + mensagem */}
                              <button
                                onClick={() => handleWhatsApp(p, true)}
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80"
                                style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                                <Share2 size={13} /> WhatsApp + ficheiro
                              </button>
                            </div>
                          )}

                          {p.author_name && (
                            <p className="text-xs mt-3" style={{ color: '#9ca3af' }}>Publicado por {p.author_name}</p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-xs" style={{ color: '#9ca3af' }}>
                            {new Date(p.created_at).toLocaleDateString('pt-PT')}
                          </span>
                          {/* Partilha simples (so texto) */}
                          <button
                            onClick={() => handleWhatsApp(p, false)}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
                            style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                            <Share2 size={13} /> WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
