// In-memory data store - zero external dependencies
// Admin pre-registado: email "admin" password "admin"

export type User = {
  id: string
  email: string
  password: string
  full_name: string
  role: 'admin' | 'parceiro'
  company_name: string
  phone: string
  created_at: string
}

export type Venda = {
  id: string
  user_id: string
  client_name: string
  client_email: string
  client_phone: string
  amount: number
  currency: string
  description: string
  contract_type: string
  service_type: 'energia' | 'telecom'
  operator: string
  status: 'pendente' | 'em_revisao' | 'ativa' | 'processado' | 'pago' | 'cancelado' | 'rejeitado'
  notes: string
  created_at: string
  updated_at: string
}

export type Documento = {
  id: string
  venda_id: string
  file_name: string
  file_type: string
  file_size: number
  file_data: string  // base64 encoded
  uploaded_by: string
  created_at: string
}

export type CampanhaPDF = {
  id: string
  campanha_id: string
  file_name: string
  uploaded_at: string
}

export type Campanha = {
  id: string
  title: string
  operator: string
  service_type: 'energia' | 'telecom'
  description: string
  status: 'ativa' | 'inativa' | 'terminada'
  created_at: string
}

export type Publicacao = {
  id: string
  parceiro_id: string
  title: string
  message: string
  document_name: string
  created_by: string
  created_at: string
}

export type Comissao = {
  parceiro_id: string
  energia_percent: number
  telecom_percent: number
  energia_fixo: number   // valor fixo por venda de energia
  telecom_fixo: number   // valor fixo por venda de telecom
  updated_at: string
}

export type Notificacao = {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export type Contrato = {
  id: string
  user_id: string
  client_name: string
  client_phone: string
  client_cc: string
  client_nif: string
  client_morada: string
  client_email: string
  servico_type: 'energia' | 'telecom'
  operadora: string
  assinado_cliente: boolean
  assinado_vendedor: boolean
  pdf_template_url: string
  pdf_filled_url: string
  pdf_signed_url: string
  status: 'rascunho' | 'pendente_cliente' | 'pendente_vendedor' | 'finalizado' | 'rejeitado'
  created_at: string
  updated_at: string
}

export type ContratoAssinatura = {
  id: string
  contrato_id: string
  tipo: 'cliente' | 'vendedor'
  assinante_id: string
  assinante_email: string
  assinante_nome: string
  signature_image_base64: string
  ip_address: string
  created_at: string
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ---- GLOBAL STORE ----
const users: User[] = [
  {
    id: 'admin-001',
    email: 'admin',
    password: 'admin',
    full_name: 'Administrador',
    role: 'admin',
    company_name: 'Solucoes Diferentes',
    phone: '+351000000000',
    created_at: new Date().toISOString(),
  },
]

const vendas: Venda[] = []
const documentos: Documento[] = []
const campanhas: Campanha[] = []
const campanha_pdfs: CampanhaPDF[] = []
const contratos: Contrato[] = []
const contrato_assinaturas: ContratoAssinatura[] = []
const publicacoes: Publicacao[] = []
const notificacoes: Notificacao[] = []
const comissoes: Comissao[] = []

// ---- USERS ----
export function getUsers() { return users }
export function getUserById(id: string) { return users.find(u => u.id === id) }
export function getUserByEmail(email: string) { return users.find(u => u.email === email) }
export function getParceiros() { return users.filter(u => u.role === 'parceiro') }
export function createUser(data: Omit<User, 'id' | 'created_at'>) {
  const existing = getUserByEmail(data.email)
  if (existing) return null
  const user: User = { ...data, id: uid(), created_at: new Date().toISOString() }
  users.push(user)
  return user
}

// ---- VENDAS ----
export function getVendas() { return vendas }
export function getVendasByUser(userId: string) { return vendas.filter(v => v.user_id === userId) }
export function getVendaById(id: string) { return vendas.find(v => v.id === id) }
export function createVenda(data: Omit<Venda, 'id' | 'created_at' | 'updated_at'>) {
  const venda: Venda = { ...data, id: uid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  vendas.push(venda)
  return venda
}
export function updateVendaStatus(id: string, status: Venda['status']) {
  const v = vendas.find(x => x.id === id)
  if (v) { v.status = status; v.updated_at = new Date().toISOString() }
  return v
}

// ---- DOCUMENTOS ----
export function getDocumentos() { return documentos }
export function getDocsByVenda(vendaId: string) { return documentos.filter(d => d.venda_id === vendaId) }
export function getDocsByUser(userId: string) {
  const userVendaIds = vendas.filter(v => v.user_id === userId).map(v => v.id)
  return documentos.filter(d => userVendaIds.includes(d.venda_id))
}
export function createDocumento(data: Omit<Documento, 'id' | 'created_at'>) {
  const doc: Documento = { ...data, id: uid(), created_at: new Date().toISOString() }
  documentos.push(doc)
  return doc
}

// ---- CAMPANHAS ----
export function getCampanhas() { return campanhas }
export function getCampanhaById(id: string) { return campanhas.find(c => c.id === id) }
export function createCampanha(data: Omit<Campanha, 'id' | 'created_at'>) {
  const c: Campanha = { ...data, id: uid(), created_at: new Date().toISOString() }
  campanhas.push(c)
  return c
}
export function getCampanhaPDFs(campanhaId: string) { return campanha_pdfs.filter(p => p.campanha_id === campanhaId) }
export function addCampanhaPDF(campanhaId: string, fileName: string) {
  const pdf: CampanhaPDF = { id: uid(), campanha_id: campanhaId, file_name: fileName, uploaded_at: new Date().toISOString() }
  campanha_pdfs.push(pdf)
  return pdf
}
export function getAllCampanhaPDFs() { return campanha_pdfs }

// ---- PUBLICACOES ----
export function getPublicacoes() { return publicacoes }
export function getPublicacoesByParceiro(parceiroId: string) { return publicacoes.filter(p => p.parceiro_id === parceiroId) }
export function createPublicacao(data: Omit<Publicacao, 'id' | 'created_at'>) {
  const p: Publicacao = { ...data, id: uid(), created_at: new Date().toISOString() }
  publicacoes.push(p)
  return p
}

// ---- COMISSOES ----
export function getComissao(parceiroId: string): Comissao | undefined { return comissoes.find(c => c.parceiro_id === parceiroId) }
export function getAllComissoes() { return comissoes }
export function setComissao(parceiroId: string, data: { energia_percent: number; telecom_percent: number; energia_fixo: number; telecom_fixo: number }) {
  const idx = comissoes.findIndex(c => c.parceiro_id === parceiroId)
  const entry: Comissao = { parceiro_id: parceiroId, ...data, updated_at: new Date().toISOString() }
  if (idx >= 0) comissoes[idx] = entry
  else comissoes.push(entry)
  return entry
}
export function calcComissaoParceiro(parceiroId: string) {
  const com = getComissao(parceiroId)
  if (!com) return { energia: 0, telecom: 0, total: 0, detalhes: [] as any[] }
  const vds = getVendasByUser(parceiroId).filter(v => v.status !== 'cancelado' && v.status !== 'rejeitado')
  const detalhes: { venda_id: string; client_name: string; service_type: string; operator: string; amount: number; comissao: number; status: string }[] = []
  let energia = 0, telecom = 0
  for (const v of vds) {
    if (v.service_type === 'energia') {
      const c = (v.amount * com.energia_percent / 100) + com.energia_fixo
      energia += c
      detalhes.push({ venda_id: v.id, client_name: v.client_name, service_type: v.service_type, operator: v.operator, amount: v.amount, comissao: c, status: v.status })
    } else {
      const c = (v.amount * com.telecom_percent / 100) + com.telecom_fixo
      telecom += c
      detalhes.push({ venda_id: v.id, client_name: v.client_name, service_type: v.service_type, operator: v.operator, amount: v.amount, comissao: c, status: v.status })
    }
  }
  return { energia, telecom, total: energia + telecom, detalhes }
}

// ---- NOTIFICACOES ----
export function getNotificacoesByUser(userId: string) { return notificacoes.filter(n => n.user_id === userId) }
export function createNotificacao(data: Omit<Notificacao, 'id' | 'created_at' | 'is_read'>) {
  const n: Notificacao = { ...data, id: uid(), is_read: false, created_at: new Date().toISOString() }
  notificacoes.push(n)
  return n
}
export function markNotificacaoRead(id: string) {
  const n = notificacoes.find(x => x.id === id)
  if (n) n.is_read = true
  return n
}

// ---- CONTRATOS ----
export function createContrato(data: Omit<Contrato, 'id' | 'created_at' | 'updated_at'>) {
  const c: Contrato = { ...data, id: uid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  contratos.push(c)
  return c
}
export function getContratoById(id: string) { return contratos.find(c => c.id === id) }
export function getContratosByUser(userId: string) { return contratos.filter(c => c.user_id === userId) }
export function getAllContratos() { return contratos }
export function updateContrato(id: string, updates: Partial<Contrato>) {
  const c = contratos.find(x => x.id === id)
  if (c) {
    Object.assign(c, updates, { updated_at: new Date().toISOString() })
  }
  return c
}

// ---- CONTRATO ASSINATURAS ----
export function addAssinatura(data: Omit<ContratoAssinatura, 'id' | 'created_at'>) {
  const a: ContratoAssinatura = { ...data, id: uid(), created_at: new Date().toISOString() }
  contrato_assinaturas.push(a)
  return a
}
export function getAssinaturasContrato(contratoId: string) { return contrato_assinaturas.filter(a => a.contrato_id === contratoId) }


// ---- BULK UPDATE VENDAS (import Excel) ----
export function bulkUpdateVendas(rows: { client_email: string; status: Venda['status']; notes?: string }[]) {
  let updated = 0
  for (const row of rows) {
    const matching = vendas.filter(v => v.client_email.toLowerCase() === row.client_email.toLowerCase())
    for (const v of matching) {
      v.status = row.status
      if (row.notes) v.notes = row.notes
      v.updated_at = new Date().toISOString()
      updated++
    }
  }
  return updated
}

// ---- METRICAS ----
export function getMetrics(userId?: string) {
  const v = userId ? getVendasByUser(userId) : vendas
  const totalVendido = v.reduce((s, x) => s + x.amount, 0)
  const totalAReceber = v.filter(x => x.status !== 'pago' && x.status !== 'cancelado' && x.status !== 'rejeitado').reduce((s, x) => s + x.amount, 0)
  const clientesAtivos = new Set(v.filter(x => x.status !== 'cancelado' && x.status !== 'rejeitado').map(x => x.client_email)).size
  return { totalVendido, totalAReceber, clientesAtivos, totalVendas: v.length }
}
