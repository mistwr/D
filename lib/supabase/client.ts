'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'
import {
  PARCENDI_SUPABASE_PUBLISHABLE_KEY,
  PARCENDI_SUPABASE_URL,
  withParcendiTables,
} from '@/lib/supabase/parcendi'

export function createClient() {
  const client = createBrowserClient<Database>(
    PARCENDI_SUPABASE_URL,
    PARCENDI_SUPABASE_PUBLISHABLE_KEY,
  )

  return withParcendiTables(client)
}
