import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin === true

  const { searchParams } = new URL(req.url)
  const pipeline_id = searchParams.get('pipeline_id')
  const unidade_id = searchParams.get('unidade_id')
  const atribuido_a = searchParams.get('atribuido_a')
  const convertido = searchParams.get('convertido')

  let query = service.from('leads')
    .select('id, nome, email, telefone, empresa, nif, morada, cidade, servico, operadora, notas, score, convertido, created_at, pipelines(nome, cor), pipeline_estados(nome, cor), unidades(nome)')
    .order('created_at', { ascending: false })

  // Parceiros só veem as suas próprias leads
  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  if (pipeline_id) query = query.eq('pipeline_id', pipeline_id)
  if (unidade_id) query = query.eq('unidade_id', unidade_id)
  if (atribuido_a) query = query.eq('atribuido_a', atribuido_a)
  if (convertido === 'true') query = query.eq('convertido', true)
  if (convertido === 'false') query = query.eq('convertido', false)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = svc()
  const body = await req.json()
  
  // Calcular score inicial
  let score = 0
  if (body.email) score += 10
  if (body.telefone) score += 15
  if (body.empresa) score += 20
  if (body.nif) score += 15
  if (body.interesse) score += 20
  if (body.orcamento) score += 10
  if (body.prazo) score += 10
  
  const { data, error } = await service.from('leads').insert({
    ...body,
    user_id: user.id,      // guardar sempre o parceiro que criou
    uploaded_by: user.id,
    score,
    score_demografico: body.empresa ? 40 : 20,
    score_comportamental: 0,
    score_engagement: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Registar actividade
  await service.from('lead_actividades').insert({
    lead_id: data.id,
    tipo: 'criacao',
    descricao: 'Lead criado',
    user_id: user.id
  })

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = svc()
  const body = await req.json()
  const { id, ...updateData } = body

  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })

  // Recalcular score se dados mudaram
  if (updateData.email !== undefined || updateData.telefone !== undefined) {
    let score = 0
    if (updateData.email) score += 10
    if (updateData.telefone) score += 15
    if (updateData.empresa) score += 20
    if (updateData.nif) score += 15
    if (updateData.interesse) score += 20
    if (updateData.orcamento) score += 10
    if (updateData.prazo) score += 10
    updateData.score = score
  }

  updateData.updated_at = new Date().toISOString()

  const { data, error } = await service.from('leads').update(updateData).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Registar actividade
  await service.from('lead_actividades').insert({
    lead_id: id,
    tipo: 'atualizacao',
    descricao: `Lead atualizado`,
    user_id: user.id
  })

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = svc()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })

  const { error } = await service.from('leads').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
