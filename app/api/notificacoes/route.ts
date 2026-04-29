import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserById, getNotificacoesByUser, markNotificacaoRead } from '@/lib/store'

async function getUser() {
  const jar = await cookies()
  const t = jar.get('sd_session')?.value
  if (!t) return null
  try { const { id } = JSON.parse(Buffer.from(t, 'base64').toString()); return getUserById(id) ?? null } catch { return null }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  return NextResponse.json({ notificacoes: getNotificacoesByUser(user.id) })
}

export async function PATCH(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const { id } = await req.json()
  markNotificacaoRead(id)
  return NextResponse.json({ ok: true })
}
