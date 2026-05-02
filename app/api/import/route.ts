import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const VALID_STATUSES = ['pendente', 'em_revisao', 'ativa', 'processado', 'pago', 'cancelado', 'rejeitado']

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const svc = service()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { rows } = body as { rows: { client_email: string; status: string; notes?: string }[] }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Nenhuma linha válida encontrada' }, { status: 400 })
  }

  const validRows = rows.filter(r => r.client_email && VALID_STATUSES.includes(r.status))
  if (validRows.length === 0) {
    return NextResponse.json({ error: 'Nenhuma linha com formato válido. Use colunas: client_email, status' }, { status: 400 })
  }

  let updated = 0
  for (const row of validRows) {
    const { error } = await svc
      .from('vendas')
      .update({ status: row.status, notes: row.notes ?? '', updated_at: new Date().toISOString() })
      .eq('client_email', row.client_email)
    if (!error) updated++
  }

  return NextResponse.json({
    ok: true,
    message: `${updated} venda(s) atualizada(s) de ${validRows.length} linha(s) processadas`,
    updated,
    processed: validRows.length,
  })
}
