import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  message: z.string().min(10),
  rgpd_consent: z.boolean(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('contact_submissions') as any).insert({
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      segment: data.segment ?? null,
      message: data.message,
      rgpd_consent: data.rgpd_consent,
      origin: 'website',
      page: '/contactos',
    })

    if (error) {
      console.error('[contact api]', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact api] validation error', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
