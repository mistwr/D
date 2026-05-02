import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/supabase/get-auth-user'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { accepted, categories } = await req.json()
    const svc = service()

    // Tentar obter utilizador autenticado (pode nao estar autenticado)
    const { user } = await getAuthUser(req).catch(() => ({ user: null }))

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? null

    const userAgent = req.headers.get('user-agent') ?? null

    // Gerar session_id para utilizadores nao autenticados
    const sessionId = req.cookies.get('sb-session')?.value
      ?? req.headers.get('x-session-id')
      ?? `anon-${Date.now()}`

    await svc.from('cookie_consents').insert({
      user_id: user?.id ?? null,
      session_id: sessionId,
      ip_address: ip,
      accepted: accepted ?? false,
      categories: categories ?? { necessary: true, analytics: false, marketing: false },
      user_agent: userAgent,
    })

    return NextResponse.json({ success: true })
  } catch {
    // Falha silenciosa — o consentimento ja esta guardado no localStorage
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
