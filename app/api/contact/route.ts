import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  PARCENDI_SUPABASE_PUBLISHABLE_KEY,
  PARCENDI_SUPABASE_URL,
} from '@/lib/supabase/parcendi'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  message: z.string().min(10),
  rgpd_consent: z.boolean().refine((v) => v === true),
})

const allowedSegments = new Set(['energia', 'telecom', 'credito', 'imobiliario', 'seguros'])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    const segment = data.segment && allowedSegments.has(data.segment) ? data.segment : 'telecom'

    const supabase = createClient(
      PARCENDI_SUPABASE_URL,
      PARCENDI_SUPABASE_PUBLISHABLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: leadId, error } = await supabase.rpc('parcendi_submit_contact', {
      p_name: data.name,
      p_email: data.email,
      p_phone: data.phone ?? null,
      p_segment: segment,
      p_message: data.message,
      p_rgpd_consent: true,
    })

    if (error) {
      console.error('[contact api] Indigo RPC error', error)
      return NextResponse.json({ error: 'Lead database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, lead_id: leadId, temperature: 'hot' })
  } catch (err) {
    console.error('[contact api] validation error', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
