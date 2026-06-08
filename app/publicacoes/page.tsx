'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Newspaper, Download, ExternalLink } from 'lucide-react'

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

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" >
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4338ca' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div>
        <Sidebar userRole="parceiro" />
        <main className="pt-16 lg:ml-64 min-h-screen overflow-x-hidden">
          <div className="p-4 md:p-5 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="rounded-xl p-2.5" >
                <Newspaper size={24} style={{ color: '#0ea5e9' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Publicacoes</h1>
                <p className="text-sm" style={{ color: '#64748b' }}>
                  {pubs.length === 0 ? 'Sem publicacoes' : `${pubs.length} publicacao${pubs.length !== 1 ? 'es' : ''} disponivel${pubs.length !== 1 ? 'eis' : ''}`}
                </p>
              </div>
            </div>

            {pubs.length === 0 ? (
              <div className="rounded-xl p-12 text-center shadow-sm" >
                <Newspaper size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium" style={{ color: '#475569' }}>Nenhuma publicacao</p>
                <p className="text-sm" style={{ color: '#64748b' }}>As publicacoes da equipa aparecerao aqui.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pubs.map(p => {
                  const hasFile = !!(p.file_path || p.document_name || p.file_name)
                  const displayName = p.file_name || p.document_name || ''
                  const bodyText = p.content || p.message || ''

                  return (
                    <div key={p.id} className="rounded-xl p-5 shadow-sm" >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base mb-1" style={{ color: '#1e293b' }}>{p.title}</h3>
                          {bodyText && (
                            <p className="text-sm leading-relaxed mb-3" style={{ color: '#64748b' }}>{bodyText}</p>
                          )}

                          {hasFile && p.signed_url && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              <a
                                href={p.signed_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80"
                                >
                                <ExternalLink size={13} />
                                {displayName || 'Abrir documento'}
                              </a>
                              <a
                                href={p.signed_url}
                                download={displayName || true}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80"
                                >
                                <Download size={13} /> Download
                              </a>
                            </div>
                          )}

                          {p.author_name && (
                            <p className="text-xs mt-3" style={{ color: '#9ca3af' }}>Publicado por {p.author_name}</p>
                          )}
                        </div>

                        <span className="text-xs flex-shrink-0" style={{ color: '#9ca3af' }}>
                          {new Date(p.created_at).toLocaleDateString('pt-PT')}
                        </span>
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
