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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: contratoId } = await params
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const svc = service()
  const { data: contrato } = await svc
    .from('contratos')
    .select('*')
    .eq('id', contratoId)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const body = await req.json()
  const { tipo } = body

  let novoStatus = contrato.status
  let assinado_cliente = contrato.assinado_cliente
  let assinado_vendedor = contrato.assinado_vendedor

  if (tipo === 'cliente') {
    assinado_cliente = true
    novoStatus = assinado_vendedor ? 'finalizado' : 'pendente_vendedor'
  } else if (tipo === 'vendedor') {
    assinado_vendedor = true
    novoStatus = assinado_cliente ? 'finalizado' : 'pendente_cliente'
  }

  const { data: updated, error } = await svc
    .from('contratos')
    .update({ status: novoStatus, assinado_cliente, assinado_vendedor, updated_at: new Date().toISOString() })
    .eq('id', contratoId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contrato: updated })
}
