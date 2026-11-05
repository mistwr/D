import * as XLSX from 'xlsx'
import {
  CAMPO_LABEL, DIVERGENCIA_LABEL, ESTADO_LABEL, detetarMapeamento, encontrarCabecalho, nomeAba, norm,
  type Estado, type FicheiroFonte, type FonteTipo, type LinhaReconciliada, type ResultadoReconciliacao,
} from './reconcile'

export type TipoFolha = FonteTipo | 'ignorar'
export interface FolhaCarregada extends Omit<FicheiroFonte, 'tipo'> {
  tipo: TipoFolha
  ficheiro: string
  folha: string
  totalLinhas: number
}

function tipoPorNome(nome: string): TipoFolha {
  const n = norm(nome)
  if (/\binterna\b|\bminha\b|\bcontrolo\b|\bbackoffice\b|\bmapa\b|\bcrm\b|solucoes/.test(n)) return 'interna'
  return 'operadora'
}

/** Lê um ficheiro Excel/CSV: cada aba com dados vira uma fonte. */
export async function lerFicheiro(file: File): Promise<FolhaCarregada[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const out: FolhaCarregada[] = []
  for (const folha of wb.SheetNames) {
    const ws = wb.Sheets[folha]
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: false, dateNF: 'yyyy-mm-dd' })
    if (!matriz.length) continue
    const h = encontrarCabecalho(matriz)
    const brutos = (matriz[h] ?? []).map((c, i) => String(c ?? '').trim() || `Coluna ${i + 1}`)
    // Cabeçalhos repetidos ganham sufixo para não se sobreporem.
    const vistos = new Map<string, number>()
    const headers = brutos.map((c) => {
      const n = vistos.get(c) ?? 0
      vistos.set(c, n + 1)
      return n ? `${c} (${n + 1})` : c
    })
    const linhas = matriz.slice(h + 1)
      .filter((r) => r.some((c) => String(c ?? '').trim() !== ''))
      .map((r) => Object.fromEntries(headers.map((col, i) => [col, r[i] ?? ''])))
    if (!linhas.length) continue
    const mapeamento = detetarMapeamento(headers)
    const temChave = Boolean(mapeamento.nif || mapeamento.cpe || mapeamento.cui || mapeamento.telefone || mapeamento.contrato || mapeamento.email)
    const variasAbas = wb.SheetNames.length > 1
    out.push({
      id: `${file.name}::${folha}::${Date.now()}::${Math.random().toString(36).slice(2, 7)}`,
      nome: variasAbas ? `${file.name} › ${folha}` : file.name,
      ficheiro: file.name,
      folha,
      tipo: temChave ? tipoPorNome(file.name) : 'ignorar',
      operadora: '',
      // Abas chamadas "Ativos", "Pendentes", "Anulados"... servem de estado.
      estadoPadrao: variasAbas ? folha : '',
      headers,
      linhas,
      mapeamento,
      totalLinhas: linhas.length,
    })
  }
  return out
}

const ORDEM: Record<Estado, number> = { ativo: 0, pendente: 1, anulado: 2 }

function linhaExcel(l: LinhaReconciliada) {
  return {
    Operadora: l.operadora,
    Estado: ESTADO_LABEL[l.estadoFinal],
    Cliente: l.cliente,
    NIF: l.nif,
    'CPE / CUI / Telefone': l.identificador,
    Parceiro: l.parceiro,
    Serviço: l.servico,
    Data: l.data,
    'Estado na operadora': l.estadoOperadoraTexto,
    'Estado planilha interna': l.estadoInternaTexto,
    'Estado no CRM': l.statusCrm ?? 'Não existe no CRM',
    'Estado decidido por': l.origemEstado === 'operadora' ? 'Operadora' : l.origemEstado === 'interna' ? 'Planilha interna' : 'CRM',
    Divergências: l.divergencias.map((d) => DIVERGENCIA_LABEL[d]).join('; '),
    'Atualizar CRM para': l.sugestaoStatus ?? '',
    'ID venda': l.vendaId ?? '',
    Fontes: l.fontes.join(', '),
  }
}

function folha(linhas: LinhaReconciliada[]) {
  const rows = [...linhas]
    .sort((a, b) => ORDEM[a.estadoFinal] - ORDEM[b.estadoFinal] || a.parceiro.localeCompare(b.parceiro) || a.cliente.localeCompare(b.cliente))
    .map(linhaExcel)
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: 'Sem linhas' }])
  ws['!cols'] = [12, 22, 28, 12, 24, 20, 10, 12, 22, 22, 16, 18, 40, 16, 38, 30].map((w) => ({ wch: w }))
  ws['!autofilter'] = { ref: ws['!ref'] ?? 'A1' }
  return ws
}

export function exportarExcel(r: ResultadoReconciliacao, nomeFicheiro: string) {
  const wb = XLSX.utils.book_new()
  const usados = new Set<string>()

  const resumo = [
    ...r.resumo.map((x) => ({ Operadora: x.operadora, Ativos: x.ativo, 'Pendentes de ativação': x.pendente, Anulados: x.anulado, Divergências: x.divergencias, Total: x.total, 'Com reporte': r.operadorasComReporte.includes(x.operadora) ? 'Sim' : 'Não' })),
    { Operadora: 'TOTAL', Ativos: r.totais.ativo, 'Pendentes de ativação': r.totais.pendente, Anulados: r.totais.anulado, Divergências: r.totais.divergencias, Total: r.totais.total, 'Com reporte': '' },
  ]
  const wsResumo = XLSX.utils.json_to_sheet(resumo)
  wsResumo['!cols'] = [18, 10, 20, 10, 13, 8, 12].map((w) => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, wsResumo, nomeAba('Resumo', usados))

  const parceiros = new Map<string, { Parceiro: string; Operadora: string; Ativos: number; 'Pendentes de ativação': number; Anulados: number; Total: number }>()
  for (const l of r.linhas) {
    const k = `${l.parceiro}||${l.operadora}`
    const p = parceiros.get(k) ?? { Parceiro: l.parceiro, Operadora: l.operadora, Ativos: 0, 'Pendentes de ativação': 0, Anulados: 0, Total: 0 }
    if (l.estadoFinal === 'ativo') p.Ativos++
    else if (l.estadoFinal === 'pendente') p['Pendentes de ativação']++
    else p.Anulados++
    p.Total++
    parceiros.set(k, p)
  }
  const wsParc = XLSX.utils.json_to_sheet([...parceiros.values()].sort((a, b) => a.Parceiro.localeCompare(b.Parceiro) || b.Total - a.Total))
  wsParc['!cols'] = [24, 16, 10, 20, 10, 8].map((w) => ({ wch: w }))
  XLSX.utils.book_append_sheet(wb, wsParc, nomeAba('Por parceiro', usados))

  for (const op of r.resumo.map((x) => x.operadora)) {
    XLSX.utils.book_append_sheet(wb, folha(r.linhas.filter((l) => l.operadora === op)), nomeAba(op, usados))
  }
  XLSX.utils.book_append_sheet(wb, folha(r.linhas.filter((l) => l.divergencias.length)), nomeAba('Divergências', usados))
  XLSX.utils.book_append_sheet(wb, folha(r.linhas.filter((l) => l.vendaId)), nomeAba('CRM Soluções Diferentes', usados))
  XLSX.utils.book_append_sheet(wb, folha(r.linhas), nomeAba('Todas', usados))

  XLSX.writeFile(wb, nomeFicheiro)
}

export { CAMPO_LABEL }
