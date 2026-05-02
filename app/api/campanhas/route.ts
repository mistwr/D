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

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const { data: campanha } = await svc.from('campanhas').select('*').eq('id', id).single()
    if (!campanha) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
    return NextResponse.json({ campanha })
  }

  const { data: campanhas } = await svc.from('campanhas').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ campanhas: campanhas ?? [] })
}

// POST: criar campanha (JSON) ou fazer upload de logo (FormData com action=upload_logo)
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const ct = req.headers.get('content-type') ?? ''

  // Upload de logo
  if (ct.includes('multipart/form-data')) {
    const formData = await req.formData()
    const campanhaId = formData.get('campanha_id') as string
    const file = formData.get('file') as File | null
    if (!campanhaId || !file) return NextResponse.json({ error: 'campanha_id e ficheiro obrigatorios' }, { status: 400 })

    const svc = service()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const logoPath = `logos/${campanhaId}.${ext}`

    const bytes = await file.arrayBuffer()
    const { error: upErr } = await svc.storage.from('campanhas').upload(logoPath, bytes, {
      contentType: file.type, upsert: true,
    })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data: signed } = await svc.storage.from('campanhas').createSignedUrl(logoPath, 86400 * 365)
    const logoUrl = signed?.signedUrl ?? ''

    await svc.from('campanhas').update({ logo_path: logoPath, logo_url: logoUrl }).eq('id', campanhaId)
    return NextResponse.json({ logo_url: logoUrl })
  }

  // Criar campanha
  const body = await req.json()
  const { data: campanha, error } = await svc.from('campanhas').insert({
    title: body.title,
    operator: body.operator ?? '',
    service_type: body.service_type ?? 'telecom',
    description: body.description ?? '',
    status: body.status ?? 'ativa',
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campanha })
}

export async function PATCH(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id, ...updates } = await req.json()
  const svc = service()
  const { data, error } = await svc.from('campanhas').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campanha: data })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  const svc = service()

  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id } = await req.json()

  // Apagar todos os ficheiros do storage desta campanha
  const { data: ficheiros } = await svc.from('campanha_ficheiros').select('file_path').eq('campanha_id', id)
  const paths = (ficheiros ?? []).map((f: any) => f.file_path).filter(Boolean)
  if (paths.length > 0) await svc.storage.from('campanhas').remove(paths)

  // Apagar logo se existir
  const { data: camp } = await svc.from('campanhas').select('logo_path').eq('id', id).single()
  if (camp?.logo_path) await svc.storage.from('campanhas').remove([camp.logo_path])

  // Apagar campanha (cascade apaga campanha_ficheiros)
  await svc.from('campanhas').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
