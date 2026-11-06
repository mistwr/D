// Reconciliação de backoffice: cruza as vendas do CRM com os ficheiros das
// operadoras e com a planilha interna, e devolve um estado final por contrato
// (ativo / pendente / anulado), agrupável por operadora e por parceiro.
// Sem dependências: corre no browser e nos testes (node --test).

export type Estado = 'ativo' | 'pendente' | 'anulado'
export type FonteTipo = 'operadora' | 'interna'

export const ESTADO_LABEL: Record<Estado, string> = {
  ativo: 'Ativo',
  pendente: 'Pendente de ativação',
  anulado: 'Anulado',
}

export const CAMPOS = ['nif', 'cpe', 'cui', 'telefone', 'contrato', 'email', 'nome', 'estado', 'operadora', 'data', 'parceiro'] as const
export type Campo = (typeof CAMPOS)[number]
export type Mapeamento = Partial<Record<Campo, string>>

export const CAMPO_LABEL: Record<Campo, string> = {
  nif: 'NIF', cpe: 'CPE', cui: 'CUI', telefone: 'Telefone', contrato: 'Nº contrato / pedido',
  email: 'Email', nome: 'Nome cliente', estado: 'Estado', operadora: 'Operadora', data: 'Data', parceiro: 'Parceiro / vendedor',
}

export const OPERADORAS_CONHECIDAS = [
  'MEO', 'NOS', 'Vodafone', 'DIGI', 'NOWO', 'EDP', 'Endesa', 'Iberdrola', 'Galp', 'Gold Energy',
  'Luzboa', 'Yes Energy', 'Repsol', 'Plenitude', 'Coopernico', 'Muon', 'SU Eletricidade',
]

// ---------------------------------------------------------------- normalização

export function norm(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function digits(value: unknown): string {
  return String(value ?? '').replace(/\D+/g, '')
}

export function normNif(value: unknown): string {
  const d = digits(String(value ?? '').replace(/^\s*PT/i, ''))
  return d.length >= 9 ? d.slice(-9) : ''
}

export function normTelefone(value: unknown): string {
  let d = digits(value)
  if (d.startsWith('00351')) d = d.slice(5)
  else if (d.startsWith('351') && d.length > 9) d = d.slice(3)
  return d.length === 9 && /^[29]/.test(d) ? d : ''
}

// CPE/CUI: PT + 16 dígitos + 2 letras de controlo. Comparamos os 18 primeiros
// caracteres porque muitos ficheiros omitem as letras finais.
export function normPonto(value: unknown): string {
  const s = String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return s.length >= 18 ? s.slice(0, 18) : ''
}

export function normEmail(value: unknown): string {
  const s = String(value ?? '').trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : ''
}

export function normContrato(value: unknown): string {
  const s = String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return s.length >= 4 ? s : ''
}

export function normOperadora(value: unknown): string {
  const n = norm(value)
  if (!n) return ''
  const regras: [RegExp, string][] = [
    [/\bmeo\b|altice/, 'MEO'],
    [/\bnos\b/, 'NOS'],
    [/vodafone/, 'Vodafone'],
    [/\bdigi\b/, 'DIGI'],
    [/nowo/, 'NOWO'],
    [/\bedp\b/, 'EDP'],
    [/endesa/, 'Endesa'],
    [/iberdrola/, 'Iberdrola'],
    [/gold ?energy/, 'Gold Energy'],
    [/\bgalp\b/, 'Galp'],
    [/luzboa/, 'Luzboa'],
    [/yes ?energy/, 'Yes Energy'],
    [/repsol/, 'Repsol'],
    [/plenitude|\beni\b/, 'Plenitude'],
    [/coopernico/, 'Coopernico'],
    [/\bmuon\b/, 'Muon'],
    [/\bsu eletricidade\b/, 'SU Eletricidade'],
  ]
  for (const [re, nome] of regras) if (re.test(n)) return nome
  const original = String(value ?? '').trim()
  return original.length <= 30 ? original : ''
}

/** Converte um estado escrito por uma operadora ou pelo backoffice num dos 3 grupos. */
export function normEstado(value: unknown): Estado | null {
  const n = norm(value)
    .replace(/activ/g, 'ativ')
    .replace(/actua/g, 'atua')
  if (!n) return null

  const anulado = /anul|cancel|rescind|desist|rejeit|recusad|devolvid|chargeback|inativ|\bnao ativ|cessad|terminad|revogad|sem efeito|\bchurn\b|desligad|\bko\b|falhad|invalid|\bperdid/
  if (anulado.test(n)) return 'anulado'

  // "Ativação concluída", "Instalado", "Pago": ativo mesmo contendo palavras de processo.
  const ativoForte = /conclu|complet|ativad[oa]|instalad[oa]|em servico|em vigor|faturad|\bpag[oa]\b|comissionad|em fornecimento|fornecimento iniciado/
  if (ativoForte.test(n) && !/\bpend|aguard|\bpor (ativar|instalar)|\bnao\b/.test(n)) return 'ativo'

  const pendente = /pend|em curso|agend|aguard|process|analise|revisao|por instalar|por ativar|ativacao|a ativar|submetid|registad|\bnov[oa]\b|abert|tramit|valid(acao|ar)\b|instalacao|espera|\bpre ?ativ|\bsms\b|chamada|nao atende|portabilidade/
  if (pendente.test(n)) return 'pendente'

  const ativo = /\bativ[oae]?s?\b|ligad|\bok\b|validad|\bdone\b/
  if (ativo.test(n)) return 'ativo'

  return null
}

/** Estado interno do CRM (vendas.status) → grupo. */
export function estadoCrm(status: string | null | undefined): Estado {
  const s = String(status ?? '').toLowerCase()
  if (s === 'ativa' || s === 'pago') return 'ativo'
  if (s === 'cancelado' || s === 'rejeitado' || s === 'chargeback') return 'anulado'
  return 'pendente'
}

/** Que status deve ter a venda no CRM para refletir o estado da operadora. */
export function statusCrmPara(estado: Estado): string {
  if (estado === 'ativo') return 'ativa'
  if (estado === 'anulado') return 'cancelado'
  return 'em_ativacao'
}

// ---------------------------------------------------------------- colunas

const SINONIMOS: Record<Campo, RegExp> = {
  nif: /\bnif\b|\bnipc\b|contribuinte|numero fiscal|\bvat\b|\bn i f\b/,
  cpe: /\bcpe\b|ponto de entrega|codigo ponto/,
  cui: /\bcui\b/,
  telefone: /telef|telem|\btlm\b|\btlf\b|msisdn|contacto|\bmovel\b|phone|\bnumero cliente\b|\bn telefone\b/,
  contrato: /contrato|pedido|encomenda|\border\b|\bref\b|referencia|\bid venda\b|\bsubscricao\b|\bconta cliente\b/,
  email: /e ?mail|correio/,
  nome: /\bnome\b|\bcliente\b|titular|\bname\b|razao social|denominacao/,
  estado: /estado|status|situacao|\bfase\b|\bstate\b/,
  operadora: /operador|comercializador|\bmarca\b|fornecedor|operator|\bmarca\b/,
  data: /\bdata\b|\bdate\b|\bdt\b/,
  parceiro: /parceiro|vendedor|comercial|\bagente\b|consultor|\bpromotor\b|\bpartner\b|\bdealer\b|\bloja\b/,
}

// Ordem de preferência quando um cabeçalho combina com vários campos.
const PRIORIDADE: Campo[] = ['email', 'nif', 'cpe', 'cui', 'telefone', 'estado', 'operadora', 'parceiro', 'data', 'contrato', 'nome']

export function detetarMapeamento(headers: string[]): Mapeamento {
  const out: Mapeamento = {}
  const usados = new Set<string>()
  for (const campo of PRIORIDADE) {
    // Primeiro um cabeçalho que seja exatamente o campo, depois um que o contenha.
    const candidatos = headers.filter((h) => h && !usados.has(h) && SINONIMOS[campo].test(norm(h)))
    if (!candidatos.length) continue
    // "Data estado" / "Estado cliente": preferir o cabeçalho mais curto
    candidatos.sort((a, b) => norm(a).length - norm(b).length)
    let escolhido = candidatos[0]
    if (campo === 'estado') escolhido = candidatos.find((h) => !/data|\bdt\b/.test(norm(h))) ?? escolhido
    if (campo === 'nome') escolhido = candidatos.find((h) => /nome|titular/.test(norm(h))) ?? escolhido
    if (campo === 'data') escolhido = candidatos.find((h) => /ativ|venda|registo|adesao|criacao/.test(norm(h))) ?? escolhido
    out[campo] = escolhido
    usados.add(escolhido)
  }
  return out
}

/** Encontra a linha de cabeçalho (ficheiros de operadora trazem muitas vezes títulos por cima). */
export function encontrarCabecalho(linhas: unknown[][], maxProcura = 20): number {
  let melhor = 0
  let melhorScore = -1
  for (let i = 0; i < Math.min(linhas.length, maxProcura); i++) {
    const headers = (linhas[i] ?? []).map((c) => String(c ?? ''))
    const score = Object.keys(detetarMapeamento(headers)).length
    if (score > melhorScore) { melhor = i; melhorScore = score }
  }
  return melhor
}

// ---------------------------------------------------------------- tipos de entrada

export interface FicheiroFonte {
  id: string
  nome: string
  tipo: FonteTipo
  /** Operadora escolhida para o ficheiro inteiro (quando não há coluna de operadora). */
  operadora?: string
  /** Estado a usar quando a linha não tem coluna de estado (ex.: aba "Anulados"). */
  estadoPadrao?: string
  headers: string[]
  linhas: Record<string, unknown>[]
  mapeamento: Mapeamento
}

export interface VendaCrm {
  id: string
  client_name?: string | null
  client_email?: string | null
  client_nif?: string | null
  client_phone?: string | null
  cpe?: string | null
  cui?: string | null
  cpes?: string[] | null
  cuis?: string[] | null
  telco_numeros?: { numero?: string | null }[] | null
  telco_fixo?: string | null
  operator?: string | null
  service_type?: string | null
  plano?: string | null
  status?: string | null
  amount?: number | null
  parceiro_name?: string | null
  created_at?: string | null
}

export interface LinhaFonte {
  ficheiro: string
  tipo: FonteTipo
  operadora: string
  nome: string
  nif: string
  cpe: string
  cui: string
  telefones: string[]
  contrato: string
  email: string
  estadoTexto: string
  estado: Estado | null
  data: string
  parceiro: string
}

export type Divergencia =
  | 'estado_diferente'
  | 'interna_diferente'
  | 'nao_esta_no_crm'
  | 'falta_no_reporte'
  | 'estado_desconhecido'

export const DIVERGENCIA_LABEL: Record<Divergencia, string> = {
  estado_diferente: 'CRM diferente da operadora',
  interna_diferente: 'Planilha interna diferente da operadora',
  nao_esta_no_crm: 'Está na operadora mas não no CRM',
  falta_no_reporte: 'No CRM mas não aparece no reporte da operadora',
  estado_desconhecido: 'Estado da operadora não reconhecido',
}

export interface LinhaReconciliada {
  chave: string
  vendaId: string | null
  operadora: string
  servico: string
  cliente: string
  nif: string
  identificador: string
  parceiro: string
  estadoFinal: Estado
  origemEstado: 'operadora' | 'interna' | 'crm'
  estadoOperadora: Estado | null
  estadoOperadoraTexto: string
  estadoInterna: Estado | null
  estadoInternaTexto: string
  statusCrm: string | null
  estadoCrm: Estado | null
  divergencias: Divergencia[]
  /** Status a aplicar na venda do CRM, se for diferente do atual. */
  sugestaoStatus: string | null
  data: string
  fontes: string[]
}

export interface ResultadoReconciliacao {
  linhas: LinhaReconciliada[]
  operadorasComReporte: string[]
  resumo: { operadora: string; ativo: number; pendente: number; anulado: number; divergencias: number; total: number }[]
  totais: { ativo: number; pendente: number; anulado: number; divergencias: number; total: number }
}

// ---------------------------------------------------------------- leitura das linhas

function valor(linha: Record<string, unknown>, coluna?: string): string {
  if (!coluna) return ''
  const v = linha[coluna]
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v ?? '').trim()
}

function operadoraDoNomeFicheiro(nome: string): string {
  const n = norm(nome.replace(/\.[a-z0-9]+$/i, ''))
  for (const op of OPERADORAS_CONHECIDAS) {
    if (new RegExp(`\\b${norm(op)}\\b`).test(n)) return op
  }
  if (/altice/.test(n)) return 'MEO'
  return ''
}

export function lerLinhas(f: FicheiroFonte): LinhaFonte[] {
  const m = f.mapeamento
  const opFicheiro = normOperadora(f.operadora) || (m.operadora ? '' : operadoraDoNomeFicheiro(f.nome))
  const out: LinhaFonte[] = []
  for (const l of f.linhas) {
    const telefones = String(valor(l, m.telefone))
      .split(/[;,/|]+/)
      .map(normTelefone)
      .filter(Boolean)
    const linha: LinhaFonte = {
      ficheiro: f.nome,
      tipo: f.tipo,
      operadora: normOperadora(valor(l, m.operadora)) || opFicheiro,
      nome: valor(l, m.nome),
      nif: normNif(valor(l, m.nif)),
      cpe: normPonto(valor(l, m.cpe)),
      cui: normPonto(valor(l, m.cui)),
      telefones,
      contrato: normContrato(valor(l, m.contrato)),
      email: normEmail(valor(l, m.email)),
      estadoTexto: valor(l, m.estado) || f.estadoPadrao || '',
      estado: normEstado(valor(l, m.estado) || f.estadoPadrao),
      data: valor(l, m.data),
      parceiro: valor(l, m.parceiro),
    }
    // Ignora linhas vazias / totais.
    if (!linha.nif && !linha.cpe && !linha.cui && !telefones.length && !linha.contrato && !linha.email) continue
    out.push(linha)
  }
  return out
}

// ---------------------------------------------------------------- cruzamento

interface Entidade {
  idx: number
  venda: VendaCrm | null
  operadora: string
  chaves: Set<string>
  operadoraLinhas: LinhaFonte[]
  internaLinhas: LinhaFonte[]
}

function chavesVenda(v: VendaCrm): string[] {
  const k: string[] = []
  const cpes = [v.cpe, ...(v.cpes ?? [])].map(normPonto).filter(Boolean)
  const cuis = [v.cui, ...(v.cuis ?? [])].map(normPonto).filter(Boolean)
  cpes.forEach((c) => k.push(`ponto:${c}`))
  cuis.forEach((c) => k.push(`ponto:${c}`))
  const tels = [v.client_phone, v.telco_fixo, ...(v.telco_numeros ?? []).map((t) => t?.numero)].map(normTelefone).filter(Boolean)
  tels.forEach((t) => k.push(`tel:${t}`))
  const nif = normNif(v.client_nif)
  if (nif) k.push(`nif:${nif}`)
  const email = normEmail(v.client_email)
  if (email) k.push(`email:${email}`)
  return k
}

/** Chaves fortes identificam um contrato; NIF/email só identificam o cliente. */
function chavesLinha(l: LinhaFonte): { fortes: string[]; fracas: string[] } {
  const fortes: string[] = []
  if (l.cpe) fortes.push(`ponto:${l.cpe}`)
  if (l.cui) fortes.push(`ponto:${l.cui}`)
  if (l.contrato) fortes.push(`contrato:${l.contrato}`)
  l.telefones.forEach((t) => fortes.push(`tel:${t}`))
  const fracas: string[] = []
  if (l.nif) fracas.push(`nif:${l.nif}`)
  if (l.email) fracas.push(`email:${l.email}`)
  return { fortes, fracas }
}

function compativel(e: Entidade, operadora: string): boolean {
  return !e.operadora || !operadora || e.operadora === operadora
}

/** Junta várias linhas do mesmo contrato num só estado: ativo > pendente > anulado. */
function estadoAgregado(linhas: LinhaFonte[]): { estado: Estado | null; texto: string } {
  const comEstado = linhas.filter((l) => l.estado)
  const pick = comEstado.find((l) => l.estado === 'ativo') ?? comEstado.find((l) => l.estado === 'pendente') ?? comEstado[0]
  const texto = [...new Set(linhas.map((l) => l.estadoTexto).filter(Boolean))].join(' / ')
  return { estado: pick?.estado ?? null, texto }
}

export function reconciliar(vendas: VendaCrm[], ficheiros: FicheiroFonte[]): ResultadoReconciliacao {
  const entidades: Entidade[] = []
  const indice = new Map<string, number[]>()

  const indexar = (e: Entidade, chave: string) => {
    if (e.chaves.has(chave)) return
    e.chaves.add(chave)
    const lista = indice.get(chave)
    if (lista) lista.push(e.idx)
    else indice.set(chave, [e.idx])
  }

  for (const v of vendas) {
    const e: Entidade = { idx: entidades.length, venda: v, operadora: normOperadora(v.operator), chaves: new Set(), operadoraLinhas: [], internaLinhas: [] }
    entidades.push(e)
    chavesVenda(v).forEach((k) => indexar(e, k))
  }

  const procurar = (l: LinhaFonte): Entidade | null => {
    const { fortes, fracas } = chavesLinha(l)
    for (const k of fortes) {
      const hit = (indice.get(k) ?? []).map((i) => entidades[i]).find((e) => compativel(e, l.operadora))
      if (hit) return hit
    }
    // Por NIF/email: só se houver uma única correspondência compatível ainda sem
    // linha da mesma fonte (evita colar 2 contratos do mesmo cliente num só).
    for (const k of fracas) {
      const candidatos = (indice.get(k) ?? []).map((i) => entidades[i]).filter((e) => compativel(e, l.operadora))
      if (!candidatos.length) continue
      const livres = candidatos.filter((e) => (l.tipo === 'operadora' ? e.operadoraLinhas : e.internaLinhas).length === 0)
      const comOperadoraIgual = livres.filter((e) => e.operadora && e.operadora === l.operadora)
      const escolha = comOperadoraIgual[0] ?? (livres.length === 1 ? livres[0] : null) ?? (candidatos.length === 1 ? candidatos[0] : null)
      if (escolha) return escolha
    }
    return null
  }

  const todasLinhas = ficheiros.flatMap(lerLinhas)
  // Primeiro as operadoras (são a referência), depois a planilha interna.
  const ordenadas = [...todasLinhas.filter((l) => l.tipo === 'operadora'), ...todasLinhas.filter((l) => l.tipo === 'interna')]

  for (const l of ordenadas) {
    let e = procurar(l)
    if (!e) {
      e = { idx: entidades.length, venda: null, operadora: l.operadora, chaves: new Set(), operadoraLinhas: [], internaLinhas: [] }
      entidades.push(e)
    }
    if (!e.operadora && l.operadora) e.operadora = l.operadora
    ;(l.tipo === 'operadora' ? e.operadoraLinhas : e.internaLinhas).push(l)
    const { fortes, fracas } = chavesLinha(l)
    ;[...fortes, ...fracas].forEach((k) => indexar(e!, k))
  }

  const operadorasComReporte = [...new Set(todasLinhas.filter((l) => l.tipo === 'operadora').map((l) => l.operadora).filter(Boolean))].sort()
  const cobertas = new Set(operadorasComReporte)
  // Ficheiro de operadora sem operadora identificada: assume que cobre tudo o que nele aparece.

  const linhas: LinhaReconciliada[] = entidades.map((e) => {
    const v = e.venda
    const op = estadoAgregado(e.operadoraLinhas)
    const int = estadoAgregado(e.internaLinhas)
    const crm = v ? estadoCrm(v.status) : null

    let estadoFinal: Estado
    let origem: LinhaReconciliada['origemEstado']
    if (op.estado) { estadoFinal = op.estado; origem = 'operadora' }
    else if (int.estado) { estadoFinal = int.estado; origem = 'interna' }
    else { estadoFinal = crm ?? 'pendente'; origem = 'crm' }

    const div: Divergencia[] = []
    if (e.operadoraLinhas.length && !op.estado) div.push('estado_desconhecido')
    if (op.estado && crm && op.estado !== crm) div.push('estado_diferente')
    if (op.estado && int.estado && op.estado !== int.estado) div.push('interna_diferente')
    if (!v && e.operadoraLinhas.length) div.push('nao_esta_no_crm')
    if (v && !e.operadoraLinhas.length && cobertas.has(e.operadora) && crm !== 'anulado') div.push('falta_no_reporte')

    const fonteRef = e.operadoraLinhas[0] ?? e.internaLinhas[0]
    const tels = fonteRef?.telefones ?? []
    const identificador =
      (v?.cpe ?? '').trim() || (v?.cui ?? '').trim() || fonteRef?.cpe || fonteRef?.cui ||
      normTelefone(v?.client_phone) || tels[0] || fonteRef?.contrato || ''

    const sugestao = v && origem !== 'crm' && crm !== estadoFinal ? statusCrmPara(estadoFinal) : null

    const todas = [...e.operadoraLinhas, ...e.internaLinhas]
    return {
      chave: v ? `venda:${v.id}` : `linha:${e.idx}`,
      vendaId: v?.id ?? null,
      operadora: e.operadora || 'Sem operadora',
      servico: v?.service_type ?? '',
      cliente: v?.client_name || todas.find((l) => l.nome)?.nome || '',
      nif: normNif(v?.client_nif) || todas.find((l) => l.nif)?.nif || '',
      identificador,
      parceiro: v?.parceiro_name || todas.find((l) => l.parceiro)?.parceiro || 'Sem parceiro',
      estadoFinal,
      origemEstado: origem,
      estadoOperadora: op.estado,
      estadoOperadoraTexto: op.texto,
      estadoInterna: int.estado,
      estadoInternaTexto: int.texto,
      statusCrm: v?.status ?? null,
      estadoCrm: crm,
      divergencias: div,
      sugestaoStatus: sugestao,
      data: (v?.created_at ?? '').slice(0, 10) || todas.find((l) => l.data)?.data || '',
      fontes: [...(v ? ['CRM'] : []), ...new Set(todas.map((l) => l.ficheiro))],
    }
  })

  const porOp = new Map<string, { operadora: string; ativo: number; pendente: number; anulado: number; divergencias: number; total: number }>()
  const totais = { ativo: 0, pendente: 0, anulado: 0, divergencias: 0, total: 0 }
  for (const l of linhas) {
    const r = porOp.get(l.operadora) ?? { operadora: l.operadora, ativo: 0, pendente: 0, anulado: 0, divergencias: 0, total: 0 }
    r[l.estadoFinal]++; r.total++
    totais[l.estadoFinal]++; totais.total++
    if (l.divergencias.length) { r.divergencias++; totais.divergencias++ }
    porOp.set(l.operadora, r)
  }
  const resumo = [...porOp.values()].sort((a, b) => b.total - a.total)

  return { linhas, operadorasComReporte, resumo, totais }
}

/** Nome válido para uma aba de Excel (máx. 31 caracteres, sem []:*?/\). */
export function nomeAba(nome: string, usados: Set<string>): string {
  const base = (nome || 'Sem nome').replace(/[\[\]:*?/\\]/g, ' ').slice(0, 31).trim() || 'Aba'
  let n = base
  let i = 2
  while (usados.has(n.toLowerCase())) n = `${base.slice(0, 28)} ${i++}`
  usados.add(n.toLowerCase())
  return n
}
