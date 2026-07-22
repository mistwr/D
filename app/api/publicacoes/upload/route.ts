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

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const svc = service()
    const { data: profile, error: profileErr } = await svc.from('profiles').select('role, full_name').eq('id', user.id).single()
    if (profileErr) {
      console.error('[v0] Error fetching profile:', profileErr.message)
      return NextResponse.json({ error: `Profile error: ${profileErr.message}` }, { status: 500 })
    }
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

    const formData = await req.formData()
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const parceiroIds = (formData.get('parceiro_ids') as string || '')
      .split(',').map(s => s.trim()).filter(Boolean)
    const file = formData.get('file') as File | null

    if (!title) return NextResponse.json({ error: 'Titulo obrigatorio' }, { status: 400 })

    let filePath = ''
    let fileName = ''

    // Upload do ficheiro se existir
    if (file && file.size > 0) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      filePath = `publicacoes/${Date.now()}-${safeName}`
      fileName = file.name
      const bytes = await file.arrayBuffer()
      console.log('[v0] Upload publicacoes:', { filePath, fileName, fileSize: file.size, contentType: file.type })
      const { error: uploadErr } = await svc.storage.from('publicacoes').upload(filePath, bytes, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadErr) {
        console.error('[v0] Upload error:', uploadErr)
        return NextResponse.json({ error: `Upload error: ${uploadErr.message}` }, { status: 500 })
      }
      console.log('[v0] Upload successful')
    }

    // Determinar destinatários
    let targets: string[] = parceiroIds
    if (targets.length === 0) {
      const { data: parceiros } = await svc.from('profiles').select('id').eq('role', 'parceiro')
      targets = (parceiros ?? []).map((p: any) => p.id)
    }

    const inserts = targets.length > 0
      ? targets.map(pid => ({
          parceiro_id: pid,
          title,
          content: content ?? '',
          file_name: fileName,
          file_path: filePath,
          author_name: profile?.full_name ?? 'Admin',
          created_by: user.id,
          published: true,
          type: 'comunicado',
        }))
      : [{
          parceiro_id: null,
          title,
          content: content ?? '',
          file_name: fileName,
          file_path: filePath,
          author_name: profile?.full_name ?? 'Admin',
          created_by: user.id,
          published: true,
          type: 'comunicado',
        }]

    const { data: publicacoes, error: dbErr } = await svc.from('publicacoes').insert(inserts).select()
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

    // Notificações
    if (targets.length > 0) {
      const notifs = targets.map(pid => ({
        user_id: pid,
        title,
        message: content ? content.substring(0, 100) : 'Nova publicação disponível',
      }))
      await svc.from('notificacoes').insert(notifs)
    }

    return NextResponse.json({ publicacoes: publicacoes ?? [] })
  } catch (err) {
    console.error('[v0] Exception publicacoes upload:', err)
    return NextResponse.json({ error: `Unexpected error: ${String(err)}` }, { status: 500 })
  }
}
