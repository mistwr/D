import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient as createService } from '@supabase/supabase-js'

function svc() {
  return createService(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  let contratosQuery = service.from('contratos').select('*').order('created_at', { ascending: false })
  if (!isAdmin) contratosQuery = contratosQuery.eq('user_id', user.id)
  const { data: contratos } = await contratosQuery

  if (!contratos || contratos.length === 0) return NextResponse.json({ contratos: [] })

  const userIds = [...new Set(contratos.map((c: any) => c.user_id).filter(Boolean))]
  const { data: profiles } = await service.from('profiles').select('id, full_name, email, company, phone').in('id', userIds)
  const profilesMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))

  const contratoIds = contratos.map((c: any) => c.id)
  const { data: docs } = await service.from('documentos').select('*').in('venda_id', contratoIds)

  const docsWithUrls = await Promise.all((docs ?? []).map(async (doc: any) => {
    if (!doc.file_path) return { ...doc, signed_url: null }
    const { data: signed } = await service.storage.from('documentos').createSignedUrl(doc.file_path, 3600)
    return { ...doc, signed_url: signed?.signedUrl ?? null }
  }))

  const docsMap = new Map<string, any[]>()
  docsWithUrls.forEach((d: any) => {
    const key = d.venda_id
    if (!docsMap.has(key)) docsMap.set(key, [])
    docsMap.get(key)!.push(d)
  })

  const enriched = contratos.map((c: any) => ({
    ...c,
    parceiro: profilesMap.get(c.user_id) ?? null,
    documentos: docsMap.get(c.id) ?? [],
  }))

  return NextResponse.json({ contratos: enriched })
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const body = await req.json()
  const { data: contrato, error } = await service.from('contratos').insert({
    user_id: user.id,
    client_name: body.client_name,
    client_phone: body.client_phone ?? '',
    client_cc: body.client_cc ?? '',
    client_nif: body.client_nif ?? '',
    client_morada: body.client_morada ?? '',
    client_email: body.client_email ?? '',
    servico_type: body.servico_type,
    operadora: body.operadora ?? '',
    assinado_cliente: false,
    assinado_vendedor: false,
    status: 'rascunho',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contrato })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await service.from('contratos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { id, updates } = await req.json()
  const { data: existing } = await service.from('contratos').select('user_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  if (!isAdmin && existing.user_id !== user.id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: contrato } = await service
    .from('contratos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  return NextResponse.json({ contrato })
}
