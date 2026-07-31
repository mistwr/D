import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

// Service-role client. SERVER-ONLY. Never import this into client components.
// Bypasses RLS — always guard the caller with a role check before use.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
