import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserById, bulkUpdateVendas, type Venda } from '@/lib/store'

async function getUser() {
  const jar = await cookies()
  const t = jar.get('sd_session')?.value
  if (!t) return null
  try { const { id } = JSON.parse(Buffer.from(t, 'base64').toString()); return getUserById(id) ?? null } catch { return null }
}

// Recebe rows ja parseadas no client (CSV/Excel parsing e feito no browser)
// Formato esperado: [{ client_email, status, notes? }]
export async function POST(req: Request) {
  const user = await getUser()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { rows } = body as { rows: { client_email: string; status: Venda['status']; notes?: string }[] }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Nenhuma linha valida encontrada' }, { status: 400 })
  }

  const validStatuses = ['pendente', 'em_revisao', 'ativa', 'processado', 'pago', 'cancelado', 'rejeitado']
  const validRows = rows.filter(r => r.client_email && validStatuses.includes(r.status))

  if (validRows.length === 0) {
    return NextResponse.json({ error: 'Nenhuma linha com formato valido. Use colunas: client_email, status' }, { status: 400 })
  }

  const updated = bulkUpdateVendas(validRows)

  return NextResponse.json({
    ok: true,
    message: `${updated} venda(s) atualizada(s) de ${validRows.length} linha(s) processadas`,
    updated,
    processed: validRows.length,
  })
}
