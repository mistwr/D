import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as supabaseStore from '@/lib/supabase-store'

async function getUser() {
  const jar = await cookies()
  const t = jar.get('sd_session')?.value
  if (!t) return null
  try {
    const { id } = JSON.parse(Buffer.from(t, 'base64').toString())
    return await supabaseStore.getUserById(id)
  } catch {
    return null
  }
}

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const contrato = await supabaseStore.getContratoById(params.id)
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  return NextResponse.json({ contrato })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const contrato = await supabaseStore.getContratoById(params.id)
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const body = await req.json()
  const assinatura = await supabaseStore.addAssinatura(params.id, body.tipo, {
    assinante_id: user.id,
    assinante_email: user.email,
    assinante_nome: user.full_name,
    signature_image_base64: body.signature_image_base64,
    ip_address: getClientIp(req),
  })

  // Atualizar status do contrato baseado na assinatura
  let novoStatus = contrato.status
  if (body.tipo === 'cliente' && !contrato.assinado_cliente) {
    novoStatus = 'pendente_vendedor'
  } else if (body.tipo === 'vendedor' && !contrato.assinado_vendedor && contrato.assinado_cliente) {
    novoStatus = 'finalizado'
  }

  const assinado_cliente = body.tipo === 'cliente' ? true : contrato.assinado_cliente
  const assinado_vendedor = body.tipo === 'vendedor' ? true : contrato.assinado_vendedor

  const contratoAtualizado = await supabaseStore.updateContrato(params.id, {
    status: novoStatus,
    assinado_cliente,
    assinado_vendedor,
  })

  return NextResponse.json({ assinatura, contrato: contratoAtualizado })
}
