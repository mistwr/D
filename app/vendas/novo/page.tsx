'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { ArrowLeft, Upload, X, FileText, CheckCircle, Edit2, Download } from 'lucide-react'
import Link from 'next/link'


const OPERADORAS: Record<string, string[]> = {
  telecom: ['MEO', 'NOS', 'Vodafone', 'NOWO', 'DIGI', 'Outro'],
  energia: ['EDP', 'Endesa', 'Galp', 'Iberdrola', 'Gold Energy', 'Luzboa', 'Yes Energy', 'Repsol', 'Outro'],
  gas:     ['Galp', 'EDP', 'Endesa', 'Iberdrola', 'Gold Energy', 'Outro'],
  seguros: ['Fidelidade', 'Tranquilidade', 'Allianz', 'Generali', 'AXA', 'Zurich', 'Outro'],
  paineis_solares: ['EDP', 'Enel X', 'Sunwoda', 'Elgin', 'Galp', 'Outro'],
}

interface FileItem { file: File; name: string; type: string; size: number }

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function NovaVendaPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const { user, authFetch } = useAuth('parceiro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploadProgress, setUploadProgress] = useState('')

  const [comissoes, setComissoes] = useState<any[]>([])
  const [comissaoEstimada, setComissaoEstimada] = useState<string | null>(null)
  
  // Estados para PDF template
  const [pdfTemplate, setPdfTemplate] = useState<string>('')
  const [pdfUrl, setPdfUrl] = useState<string>('') // URL do PDF de materiais
  const [showPdfEditor, setShowPdfEditor] = useState(false)
  const [pdfContent, setPdfContent] = useState<string>('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfTemplates, setPdfTemplates] = useState<any[]>([]) // Lista de templates disponíveis
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('') // Template selecionado pelo parceiro

  const [form, setForm] = useState({
    service_type: 'telecom',
    operator: 'MEO',
    plano: '',
    contract_type: '',
    client_name: '',
    client_nif: '',
    client_cc: '',
    client_phone: '',
    client_email: '',
    client_iban: '',
    client_address: '',
    client_birthdate: '',
    amount: '',
    description: '',
    notes: '',
    energia_tipo: 'eletricidade',
    energia_tipo_processo: '',
    cpe: '',
    cui: '',
    potencia: '',
    escalao: '',
    gas_escalao: '',
    is_dual: false,
    telco_fixo: '',
    telco_fixo_cvp: '',
  })

  // Multiplos CPE e CUI
  const [cpes, setCpes] = useState<string[]>([''])
  const [cuis, setCuis] = useState<string[]>([''])

  // Multiplos numeros telco (ate 5)
  const [telcoNumeros, setTelcoNumeros] = useState<{numero: string, cvp: string}[]>([{numero: '', cvp: ''}])

  useEffect(() => {
    if (!user) return
    authFetch('/api/comissoes/operadora')
      .then(r => r.json())
      .then(d => setComissoes(d.comissoes || []))
      .catch(() => {})
  }, [user, authFetch])

  // Carregar template PDF e lista de templates ao mudar operadora (apenas telecom)
  useEffect(() => {
    if (form.service_type !== 'telecom') { 
      setPdfTemplate(''); setPdfUrl(''); setPdfTemplates([]); setSelectedTemplateId('')
      return 
    }
    
    setPdfLoading(true)
    
    // Buscar lista de templates disponíveis da operadora
    authFetch(`/api/pdf/templates?operadora=${encodeURIComponent(form.operator)}`)
      .then(r => r.json())
      .then(d => {
        const templates = Array.isArray(d) ? d : d.templates || []
        setPdfTemplates(templates)
        if (templates.length > 0) {
          setSelectedTemplateId(templates[0].id) // Selecionar primeiro por padrão
        }
        console.log('[v0] Templates carregados:', templates.length)
      })
      .catch((err) => {
        console.log('[v0] Erro ao carregar templates:', err)
        setPdfTemplates([])
        setSelectedTemplateId('')
      })
    
    // Tentar carregar template antiga forma (fallback)
    fetch(`/api/document-templates/get?operator=${form.operator}&type=FA`)
      .then(r => r.json())
      .then(d => {
        if (d.template?.file_url) {
          setPdfUrl(d.template.file_url)
          setPdfTemplate('')
        } else if (d.template?.template_content) {
          setPdfTemplate(d.template.template_content)
          setPdfUrl('')
        }
      })
      .catch(() => {})
      .finally(() => setPdfLoading(false))
  }, [form.service_type, form.operator, authFetch])

  // Calcular comissao estimada ao mudar operadora/plano (apenas telecom)
  useEffect(() => {
    if (form.service_type !== 'telecom') { setComissaoEstimada(null); return }
    const c = comissoes.find(c =>
      c.servico === 'telecom' &&
      c.operadora === form.operator &&
      (c.plano === form.plano || !c.plano)
    )
    if (!c) { setComissaoEstimada(null); return }
    const amount = parseFloat(form.amount) || 0
    if (c.modelo === 'mensalidade') {
      const mens = parseFloat(c.num_mensalidades) || 0
      const label = mens === 0.5 ? 'meia mensalidade' : mens === 1 ? '1 mensalidade' : `${mens} mensalidades`
      if (amount > 0) {
        setComissaoEstimada(`${label} × €${amount.toFixed(2)} = €${(mens * amount).toFixed(2)}`)
      } else {
        setComissaoEstimada(`${label} × valor mensal do pacote`)
      }
    } else if (c.modelo === 'percentagem') {
      const pct = parseFloat(c.percentagem) || 0
      if (amount > 0) {
        setComissaoEstimada(`${pct}% × €${amount.toFixed(2)} = €${(pct / 100 * amount).toFixed(2)}`)
      } else {
        setComissaoEstimada(`${pct}% do valor`)
      }
    } else if (c.modelo === 'fixo' || !c.modelo) {
      setComissaoEstimada(`€${parseFloat(c.valor_comissao).toFixed(2)} por contrato (fixo)`)
    } else {
      setComissaoEstimada(null)
    }
  }, [form.service_type, form.operator, form.plano, form.amount, comissoes])

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...newFiles.map(f => ({ file: f, name: f.name, type: f.type || 'application/pdf', size: f.size }))])
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeFile(idx: number) { setFiles(prev => prev.filter((_, i) => i !== idx)) }

  function openPdfEditor() {
    if (pdfUrl) {
      // Se for URL de PDF, abrir em nova aba ou carregar
      window.open(pdfUrl, '_blank')
      return
    }
    
    if (!pdfTemplate) return
    
    // Preencher PDF com dados do formulário
    let filledPdf = pdfTemplate
      .replace(/{{nome_cliente}}/g, form.client_name || '')
      .replace(/{{nif}}/g, form.client_nif || '')
      .replace(/{{email}}/g, form.client_email || '')
      .replace(/{{telefone}}/g, form.client_phone || '')
      .replace(/{{morada}}/g, form.client_address || '')
      .replace(/{{operadora}}/g, form.operator)
      .replace(/{{data_venda}}/g, new Date().toLocaleDateString('pt-PT'))
      .replace(/{{servico}}/g, form.plano || '')
      .replace(/{{vendedor}}/g, user?.email || '')
    
    setPdfContent(filledPdf)
    setShowPdfEditor(true)
  }

  async function savePdfDocument() {
    try {
      // Guardar documento preenchido na BD
      const res = await authFetch('/api/generated-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_html: pdfContent,
          document_type: 'FA',
          operator: form.operator,
          status: 'finalized'
        })
      })
      
      if (res.ok) {
        setShowPdfEditor(false)
      }
    } catch (e) {
      console.log('[v0] Error saving PDF:', e)
    }
  }

  async function downloadPdf() {
    if (!pdfContent) return
    
    try {
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: pdfContent,
          filename: `FA_${form.operator}_${form.client_nif}_${Date.now()}.pdf`
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `FA_${form.operator}_${form.client_nif}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (e) {
      console.log('[v0] Error downloading PDF:', e)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_nif.trim()) { setError('O NIF do cliente e obrigatorio'); return }
    if (form.service_type === 'energia' && form.operator === 'Iberdrola' && !form.client_birthdate) {
      setError('A data de nascimento e obrigatoria para Iberdrola'); return
    }
    setError('')
    setLoading(true)
    try {
      const isEnergyOrGas = form.service_type === 'energia' || form.service_type === 'gas'
      const isTelecom = form.service_type === 'telecom'
      const filteredCpes = cpes.filter(c => c.trim())
      const filteredCuis = cuis.filter(c => c.trim())
      const filteredTelcoNumeros = telcoNumeros.filter(t => t.numero.trim())
      const payload = {
        ...form,
        is_dual: form.service_type === 'energia' && form.energia_tipo === 'dual',
        energia_tipo: isEnergyOrGas ? form.energia_tipo : null,
        energia_tipo_processo: isEnergyOrGas ? form.energia_tipo_processo : null,
        cpe: isEnergyOrGas && filteredCpes.length > 0 ? filteredCpes[0] : null,
        cui: isEnergyOrGas && filteredCuis.length > 0 ? filteredCuis[0] : null,
        cpes: isEnergyOrGas ? filteredCpes : [],
        cuis: isEnergyOrGas ? filteredCuis : [],
        potencia: isEnergyOrGas ? form.potencia : null,
        escalao: isEnergyOrGas ? form.escalao : null,
        gas_escalao: isEnergyOrGas ? form.gas_escalao : null,
        telco_numeros: isTelecom ? filteredTelcoNumeros : [],
        telco_fixo: isTelecom ? form.telco_fixo : null,
        telco_fixo_cvp: isTelecom ? form.telco_fixo_cvp : null,
      }
      const res = await authFetch('/api/vendas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao registar venda'); setLoading(false); return }

      if (files.length > 0) {
        const uploadErros: string[] = []
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`A carregar ${i + 1}/${files.length}: ${files[i].name}`)
          try {
            const fd = new FormData()
            fd.append('venda_id', data.venda.id)
            fd.append('file', files[i].file)
            const upRes = await authFetch('/api/documentos', { method: 'POST', body: fd })
            if (!upRes.ok) {
              const upData = await upRes.json().catch(() => ({}))
              uploadErros.push(`${files[i].name}: ${upData.error || `erro ${upRes.status}`}`)
            }
          } catch {
            uploadErros.push(`${files[i].name}: erro de ligacao`)
          }
        }
        setUploadProgress('')
        if (uploadErros.length > 0) {
          setError(`Venda criada mas erro ao carregar ficheiros: ${uploadErros.join('; ')}`)
          setLoading(false)
          return
        }
      }

      // Gerar e guardar PDF para telecom
      if (form.service_type === 'telecom' && (pdfTemplate || pdfUrl)) {
        try {
          console.log('[v0] Iniciando geração de PDF. pdfTemplate:', !!pdfTemplate, 'pdfUrl:', !!pdfUrl)
          
          let filledPdf = pdfTemplate
          
          if (pdfTemplate) {
            // Preencher template HTML customizado com dados da venda
            filledPdf = pdfTemplate
              .replace(/{{nome_cliente}}/g, form.client_name || '')
              .replace(/{{nif}}/g, form.client_nif || '')
              .replace(/{{email}}/g, form.client_email || '')
              .replace(/{{telefone}}/g, form.client_phone || '')
              .replace(/{{morada}}/g, form.client_address || '')
              .replace(/{{operadora}}/g, form.operator)
              .replace(/{{data_venda}}/g, new Date().toLocaleDateString('pt-PT'))
              .replace(/{{servico}}/g, form.plano || '')
              .replace(/{{vendedor}}/g, user?.email || '')
            console.log('[v0] Template HTML preenchido')
          }
          
          // Guardar documento gerado
          console.log('[v0] Enviando para API generated-documents...')
          const docRes = await authFetch('/api/generated-documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sale_id: data.venda.id,
              document_html: filledPdf || '',
              document_type: 'FA',
              operator: form.operator,
              status: 'finalized',
              pdf_url: pdfUrl || undefined
            })
          })
          
          if (docRes.ok) {
            console.log('[v0] PDF guardado com sucesso!')
          } else {
            const errData = await docRes.json().catch(() => ({}))
            console.log('[v0] Warning: PDF não foi guardado -', errData)
          }
        } catch (e) {
          console.log('[v0] Warning: Erro ao gerar PDF:', e)
        }
      }

      // NOVO: Tentar gerar PDF automático com pdf-lib se houver template selecionado
      let pdfBlobUrl = null
      try {
        if (selectedTemplateId && form.service_type === 'telecom') {
          console.log('[v0] Template selecionado, gerando PDF preenchido...', selectedTemplateId)
          
          // Chamar API para gerar PDF preenchido com dados da venda
          const fillRes = await authFetch('/api/pdf/fill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sale_id: data.venda.id,
              template_id: selectedTemplateId,
              document_type: 'FA',
              fill_data: {
                client_name: form.client_name,
                client_nif: form.client_nif,
                client_email: form.client_email,
                client_phone: form.client_phone,
                client_address: form.client_address,
                operator: form.operator,
                plano: form.plano,
                amount: form.amount,
              }
            })
          })
          
          if (fillRes.ok) {
            const pdfBuffer = await fillRes.arrayBuffer()
            const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
            pdfBlobUrl = URL.createObjectURL(blob)
            console.log('[v0] PDF gerado com sucesso! Tamanho:', blob.size)
          } else {
            console.log('[v0] Erro ao gerar PDF via API. Status:', fillRes.status)
          }
        } else if (form.service_type === 'telecom' && pdfTemplates.length === 0) {
          console.log('[v0] Sem templates disponíveis para gerar PDF automático')
        }
      } catch (e) {
        console.log('[v0] Erro ao gerar PDF:', e)
      }

      setSuccess(true)
      
      // Se conseguiu gerar PDF, fazer download automático
      if (pdfBlobUrl) {
        setTimeout(() => {
          const a = document.createElement('a')
          a.href = pdfBlobUrl
          a.download = `venda-${form.operator}-${new Date().getTime()}.pdf`
          a.click()
          URL.revokeObjectURL(pdfBlobUrl)
          
          // Redirecionar após download
          setTimeout(() => router.push('/vendas'), 1000)
        }, 500)
      } else {
        // Redirecionar normalmente sem download
        setTimeout(() => router.push('/vendas'), 2000)
      }
    } catch { setError('Erro de conexao'); setLoading(false) }
  }

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" style={{ background: '#f8fafc' }}>
      <div className="rounded-full p-4" style={{ background: '#d1fae5' }}>
        <CheckCircle size={48} style={{ color: '#059669' }} />
      </div>
      <p className="text-xl font-bold" style={{ color: '#1e293b' }}>Venda registada com sucesso!</p>
      <p className="text-sm" style={{ color: '#64748b' }}>A redirecionar para as suas vendas...</p>
    </div>
  )

  const inp = { background: '#fff', border: '1px solid #d1d5db', color: '#1e293b' }
  const ops = OPERADORAS[form.service_type] || OPERADORAS.telecom
  const isEnergia = form.service_type === 'energia'

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Flex layout handles visible/hidden */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #f0f4f8 100%)' }}>
          <div className="max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Link href="/vendas" className="p-1.5 sm:p-2 hover:bg-muted rounded-lg transition flex-shrink-0">
                  <ArrowLeft size={18} className="text-foreground" />
                </Link>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground truncate">Nova Venda</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">Preencha o formulário para registar uma nova venda</p>
                </div>
              </div>
            </div>

          {error && (
            <div className="rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 mb-3 sm:mb-4 text-xs sm:text-sm font-medium" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">

              {/* TIPO DE SERVICO */}
              <div className="rounded-2xl p-2.5 sm:p-3 md:p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)', border: '1px solid #d0e8ff', borderTop: '2px solid #0066cc' }}>
                <h2 className="text-xs font-bold mb-3 sm:mb-4 uppercase tracking-widest" style={{ color: '#003d99', fontSize: '10px', letterSpacing: '0.08em' }}>Tipo de Serviço</h2>
                <div className="grid grid-cols-2 gap-1 sm:gap-2 md:gap-3">
                  {(['telecom', 'energia', 'gas', 'seguros'] as const).map(s => (
                    <button key={s} type="button"
                      onClick={() => { update('service_type', s); update('operator', OPERADORAS[s][0]); update('plano', '') }}
                      className="rounded-xl py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-2 transition-all whitespace-nowrap shadow-sm hover:shadow-md"
                      style={{
                        background: form.service_type === s ? 'linear-gradient(135deg, #0052a3 0%, #0066cc 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)',
                        color: form.service_type === s ? '#fff' : '#334155',
                        border: form.service_type === s ? '2px solid #003d99' : '2px solid #cbd5e1',
                        boxShadow: form.service_type === s ? '0 4px 12px rgba(0, 82, 163, 0.2)' : 'none',
                      }}>
                      {s === 'telecom' ? 'Telecom' : s === 'energia' ? 'Energia' : s === 'gas' ? 'Gás' : 'Seguros'}
                    </button>
                  ))}
                </div>
              </div>

              {/* OPERADORA */}
              <div className="rounded-2xl p-5 sm:p-6 md:p-5 lg:p-8 shadow-lg hover:shadow-xl transition-all" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f9ff 100%)', border: '1px solid #d0e8ff', borderTop: '2px solid #0066cc' }}>
                <h2 className="text-xs font-bold mb-5 uppercase tracking-widest" style={{ color: '#003d99', fontSize: '10px', letterSpacing: '0.08em' }}>Operadora e Plano</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#003d99' }}>Operadora *</label>
                    <select value={form.operator} onChange={e => update('operator', e.target.value)}
                      className="w-full rounded-lg px-4 py-3 text-sm font-medium border-2 transition focus:outline-none" 
                      style={{ borderColor: '#d0e8ff', background: 'linear-gradient(135deg, #f9fbfd 0%, #f0f7ff 100%)', color: '#003d99' }}
                      onFocus={(e) => { e.target.style.borderColor = '#0066cc'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 102, 204, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#d0e8ff'; e.target.style.boxShadow = 'none'; }}
                      required>
                      {ops.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#003d99' }}>Plano / Pacote</label>
                    <input type="text" value={form.plano} onChange={e => update('plano', e.target.value)}
                      placeholder="Ex: 39,95€ Pack Família"
                      className="w-full rounded-lg px-4 py-3 text-sm font-medium border-2 transition focus:outline-none"
                      style={{ borderColor: '#d0e8ff', background: 'linear-gradient(135deg, #f9fbfd 0%, #f0f7ff 100%)', color: '#003d99' }}
                      onFocus={(e) => { e.target.style.borderColor = '#0066cc'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 102, 204, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#d0e8ff'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#003d99' }}>Tipo de Contrato</label>
                    <input type="text" value={form.contract_type} onChange={e => update('contract_type', e.target.value)}
                      className="w-full rounded-lg px-4 py-3 text-sm font-medium border-2 transition focus:outline-none"
                      style={{ borderColor: '#d0e8ff', background: 'linear-gradient(135deg, #f9fbfd 0%, #f0f7ff 100%)', color: '#003d99' }}
                      onFocus={(e) => { e.target.style.borderColor = '#0066cc'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 102, 204, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#d0e8ff'; e.target.style.boxShadow = 'none'; }}
                      onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e7ff'}
                      placeholder="Ex: Residencial 24 meses, Empresarial, Mensal" />
                  </div>
                </div>

                {/* ENERGIA: tipo + CPE/CUI */}
                {isEnergia && (
                  <div className="mt-4 space-y-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Tipo de Fornecimento</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { v: 'eletricidade', l: 'Eletricidade' },
                          { v: 'gas', l: 'Gas' },
                          { v: 'dual', l: 'Dual (Elet. + Gas)' },
                        ].map(({ v, l }) => (
                          <button key={v} type="button"
                            onClick={() => update('energia_tipo', v)}
                            className="rounded-lg py-2.5 text-sm font-semibold border transition"
                            style={{
                              background: form.energia_tipo === v ? '#f59e0b' : '#f9fafb',
                              color: form.energia_tipo === v ? '#fff' : '#374151',
                              border: form.energia_tipo === v ? '1px solid #f59e0b' : '1px solid #e5e7eb',
                            }}>
                            {l}
                          </button>
                        ))}
                      </div>
                      {form.energia_tipo === 'dual' && (
                        <p className="mt-2 text-xs" style={{ color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px' }}>
                          Contrato dual: eletricidade e gas associados ao mesmo cliente e processo.
                        </p>
                      )}
                    </div>

                    {/* Tipo de Processo Energia */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Tipo de Processo *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { v: 'ED', l: 'ED', desc: 'Entrada Direta' },
                          { v: 'AT', l: 'AT', desc: 'Alt. Titularidade' },
                          { v: 'MC', l: 'MC', desc: 'Mudanca Comerc.' },
                        ].map(({ v, l, desc }) => (
                          <button key={v} type="button"
                            onClick={() => update('energia_tipo_processo', v)}
                            className="rounded-lg py-2.5 text-sm font-semibold border transition flex flex-col items-center"
                            style={{
                              background: form.energia_tipo_processo === v ? '#4338ca' : '#f9fafb',
                              color: form.energia_tipo_processo === v ? '#fff' : '#374151',
                              border: form.energia_tipo_processo === v ? '1px solid #4338ca' : '1px solid #e5e7eb',
                            }}>
                            <span className="font-bold">{l}</span>
                            <span className="text-xs opacity-80">{desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* CPEs - Multiplos */}
                      {(form.energia_tipo === 'eletricidade' || form.energia_tipo === 'dual') && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium" style={{ color: '#475569' }}>CPE (Eletricidade)</label>
                            <button type="button" onClick={() => setCpes([...cpes, ''])}
                              className="text-xs font-medium px-2 py-1 rounded-lg transition hover:opacity-80"
                              style={{ background: '#eef2ff', color: '#0ea5e9' }}>
                              + Adicionar CPE
                            </button>
                          </div>
                          {cpes.map((cpe, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <input type="text" value={cpe}
                                onChange={e => { const n = [...cpes]; n[idx] = e.target.value; setCpes(n) }}
                                className="flex-1 rounded-lg px-3 py-2.5 text-sm font-mono" style={inp}
                                placeholder={`CPE ${idx + 1} - PT00XXXXXXXXXX`} />
                              {cpes.length > 1 && (
                                <button type="button" onClick={() => setCpes(cpes.filter((_, i) => i !== idx))}
                                  className="rounded-lg px-3 py-2 text-xs transition hover:opacity-70"
                                  style={{ background: '#fef2f2', color: '#dc2626' }}>
                                  X
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* CUIs - Multiplos */}
                      {(form.energia_tipo === 'gas' || form.energia_tipo === 'dual') && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium" style={{ color: '#475569' }}>CUI (Gas)</label>
                            <button type="button" onClick={() => setCuis([...cuis, ''])}
                              className="text-xs font-medium px-2 py-1 rounded-lg transition hover:opacity-80"
                              style={{ background: '#fef3c7', color: '#92400e' }}>
                              + Adicionar CUI
                            </button>
                          </div>
                          {cuis.map((cui, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <input type="text" value={cui}
                                onChange={e => { const n = [...cuis]; n[idx] = e.target.value; setCuis(n) }}
                                className="flex-1 rounded-lg px-3 py-2.5 text-sm font-mono" style={inp}
                                placeholder={`CUI ${idx + 1} - PT00XXXXXXXXXXXX`} />
                              {cuis.length > 1 && (
                                <button type="button" onClick={() => setCuis(cuis.filter((_, i) => i !== idx))}
                                  className="rounded-lg px-3 py-2 text-xs transition hover:opacity-70"
                                  style={{ background: '#fef2f2', color: '#dc2626' }}>
                                  X
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Potencia - Eletricidade */}
                        {(form.energia_tipo === 'eletricidade' || form.energia_tipo === 'dual') && (
                          <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                              Potencia Contratada <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(kVA)</span>
                            </label>
                            <select value={form.potencia} onChange={e => update('potencia', e.target.value)}
                              className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}>
                              <option value="">Selecionar potencia...</option>
                              {['1.15', '2.3', '3.45', '4.6', '5.75', '6.9', '10.35', '13.8', '17.25', '20.7', '27.6', '34.5', '41.4'].map(p => (
                                <option key={p} value={p}>{p} kVA</option>
                              ))}
                              <option value="outro">Outro</option>
                            </select>
                          </div>
                        )}

                        {/* Escalao Eletricidade */}
                        {(form.energia_tipo === 'eletricidade' || form.energia_tipo === 'dual') && (
                          <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                              Escalao Eletricidade
                            </label>
                            <select value={form.escalao} onChange={e => update('escalao', e.target.value)}
                              className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}>
                              <option value="">Selecionar escalao...</option>
                              <option value="simples">Simples</option>
                              <option value="bi-horario">Bi-horario (Vazio / Fora de Vazio)</option>
                              <option value="tri-horario">Tri-horario (Ponta / Cheia / Vazio)</option>
                              <option value="tetra-horario">Tetra-horario</option>
                            </select>
                          </div>
                        )}

                        {/* Escalao Gas */}
                        {(form.energia_tipo === 'gas' || form.energia_tipo === 'dual') && (
                          <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                              Escalao Gas
                            </label>
                            <select value={form.gas_escalao} onChange={e => update('gas_escalao', e.target.value)}
                              className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp}>
                              <option value="">Selecionar escalao gas...</option>
                              <option value="1">Escalao 1 (ate 220 m3/ano)</option>
                              <option value="2">Escalao 2 (221-500 m3/ano)</option>
                              <option value="3">Escalao 3 (501-1000 m3/ano)</option>
                              <option value="4">Escalao 4 (1001-10000 m3/ano)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TELECOM: Numeros e CVP */}
                {form.service_type === 'telecom' && (
                  <div className="mt-4 space-y-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold" style={{ color: '#475569' }}>Numeros de Telemovel e CVP</h3>
                      {telcoNumeros.length < 5 && (
                        <button type="button" onClick={() => setTelcoNumeros([...telcoNumeros, {numero: '', cvp: ''}])}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg transition hover:opacity-80"
                          style={{ background: '#eef2ff', color: '#0ea5e9' }}>
                          + Adicionar Numero
                        </button>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: '#64748b' }}>Adicione ate 5 numeros de telemovel com os respetivos CVP (opcionais)</p>
                    
                    {telcoNumeros.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>Numero {idx + 1}</label>
                          <input type="text" value={item.numero}
                            onChange={e => { const n = [...telcoNumeros]; n[idx].numero = e.target.value; setTelcoNumeros(n) }}
                            className="w-full rounded-lg px-3 py-2 text-sm font-mono" style={inp}
                            placeholder="9XXXXXXXX" maxLength={9} />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>CVP</label>
                          <input type="text" value={item.cvp}
                            onChange={e => { const n = [...telcoNumeros]; n[idx].cvp = e.target.value; setTelcoNumeros(n) }}
                            className="w-full rounded-lg px-3 py-2 text-sm font-mono" style={inp}
                            placeholder="CVP (opcional)" />
                        </div>
                        {telcoNumeros.length > 1 && (
                          <button type="button" onClick={() => setTelcoNumeros(telcoNumeros.filter((_, i) => i !== idx))}
                            className="rounded-lg px-2.5 py-2 text-xs mt-5 transition hover:opacity-70"
                            style={{ background: '#fef2f2', color: '#dc2626' }}>
                            X
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Numero Fixo */}
                    <div className="pt-3" style={{ borderTop: '1px dashed #e5e7eb' }}>
                      <h4 className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Numero Fixo (opcional)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input type="text" value={form.telco_fixo} onChange={e => update('telco_fixo', e.target.value)}
                            className="w-full rounded-lg px-3 py-2 text-sm font-mono" style={inp}
                            placeholder="2XXXXXXXX" maxLength={9} />
                        </div>
                        <div>
                          <input type="text" value={form.telco_fixo_cvp} onChange={e => update('telco_fixo_cvp', e.target.value)}
                            className="w-full rounded-lg px-3 py-2 text-sm font-mono" style={inp}
                            placeholder="CVP Fixo (opcional)" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DADOS CLIENTE */}
              <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: '#64748b' }}>3. Dados do Cliente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Nome Completo *</label>
                    <input type="text" value={form.client_name} onChange={e => update('client_name', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} required placeholder="Nome completo do cliente" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>NIF *</label>
                    <input type="text" value={form.client_nif} onChange={e => update('client_nif', e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-lg px-3 py-2.5 text-sm font-mono" style={inp}
                      required placeholder="123456789" maxLength={9} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                      Numero do CC <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(opcional)</span>
                    </label>
                    <input type="text" value={form.client_cc} onChange={e => update('client_cc', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm font-mono" style={inp}
                      placeholder="XXXXXXXX X XXXXXXXX X" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                      Morada Completa *
                    </label>
                    <input type="text" value={form.client_address} onChange={e => update('client_address', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" 
                      style={{ ...inp, borderColor: form.client_address ? '#d1d5db' : '#fbbf24', background: form.client_address ? '#ffffff' : '#fffbeb' }}
                      required placeholder="Rua, numero, codigo postal, localidade (ex: Rua da Liberdade 123, 4000-001 Porto)" />
                    {!form.client_address && (
                      <p className="mt-1 text-xs" style={{ color: '#d97706' }}>Campo obrigatorio - insira a morada completa do cliente</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Telefone</label>
                    <input type="tel" value={form.client_phone} onChange={e => update('client_phone', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} placeholder="9XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                      Data de Nascimento {form.service_type === 'energia' && form.operator === 'Iberdrola' ? '*' : ''}
                      {!(form.service_type === 'energia' && form.operator === 'Iberdrola') && (
                        <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(opcional)</span>
                      )}
                    </label>
                    <input type="date" value={form.client_birthdate} onChange={e => update('client_birthdate', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} />
                    {form.service_type === 'energia' && form.operator === 'Iberdrola' && !form.client_birthdate && (
                      <p className="mt-1 text-xs" style={{ color: '#d97706' }}>Campo obrigatório para Iberdrola</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                      Email <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(opcional)</span>
                    </label>
                    <input type="email" value={form.client_email} onChange={e => update('client_email', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} placeholder="email@exemplo.pt" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                      IBAN <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(opcional)</span>
                    </label>
                    <input type="text" value={form.client_iban} onChange={e => update('client_iban', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm font-mono" style={inp}
                      placeholder="PT50 XXXX XXXX XXXX XXXX XXXX X" />
                  </div>
                </div>
              </div>

              {/* VENDA */}
              <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: '#64748b' }}>4. Dados da Venda</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                      {form.service_type === 'telecom' ? 'Valor Mensal do Pacote (€)' : 'Valor do Contrato (€)'}
                    </label>
                    <input type="number" step="0.01" min="0" value={form.amount} onChange={e => update('amount', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm" style={inp} placeholder="0.00" />
                    {comissaoEstimada && (
                      <div className="mt-2 rounded-lg px-3 py-2 text-xs font-medium" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' }}>
                        Comissao estimada: {comissaoEstimada}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>Descricao</label>
                    <textarea rows={2} value={form.description} onChange={e => update('description', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm resize-none" style={inp}
                      placeholder="Descricao do servico contratado..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#475569' }}>
                      Notas Internas <span className="font-normal text-xs" style={{ color: '#9ca3af' }}>(apenas visivel para si e admin)</span>
                    </label>
                    <textarea rows={2} value={form.notes} onChange={e => update('notes', e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm resize-none" style={inp}
                      placeholder="Notas internas..." />
                  </div>
                </div>
              </div>

              {/* TEMPLATE PDF (apenas telecom) */}
              {form.service_type === 'telecom' && pdfTemplates.length > 0 && (
                <div className="rounded-xl p-5 shadow-sm" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                  <h2 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#166534' }}>
                    <FileText size={14} className="inline mr-2" />
                    Material de Apoio PDF
                  </h2>
                  <p className="text-xs mb-3" style={{ color: '#4d7c0f' }}>
                    Selecione o material que pretende incluir e ser preenchido automaticamente
                  </p>
                  <select 
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm font-medium"
                    style={{ background: '#fff', border: '1px solid #86efac', color: '#166534' }}
                  >
                    <option value="">-- Selecione um template --</option>
                    {pdfTemplates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nome} ({t.tipo})
                      </option>
                    ))}
                  </select>
                  {selectedTemplateId && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium" style={{ color: '#166534' }}>
                      <CheckCircle size={14} />
                      Template selecionado: será preenchido automaticamente ao registar
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENTOS */}
              <div className="rounded-xl p-5 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <h2 className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: '#64748b' }}>5. Documentos Anexos</h2>
                <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>Contratos, faturas, comprovativos ou outros documentos</p>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 w-full rounded-xl px-5 py-4 text-sm transition"
                  style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', color: '#475569' }}>
                  <div className="h-9 w-9 flex items-center justify-center rounded-lg flex-shrink-0" style={{ background: '#eef2ff' }}>
                    <Upload size={18} style={{ color: '#4f46e5' }} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm" style={{ color: '#1e293b' }}>Clique para adicionar ficheiros</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>PDF, DOC, JPG, PNG</p>
                  </div>
                </button>
                {uploadProgress && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium" style={{ color: '#4f46e5' }}>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2" style={{ borderColor: '#0ea5e9' }} />
                    {uploadProgress}
                  </div>
                )}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                        style={{ background: '#f9fafb', border: '1px solid #e2e8f0' }}>
                        <FileText size={16} style={{ color: '#64748b', flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#1e293b' }}>{f.name}</p>
                          <p className="text-xs" style={{ color: '#9ca3af' }}>{formatSize(f.size)}</p>
                        </div>
                        <button type="button" onClick={() => removeFile(i)} className="rounded p-1 hover:opacity-70">
                          <X size={14} style={{ color: '#dc2626' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECÇÃO PDF CONTRATO (Telecom) */}
              {form.service_type === 'telecom' && (pdfTemplate || pdfUrl) && (
                <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2" style={{ color: '#1e293b' }}>
                        <FileText size={18} style={{ color: '#0ea5e9' }} />
                        Contrato FA - {form.operator}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                        {pdfLoading ? 'A carregar template...' : pdfUrl ? 'PDF de materiais carregado' : 'Clique em "Editar" para visualizar e editar o contrato'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={openPdfEditor}
                        disabled={(!pdfTemplate && !pdfUrl) || pdfLoading}
                        className="p-2 rounded-lg hover:bg-slate-200 transition disabled:opacity-50"
                        title={pdfUrl ? 'Abrir PDF' : 'Editar contrato'}
                      >
                        <Edit2 size={16} style={{ color: '#0ea5e9' }} />
                      </button>
                      <button
                        type="button"
                        onClick={downloadPdf}
                        disabled={!pdfContent && !pdfUrl}
                        className="p-2 rounded-lg hover:bg-slate-200 transition disabled:opacity-50"
                        title="Descarregar PDF"
                      >
                        <Download size={16} style={{ color: '#22c55e' }} />
                      </button>
                    </div>
                  </div>
                  {pdfContent && (
                    <div className="text-xs" style={{ color: '#64748b' }}>
                      ✓ Contrato preenchido com os dados do formulário
                    </div>
                  )}
                </div>
              )}

              {/* ACOES */}
              <div className="flex gap-3 pb-8">
                <Link href="/vendas" className="flex-1">
                  <button type="button" className="w-full rounded-lg py-3 text-sm font-semibold border transition hover:bg-gray-50"
                    style={{ color: '#475569', border: '1px solid #d1d5db' }}>
                    Cancelar
                  </button>
                </Link>
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  {loading ? (uploadProgress || 'A registar...') : `Registar Venda${files.length > 0 ? ` + ${files.length} doc.` : ''}`}
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>

      {/* Modal Editor PDF */}
      {showPdfEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto flex flex-col">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white" style={{ borderColor: '#e2e8f0' }}>
              <h3 className="font-semibold text-lg" style={{ color: '#1e293b' }}>Editar Contrato FA - {form.operator}</h3>
              <button onClick={() => setShowPdfEditor(false)} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} style={{ color: '#64748b' }} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-50">
              {pdfUrl ? (
                <iframe src={pdfUrl} className="w-full h-full rounded-lg" style={{ border: 'none', minHeight: '500px' }} />
              ) : (
                <div className="flex items-center justify-center h-96 text-slate-400">Sem PDF disponível</div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-white sticky bottom-0" style={{ borderColor: '#e2e8f0' }}>
              <button onClick={() => setShowPdfEditor(false)} className="px-4 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-100">Cancelar</button>
              <button onClick={() => { setShowPdfEditor(false); alert('PDF guardado!') }} className="px-4 py-2 rounded-lg font-medium text-white" style={{ background: '#0ea5e9' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
