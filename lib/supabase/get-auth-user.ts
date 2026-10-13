import {createScopedBearerClient} from '@/lib/supabase/bearer'
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
 * 1. Explicit verified bearer credentials
 * 2. Cookie-based session (SSR)
 */
export async function getAuthUser(req: NextRequest) {
  // Explicit bearer credentials are validated directly, avoiding a failed cookie lookup first.
  const token=req.headers.get('authorization')?.replace(/^Bearer /i,'').trim()
  if(token) {
    const service=svc()
    const {data}=await service.auth.getUser(token)
    if(data.user)return {user:data.user,supabase:createScopedBearerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,token)}
  }
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  return {user,supabase}
}
