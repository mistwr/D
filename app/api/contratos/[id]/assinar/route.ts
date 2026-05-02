import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: contratoId } = await params
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: contrato } = await supabase
    .from('contratos')
    .select('*')
    .eq('id', contratoId)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const body = await req.json()
  const { tipo, signature_image_base64 } = body

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

  const { data: updated, error } = await supabase
    .from('contratos')
    .update({ status: novoStatus, assinado_cliente, assinado_vendedor, updated_at: new Date().toISOString() })
    .eq('id', contratoId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contrato: updated })
}
