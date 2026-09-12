import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

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
    const supabase = createAdminClient()
    const segment = data.segment && allowedSegments.has(data.segment) ? data.segment : 'telecom'
    const now = new Date().toISOString()

    const { data: lead, error: leadError } = await (supabase.from('leads') as any)
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        origin: 'website',
        segment,
        status: 'nova',
        score: 90,
        notes: data.message,
        rgpd_consent: true,
        rgpd_consent_date: now,
        source_campaign: 'consultoria-site',
        source_medium: 'website',
        converted: false,
      })
      .select('id')
      .single()

    if (leadError) {
      console.error('[contact api] lead error', leadError)
      return NextResponse.json({ error: 'Lead database error' }, { status: 500 })
    }

    const { error: submissionError } = await (supabase.from('contact_submissions') as any).insert({
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      segment,
      message: data.message,
      rgpd_consent: true,
      origin: 'website',
      page: '/contactos',
    })

    if (submissionError) console.error('[contact api] submission mirror error', submissionError)

    return NextResponse.json({ success: true, lead_id: lead.id, temperature: 'hot' })
  } catch (err) {
    console.error('[contact api] validation error', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
