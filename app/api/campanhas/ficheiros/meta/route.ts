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

// Save file metadata after the file has been uploaded to storage directly from browser
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const svc = service()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { campanha_id, file_name, file_path, file_type, file_size } = body

  if (!campanha_id || !file_name || !file_path) {
    return NextResponse.json({ error: 'campanha_id, file_name e file_path sao obrigatorios' }, { status: 400 })
  }

  const { data: row, error: dbErr } = await svc.from('campanha_ficheiros').insert({
    campanha_id,
    file_name,
    file_path,
    file_type: file_type || 'other',
    file_size: file_size || 0,
    uploaded_by: user.id,
  }).select().single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ ficheiro: row })
}
