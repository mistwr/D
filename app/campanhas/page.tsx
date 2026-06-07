'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Megaphone, FileText, Download, ExternalLink, ChevronDown, ChevronUp, Zap, Flame, Wifi, Shield } from 'lucide-react'
interface Campanha {
  id: string
  title: string
  operator: string
  service_type: string
  description: string
  status: string
  logo_url: string
  pdf_count: number
  created_at: string
}
interface Ficheiro {
  id: string
  file_name: string
  file_type: string
  file_size: number
  signed_url: string | null
  created_at: string
}

const SERVICE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  energia:  { icon: Zap,      color: '#d97706', bg: '#fef3c7', label: 'Energia' },
  gas:      { icon: Flame,    color: '#dc2626', bg: '#fee2e2', label: 'Gas' },
  telecom:  { icon: Wifi,     color: '#2563eb', bg: '#eff6ff', label: 'Telecom' },
  seguros:  { icon: Shield,   color: '#16a34a', bg: '#f0fdf4', label: 'Seguros' },
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CampanhasParceiroPage() {
  const { user, loading: authLoading } = useAuth('parceiro')
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [ficheiros, setFicheiros] = useState<Record<string, Ficheiro[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingFich, setLoadingFich] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetch('/api/campanhas', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setCampanhas((d.campanhas ?? []).filter((c: Campanha) => c.status === 'ativa')))
      .finally(() => setLoading(false))
  }, [user])

  async function toggleExpand(id: string) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!ficheiros[id]) {
      setLoadingFich(id)
      const res = await fetch(`/api/campanhas/ficheiros?campanha_id=${id}`, { credentials: 'include' })
      const data = await res.json()
      setFicheiros(prev => ({ ...prev, [id]: data.ficheiros ?? [] }))
      setLoadingFich(null)
    }
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4338ca' }} />
    </div>
  )

  const ativas = campanhas.filter(c => c.status === 'ativa')

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="parceiro" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-5 max-w-5xl mx-auto w-full mx-auto w-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="rounded-xl p-2.5" style={{ background: '#eef2ff' }}>
                <Megaphone size={24} style={{ color: '#0ea5e9' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#1e293b' }}>Campanhas</h1>
                <p className="text-sm" style={{ color: '#64748b' }}>Materiais e tabelas de campanhas activas</p>
              </div>
            </div>

            {ativas.length === 0 ? (
              <div className="rounded-xl p-12 text-center shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <Megaphone size={48} style={{ color: '#d1d5db' }} className="mx-auto mb-4" />
                <p className="text-lg font-medium" style={{ color: '#475569' }}>Nenhuma campanha activa</p>
                <p className="text-sm" style={{ color: '#64748b' }}>As campanhas activas aparecerao aqui com os seus materiais.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {ativas.map(c => {
                  const svc = SERVICE_ICONS[c.service_type] ?? SERVICE_ICONS['telecom']
                  const SvcIcon = svc.icon
                  const isOpen = expanded === c.id
                  const campFich = ficheiros[c.id] ?? []

                  return (
                    <div key={c.id} className="rounded-xl shadow-sm overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                      {/* Cabeçalho da campanha */}
                      <div className="flex items-center gap-4 p-5">
                        {/* Logo */}
                        <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ background: svc.bg, border: `1px solid ${svc.color}22` }}>
                          {c.logo_url ? (
                            <Image src={c.logo_url} alt={c.operator || c.title} width={56} height={56} className="object-cover w-full h-full" unoptimized />
                          ) : (
                            <SvcIcon size={26} style={{ color: svc.color }} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base" style={{ color: '#1e293b' }}>{c.title}</h3>
                            {c.operator && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: svc.bg, color: svc.color }}>
                                {c.operator}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                              Activa
                            </span>
                          </div>
                          {c.description && (
                            <p className="text-sm mt-1 line-clamp-2" style={{ color: '#64748b' }}>{c.description}</p>
                          )}
                          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                            {c.pdf_count ?? 0} ficheiro{(c.pdf_count ?? 0) !== 1 ? 's' : ''} &middot; {new Date(c.created_at).toLocaleDateString('pt-PT')}
                          </p>
                        </div>

                        <button onClick={() => toggleExpand(c.id)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors flex-shrink-0"
                          style={{ background: isOpen ? '#eef2ff' : '#f9fafb', color: isOpen ? '#4338ca' : '#374151', border: '1px solid #e2e8f0' }}>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {isOpen ? 'Fechar' : 'Ver materiais'}
                        </button>
                      </div>

                      {/* Ficheiros */}
                      {isOpen && (
                        <div className="px-5 pb-5" style={{ borderTop: '1px solid #f3f4f6' }}>
                          <p className="text-xs font-semibold uppercase tracking-wide mt-4 mb-3" style={{ color: '#9ca3af' }}>
                            Materiais e documentos
                          </p>
                          {loadingFich === c.id ? (
                            <div className="flex justify-center py-6">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#4338ca' }} />
                            </div>
                          ) : campFich.length === 0 ? (
                            <p className="text-sm py-4 text-center" style={{ color: '#9ca3af' }}>Nenhum ficheiro disponivel para esta campanha.</p>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {campFich.map(f => (
                                <div key={f.id} className="flex items-center justify-between rounded-lg p-3 gap-3"
                                  style={{ background: '#f9fafb', border: '1px solid #e2e8f0' }}>
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="rounded-lg p-1.5 flex-shrink-0" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                                      <FileText size={16} style={{ color: f.file_type === 'image' ? '#0891b2' : f.file_type === 'pdf' ? '#dc2626' : '#6b7280' }} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate" style={{ color: '#1e293b' }}>{f.file_name}</p>
                                      <p className="text-xs" style={{ color: '#9ca3af' }}>{f.file_type.toUpperCase()} &middot; {formatSize(f.file_size)}</p>
                                    </div>
                                  </div>
                                  {f.signed_url && (
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <a href={f.signed_url} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                                        style={{ background: '#eef2ff', color: '#0ea5e9' }}>
                                        <ExternalLink size={12} /> Abrir
                                      </a>
                                      <a href={f.signed_url} download={f.file_name} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                                        style={{ background: '#f0fdf4', color: '#166534' }}>
                                        <Download size={12} /> Download
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
