import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserById, getComissao, setComissao, calcComissaoParceiro, getAllComissoes } from '@/lib/store'
import * as supabaseStore from '@/lib/supabase-store'

async function getUser() {
  const jar = await cookies()
  const t = jar.get('sd_session')?.value
  if (!t) return null
  try { const { id } = JSON.parse(Buffer.from(t, 'base64').toString()); return getUserById(id) ?? null } catch { return null }
}

// GET - parceiro ve as suas comissoes, admin ve todas ou de um parceiro
export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const parceiroId = req.nextUrl.searchParams.get('parceiro_id')

  // Parceiro ve as suas proprias comissoes + simulacao
  if (user.role === 'parceiro') {
    const com = getComissao(user.id)
    const calc = calcComissaoParceiro(user.id)
    return NextResponse.json({ comissao: com || null, calculo: calc })
  }

  // Admin ve comissao de um parceiro especifico
  if (parceiroId) {
    const com = getComissao(parceiroId)
    const calc = calcComissaoParceiro(parceiroId)
    return NextResponse.json({ comissao: com || null, calculo: calc })
  }

  // Admin ve todas
  return NextResponse.json({ comissoes: getAllComissoes() })
}

// POST - admin define comissao de um parceiro OU importa comissoes por operadora
export async function POST(req: Request) {
  const user = await getUser()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()

  // Import de comissões por operadora (Excel/CSV)
  if (body.action === 'import') {
    const imported = await supabaseStore.importComissoesExcel(user.id, body.linhas)
    const comissoes = await supabaseStore.getComissoesPorOperadora(user.id)
    return NextResponse.json({ imported, comissoes })
  }

  // Definir comissão por parceiro (método antigo)
  if (!body.parceiro_id) return NextResponse.json({ error: 'parceiro_id obrigatorio' }, { status: 400 })

  const comissao = setComissao(body.parceiro_id, {
    energia_percent: parseFloat(body.energia_percent) || 0,
    telecom_percent: parseFloat(body.telecom_percent) || 0,
    energia_fixo: parseFloat(body.energia_fixo) || 0,
    telecom_fixo: parseFloat(body.telecom_fixo) || 0,
  })

  return NextResponse.json({ comissao })
}

