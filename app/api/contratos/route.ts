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

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (user.role === 'admin') {
    const contratos = await supabaseStore.getAllContratos()
    return NextResponse.json({ contratos })
  }

  const contratos = await supabaseStore.getContratosByUser(user.id)
  return NextResponse.json({ contratos })
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const contrato = await supabaseStore.createContrato({
    user_id: user.id,
    client_name: body.client_name,
    client_phone: body.client_phone,
    client_cc: body.client_cc,
    client_nif: body.client_nif,
    client_morada: body.client_morada,
    client_email: body.client_email || '',
    servico_type: body.servico_type,
    operadora: body.operadora,
    assinado_cliente: false,
    assinado_vendedor: false,
    status: 'rascunho',
  })

  return NextResponse.json({ contrato })
}

export async function PATCH(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const contrato = await supabaseStore.updateContrato(body.id, body.updates)

  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  return NextResponse.json({ contrato })
}
