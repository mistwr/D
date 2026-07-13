import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ?? 'parcendi_fb_webhook_2026'

// Facebook verification handshake
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Token invalido' }, { status: 403 })
}

// Facebook Lead Ads webhook payload
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = svc()

    // Extract leads from entries
    const entries = body.entry ?? []
    const inserted: string[] = []

    for (const entry of entries) {
      const pageId = String(entry.id ?? '')
      const changes = entry.changes ?? []

      for (const change of changes) {
        if (change.field !== 'leadgen') continue
        const value = change.value ?? {}
        const leadId = String(value.leadgen_id ?? '')
        const formId = String(value.form_id ?? '')
        const adId = String(value.ad_id ?? '')
        const adName = String(value.ad_name ?? '')
        const adsetName = String(value.adset_name ?? '')
        const campaignName = String(value.campaign_name ?? '')

        // Fetch lead field data from Meta Graph API if token available
        let nome = '', email = '', telefone = '', empresa = '', cidade = '', servico = ''
        let tipo: 'vendas' | 'recrutamento' = 'vendas'

        if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN && leadId) {
          try {
            const fieldRes = await fetch(
              `https://graph.facebook.com/v19.0/${leadId}?fields=field_data&access_token=${process.env.FACEBOOK_PAGE_ACCESS_TOKEN}`
            )
            if (fieldRes.ok) {
              const fieldData = await fieldRes.json()
              const fields: { name: string; values: string[] }[] = fieldData.field_data ?? []
              for (const f of fields) {
                const v = f.values?.[0] ?? ''
                const n = f.name.toLowerCase()
                if (n.includes('nome') || n.includes('name') || n === 'full_name') nome = v
                else if (n.includes('email')) email = v
                else if (n.includes('telef') || n.includes('phone') || n.includes('numero')) telefone = v
                else if (n.includes('empresa') || n.includes('company')) empresa = v
                else if (n.includes('cidade') || n.includes('city')) cidade = v
                else if (n.includes('servico') || n.includes('service')) servico = v
                else if (n.includes('tipo') || n.includes('type')) {
                  tipo = v.toLowerCase().includes('recrut') ? 'recrutamento' : 'vendas'
                }
              }
            }
          } catch { /* silencioso */ }
        }

        // Determine tipo from campaign/form name heuristic
        const campaignLower = (campaignName + ' ' + (formId ?? '')).toLowerCase()
        if (campaignLower.includes('recrut') || campaignLower.includes('emprego') || campaignLower.includes('candidat')) {
          tipo = 'recrutamento'
        }

        const { error } = await db.from('facebook_leads').upsert({
          lead_id: leadId || null,
          form_id: formId,
          form_name: value.form_name ?? '',
          ad_id: adId,
          ad_name: adName,
          adset_name: adsetName,
          campaign_name: campaignName,
          page_id: pageId,
          nome: nome || null,
          email: email || null,
          telefone: telefone || null,
          empresa: empresa || null,
          cidade: cidade || null,
          servico: servico || null,
          tipo,
          raw_data: value,
        }, { onConflict: 'lead_id', ignoreDuplicates: true })

        if (!error) inserted.push(leadId)
      }
    }

    return NextResponse.json({ ok: true, inserted })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
