import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  PARCENDI_SUPABASE_PUBLISHABLE_KEY,
  PARCENDI_SUPABASE_URL,
  withParcendiTables,
} from '@/lib/supabase/parcendi'

// Server-only client. If a dedicated PARCENDi service key is configured in
// Vercel it will be used; otherwise we deliberately fall back to the public
// key so this app can never accidentally write to another Supabase project.
export function createAdminClient() {
  const client = createClient<Database>(
    PARCENDI_SUPABASE_URL,
    process.env.PARCENDI_SUPABASE_SERVICE_ROLE_KEY || PARCENDI_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  return withParcendiTables(client)
}
