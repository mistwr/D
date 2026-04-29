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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const contratoId = params.id
  const contrato = await supabaseStore.getContratoById(contratoId)
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const body = await req.json()
  const assinatura = await supabaseStore.addAssinatura(contratoId, body.tipo, {
    assinante_id: user.id,
    assinante_email: user.email,
    assinante_nome: user.full_name,
    signature_image_base64: body.signature_image_base64,
    ip_address: getClientIp(req),
  })

  // Atualizar status do contrato baseado na assinatura
  let novoStatus = contrato.status
  let assinado_cliente = contrato.assinado_cliente
  let assinado_vendedor = contrato.assinado_vendedor

  if (body.tipo === 'cliente') {
    assinado_cliente = true
    if (contrato.assinado_vendedor) {
      novoStatus = 'finalizado'
    } else {
      novoStatus = 'pendente_vendedor'
    }
  } else if (body.tipo === 'vendedor') {
    assinado_vendedor = true
    if (assinado_cliente) {
      novoStatus = 'finalizado'
    } else {
      novoStatus = 'pendente_cliente'
    }
  }

  const updated = await supabaseStore.updateContrato(contratoId, { status: novoStatus, assinado_cliente, assinado_vendedor })

  return NextResponse.json({ assinatura, contrato: updated })
}
