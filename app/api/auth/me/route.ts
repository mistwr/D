import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  // 1. Tentar via cookie (SSR)
  const supabase = await createClient()
  let { data: { user } } = await supabase.auth.getUser()

  // 2. Fallback: Authorization Bearer token (browser client)
  if (!user) {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (token) {
      const service = svc()
      const { data } = await service.auth.getUser(token)
      user = data.user ?? null
    }
  }

  if (!user) return NextResponse.json({ user: null }, { status: 401 })

  const service = svc()
  const { data: profile } = await service
    .from('profiles')
    .select('role, full_name, company_name, phone')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? '',
      role: profile?.role ?? 'parceiro',
      company_name: profile?.company_name ?? '',
      phone: profile?.phone ?? '',
    }
  })
}
