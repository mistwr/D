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

// Update logo_url and logo_path on a campanha after direct browser upload
export async function PATCH(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const svc = service()
  const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { id, logo_url, logo_path } = await req.json()
  if (!id || !logo_url) return NextResponse.json({ error: 'id e logo_url sao obrigatorios' }, { status: 400 })

  const { error } = await svc.from('campanhas').update({ logo_url, logo_path }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, logo_url })
}
