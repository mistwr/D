import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Resolve the authenticated user from:
 * 1. Cookie-based session (SSR)
 * 2. Authorization: Bearer <access_token> header (browser client fallback)
 */
export async function getAuthUser(req: NextRequest) {
  // 1. Cookie-based (standard SSR path)
  const supabase = await createClient()
  const { data: { user: cookieUser } } = await supabase.auth.getUser()
  if (cookieUser) return { user: cookieUser, supabase }

  // 2. Bearer token fallback
  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (token) {
    const service = svc()
    const { data } = await service.auth.getUser(token)
    if (data.user) return { user: data.user, supabase: service as any }
  }

  return { user: null, supabase }
}
