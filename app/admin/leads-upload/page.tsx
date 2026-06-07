'use client'

import { useState, useEffect } from 'react'
import { Upload, FileSpreadsheet, Eye, Trash2, Search, Filter, Download } from 'lucide-react'

interface Lead {
  id: string
  nome: string
  email?: string
  telefone?: string
  morada?: string
  servico?: string
  operadora?: string
  status: string
  created_at: string
}

interface UploadRecord {
  id: string
  file_name: string
  file_type: string
  total_rows: number
  success_rows: number
  error_rows: number
  upload_status: string
  created_at: string
}

export default function LeadsUploadPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [uploads, setUploads] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'leads' | 'uploads'>('leads')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadLeads()
    loadUploads()
  }, [])

  async function loadLeads() {
    try {
      const query = new URLSearchParams()
      if (search) query.append('search', search)
      if (statusFilter) query.append('status', statusFilter)
      
      const res = await fetch(`/api/leads-database?${query}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      } else {
        console.log('[v0] Error loading leads:', res.status)
      }
    } catch (e) {
      console.log('[v0] Error loading leads:', e)
    }
    setLoading(false)
  }

  async function loadUploads() {
    try {
      const res = await fetch('/api/leads/uploads')
      if (res.ok) {
        const data = await res.json()
        setUploads(data.uploads || [])
      }
    } catch (e) {
      console.log('[v0] Error loading uploads:', e)
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true)
    setMessage(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/leads/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `✅ ${data.successRows} leads carregados com sucesso!`
        })
        loadLeads()
        loadUploads()
      } else {
        setMessage({
          type: 'error',
          text: `❌ ${data.error}`
        })
      }
    } catch (e) {
      setMessage({
        type: 'error',
        text: 'Erro ao fazer upload do ficheiro'
      })
      console.log('[v0] Upload error:', e)
    }
    setUploading(false)
  }

  async function updateLeadStatus(leadId: string, newStatus: string) {
    try {
      const res = await fetch('/api/leads-database', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus })
      })
      
      if (res.ok) {
        loadLeads()
      }
    } catch (e) {
      console.log('[v0] Error updating lead:', e)
    }
  }

  async function deleteLead(leadId: string) {
    if (!confirm('Tem a certeza que quer apagar este lead?')) return
    
    try {
      const res = await fetch(`/api/leads-database?id=${leadId}`, { method: 'DELETE' })
      if (res.ok) {
        loadLeads()
      }
    } catch (e) {
      console.log('[v0] Error deleting lead:', e)
    }
  }

  const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
    novo: { bg: '#fef3c7', color: '#92400e', label: 'Novo' },
    contactado: { bg: '#dbeafe', color: '#1e40af', label: 'Contactado' },
    interessado: { bg: '#d1fae5', color: '#065f46', label: 'Interessado' },
    convertido: { bg: '#c7d2fe', color: '#3730a3', label: 'Convertido' },
    rejeitado: { bg: '#fee2e2', color: '#991b1b', label: 'Rejeitado' }
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#f8fafc' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e293b' }}>Base de Dados de Leads</h1>
          <p style={{ color: '#64748b' }}>Carregue ficheiros Excel, CSV ou PDF para adicionar leads à sua base de dados</p>
        </div>

        {/* Mensagens */}
        {message && (
          <div className="mb-6 p-4 rounded-lg" style={{
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Upload Area */}
        <div
          className="mb-8 p-8 border-2 border-dashed rounded-lg cursor-pointer transition"
          style={{
            borderColor: dragOver ? '#0ea5e9' : '#cbd5e1',
            background: dragOver ? '#f0f9ff' : '#ffffff'
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0])
            }
          }}
        >
          <div className="text-center">
            <Upload size={40} style={{ color: '#0ea5e9', margin: '0 auto 16px' }} />
            <p className="text-lg font-semibold mb-2" style={{ color: '#1e293b' }}>
              Arrastar ficheiro aqui ou clicar para selecionar
            </p>
            <p style={{ color: '#64748b' }}>Suporta: Excel (.xlsx), CSV (.csv)</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              disabled={uploading}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="mt-4 inline-block px-6 py-2 rounded-lg font-medium text-white cursor-pointer" 
              style={{ background: '#0ea5e9' }}>
              {uploading ? 'A fazer upload...' : 'Selecionar Ficheiro'}
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b" style={{ borderColor: '#e2e8f0' }}>
          <button
            onClick={() => setActiveTab('leads')}
            className="px-4 py-3 font-semibold border-b-2 transition"
            style={{
              borderColor: activeTab === 'leads' ? '#0ea5e9' : 'transparent',
              color: activeTab === 'leads' ? '#0ea5e9' : '#64748b'
            }}
          >
            Leads ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className="px-4 py-3 font-semibold border-b-2 transition"
            style={{
              borderColor: activeTab === 'uploads' ? '#0ea5e9' : 'transparent',
              color: activeTab === 'uploads' ? '#0ea5e9' : '#64748b'
            }}
          >
            Histórico de Uploads ({uploads.length})
          </button>
        </div>

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div>
            {/* Filtros */}
            <div className="mb-6 flex gap-4 flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Procurar por nome, email ou telefone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyUp={() => loadLeads()}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border"
                    style={{ borderColor: '#e2e8f0', color: '#1e293b' }}
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); loadLeads() }}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: '#e2e8f0', color: '#1e293b' }}
              >
                <option value="">Todos os Status</option>
                <option value="novo">Novo</option>
                <option value="contactado">Contactado</option>
                <option value="interessado">Interessado</option>
                <option value="convertido">Convertido</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
            </div>

            {/* Leads List */}
            {loading ? (
              <div className="text-center py-8" style={{ color: '#64748b' }}>A carregar...</div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 rounded-lg" style={{ background: '#f1f5f9' }}>
                <FileSpreadsheet size={40} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
                <p style={{ color: '#64748b' }}>Nenhum lead encontrado. Carregue um ficheiro para começar!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th className="px-4 py-3 text-left" style={{ color: '#475569', fontWeight: 600 }}>Nome</th>
                      <th className="px-4 py-3 text-left" style={{ color: '#475569', fontWeight: 600 }}>Email</th>
                      <th className="px-4 py-3 text-left" style={{ color: '#475569', fontWeight: 600 }}>Telefone</th>
                      <th className="px-4 py-3 text-left" style={{ color: '#475569', fontWeight: 600 }}>Serviço</th>
                      <th className="px-4 py-3 text-left" style={{ color: '#475569', fontWeight: 600 }}>Status</th>
                      <th className="px-4 py-3 text-center" style={{ color: '#475569', fontWeight: 600 }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      const statusColor = STATUS_COLORS[lead.status] || STATUS_COLORS['novo']
                      return (
                        <tr key={lead.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td className="px-4 py-3" style={{ color: '#1e293b', fontWeight: 500 }}>{lead.nome}</td>
                          <td className="px-4 py-3" style={{ color: '#64748b' }}>{lead.email || '-'}</td>
                          <td className="px-4 py-3" style={{ color: '#64748b' }}>{lead.telefone || '-'}</td>
                          <td className="px-4 py-3" style={{ color: '#64748b' }}>{lead.servico || '-'}</td>
                          <td className="px-4 py-3">
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                              className="px-2 py-1 rounded text-sm font-medium border-0"
                              style={{ background: statusColor.bg, color: statusColor.color }}
                            >
                              <option value="novo">Novo</option>
                              <option value="contactado">Contactado</option>
                              <option value="interessado">Interessado</option>
                              <option value="convertido">Convertido</option>
                              <option value="rejeitado">Rejeitado</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => deleteLead(lead.id)}
                              className="p-2 hover:opacity-70 transition"
                              title="Apagar"
                            >
                              <Trash2 size={16} style={{ color: '#ef4444' }} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Uploads Tab */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            {uploads.length === 0 ? (
              <div className="text-center py-12 rounded-lg" style={{ background: '#f1f5f9' }}>
                <p style={{ color: '#64748b' }}>Nenhum upload realizado ainda</p>
              </div>
            ) : (
              uploads.map(upload => (
                <div key={upload.id} className="p-4 rounded-lg border" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: '#1e293b' }}>{upload.file_name}</p>
                      <div className="text-sm mt-2 flex gap-6" style={{ color: '#64748b' }}>
                        <span>Total: {upload.total_rows} leads</span>
                        <span style={{ color: '#22c55e' }}>✓ Sucesso: {upload.success_rows}</span>
                        {upload.error_rows > 0 && <span style={{ color: '#ef4444' }}>✗ Erros: {upload.error_rows}</span>}
                        <span>{new Date(upload.created_at).toLocaleDateString('pt-PT')}</span>
                      </div>
                    </div>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: upload.upload_status === 'completed' ? '#d1fae5' : '#fef3c7',
                      color: upload.upload_status === 'completed' ? '#065f46' : '#92400e'
                    }}>
                      {upload.upload_status === 'completed' ? 'Completo' : 'Processando'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
