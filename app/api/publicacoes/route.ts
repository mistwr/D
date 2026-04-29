import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserById, getPublicacoes, getPublicacoesByParceiro, createPublicacao, createNotificacao, getParceiros } from '@/lib/store'

async function getUser() {
  const jar = await cookies()
  const t = jar.get('sd_session')?.value
  if (!t) return null
  try { const { id } = JSON.parse(Buffer.from(t, 'base64').toString()); return getUserById(id) ?? null } catch { return null }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  if (user.role === 'admin') {
    const all = getPublicacoes()
    const enriched = all.map(p => {
      const parceiro = getUserById(p.parceiro_id)
      return { ...p, parceiro_name: parceiro?.full_name || 'Desconhecido' }
    })
    return NextResponse.json({ publicacoes: enriched })
  }
  return NextResponse.json({ publicacoes: getPublicacoesByParceiro(user.id) })
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  const body = await req.json()
  const parceiroIds: string[] = body.parceiro_ids || []
  const targets = parceiroIds.length > 0 ? parceiroIds : getParceiros().map(p => p.id)
  const created = targets.map(pid => {
    const pub = createPublicacao({
      parceiro_id: pid,
      title: body.title,
      message: body.message || '',
      document_name: body.document_name || '',
      created_by: user.id,
    })
    createNotificacao({ user_id: pid, title: body.title, message: body.message || 'Nova publicacao disponivel' })
    return pub
  })
  return NextResponse.json({ publicacoes: created })
}
