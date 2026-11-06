import {test} from 'node:test'
import assert from 'node:assert/strict'
import {normEstado,normOperadora,normTelefone,normNif,detetarMapeamento,encontrarCabecalho,reconciliar,nomeAba} from '../lib/backoffice/reconcile.ts'
import type {FicheiroFonte,VendaCrm} from '../lib/backoffice/reconcile.ts'

test('estados das operadoras caem nos 3 grupos', () => {
  const casos: [string, string | null][] = [
    ['Ativo', 'ativo'], ['ACTIVO', 'ativo'], ['Instalado', 'ativo'], ['Ativação concluída', 'ativo'], ['Pago', 'ativo'], ['OK', 'ativo'],
    ['Pendente de ativação', 'pendente'], ['Em ativação', 'pendente'], ['Aguarda instalação', 'pendente'], ['Instalação marcada', 'pendente'],
    ['Por instalar', 'pendente'], ['Em análise', 'pendente'], ['Pendente Ativacao SMS', 'pendente'],
    ['Anulado', 'anulado'], ['Cancelado pelo cliente', 'anulado'], ['Inativo', 'anulado'], ['Não ativo', 'anulado'], ['Rejeitada', 'anulado'], ['Desistência', 'anulado'],
    ['', null], ['xpto', null],
  ]
  for (const [txt, esperado] of casos) assert.equal(normEstado(txt), esperado, txt)
})

test('normalizações', () => {
  assert.equal(normOperadora('ALTICE MEO'), 'MEO')
  assert.equal(normOperadora('nos comunicações'), 'NOS')
  assert.equal(normOperadora('Endesa Energia'), 'Endesa')
  assert.equal(normTelefone('+351 912 345 678'), '912345678')
  assert.equal(normTelefone('00351223456789'), '223456789')
  assert.equal(normTelefone('12345'), '')
  assert.equal(normNif('PT 501 234 567'), '501234567')
})

test('deteta colunas e linha de cabeçalho', () => {
  const m = detetarMapeamento(['Nº Pedido', 'Nome Cliente', 'NIF Cliente', 'Telemóvel', 'Data Estado', 'Estado', 'Vendedor'])
  assert.equal(m.contrato, 'Nº Pedido')
  assert.equal(m.nome, 'Nome Cliente')
  assert.equal(m.nif, 'NIF Cliente')
  assert.equal(m.telefone, 'Telemóvel')
  assert.equal(m.estado, 'Estado')
  assert.equal(m.parceiro, 'Vendedor')
  assert.equal(encontrarCabecalho([['Reporte DIGI Outubro'], [], ['NIF', 'Estado', 'Telefone']]), 2)
})

const vendas: VendaCrm[] = [
  {id: 'v1', client_name: 'Ana', client_nif: '111111111', client_phone: '912000001', operator: 'DIGI', status: 'pendente', parceiro_name: 'Tomás'},
  {id: 'v2', client_name: 'Bruno', client_nif: '222222222', client_phone: '912000002', operator: 'DIGI', status: 'ativa', parceiro_name: 'Carla'},
  {id: 'v3', client_name: 'Rui', client_nif: '333333333', operator: 'Endesa', cpe: 'PT0002000012345678AB', status: 'em_ativacao', parceiro_name: 'Tomás'},
  {id: 'v4', client_name: 'Rui', client_nif: '333333333', operator: 'MEO', client_phone: '913000003', status: 'pendente', parceiro_name: 'Tomás'},
  {id: 'v5', client_name: 'Zé', client_nif: '555555555', operator: 'DIGI', status: 'pendente', parceiro_name: 'Afonso'},
]

const digi: FicheiroFonte = {
  id: 'f1', nome: 'reporte_digi_outubro.xlsx', tipo: 'operadora', headers: ['NIF', 'Telefone', 'Estado'],
  mapeamento: {nif: 'NIF', telefone: 'Telefone', estado: 'Estado'},
  linhas: [
    {NIF: '111111111', Telefone: '912 000 001', Estado: 'Ativo'},
    {NIF: '222222222', Telefone: '912000002', Estado: 'Cancelado'},
    {NIF: '999999999', Telefone: '919999999', Estado: 'Pendente instalação'},
    {NIF: '', Telefone: '', Estado: 'TOTAL'},
  ],
}

const endesa: FicheiroFonte = {
  id: 'f2', nome: 'endesa.xlsx', tipo: 'operadora', operadora: 'Endesa', headers: ['CPE', 'Situação'],
  mapeamento: {cpe: 'CPE', estado: 'Situação'},
  linhas: [{CPE: 'PT 0002 0000 1234 5678', 'Situação': 'Em fornecimento'}],
}

const interna: FicheiroFonte = {
  id: 'f3', nome: 'minha.xlsx', tipo: 'interna', headers: ['NIF', 'Operadora', 'Estado'],
  mapeamento: {nif: 'NIF', operadora: 'Operadora', estado: 'Estado'},
  linhas: [{NIF: '111111111', Operadora: 'DIGI', Estado: 'Pendente'}],
}

test('reconcilia CRM, operadoras e planilha interna', () => {
  const r = reconciliar(vendas, [digi, endesa, interna])
  const por = (id: string) => r.linhas.find((l) => l.vendaId === id)!

  assert.equal(por('v1').estadoFinal, 'ativo')
  assert.equal(por('v1').sugestaoStatus, 'ativa')
  assert.ok(por('v1').divergencias.includes('estado_diferente'))
  assert.ok(por('v1').divergencias.includes('interna_diferente'))

  assert.equal(por('v2').estadoFinal, 'anulado')
  assert.equal(por('v2').sugestaoStatus, 'cancelado')

  // CPE sem as letras finais continua a bater; NIF repetido noutra operadora não cola.
  assert.equal(por('v3').estadoOperadora, 'ativo')
  assert.equal(por('v4').estadoOperadora, null)
  assert.equal(por('v4').divergencias.length, 0, 'MEO não tem reporte, não é divergência')

  assert.ok(por('v5').divergencias.includes('falta_no_reporte'))

  const orfa = r.linhas.find((l) => !l.vendaId)!
  assert.equal(orfa.operadora, 'DIGI')
  assert.ok(orfa.divergencias.includes('nao_esta_no_crm'))
  assert.equal(orfa.estadoFinal, 'pendente')

  assert.deepEqual(r.operadorasComReporte, ['DIGI', 'Endesa'])
  const d = r.resumo.find((x) => x.operadora === 'DIGI')!
  assert.deepEqual([d.ativo, d.pendente, d.anulado, d.total], [1, 2, 1, 4])
  assert.equal(r.totais.total, 6)
})

test('nomes de abas válidos e únicos', () => {
  const usados = new Set<string>()
  assert.equal(nomeAba('MEO', usados), 'MEO')
  assert.equal(nomeAba('meo', usados), 'meo 2')
  assert.equal(nomeAba('a/b:c', usados), 'a b c')
})
