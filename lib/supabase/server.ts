import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'
import {
  PARCENDI_SUPABASE_PUBLISHABLE_KEY,
  PARCENDI_SUPABASE_URL,
  withParcendiTables,
} from '@/lib/supabase/parcendi'

export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient<Database>(
    PARCENDI_SUPABASE_URL,
    PARCENDI_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component — ignore
          }
        },
      },
    },
  )

  return withParcendiTables(client)
}
