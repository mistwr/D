import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const firstName = String(body?.first_name ?? '').trim()
    const lastName = String(body?.last_name ?? '').trim()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (firstName.length < 2 || lastName.length < 2) {
      return NextResponse.json({ error: 'Nome e apelido são obrigatórios.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'A password deve ter pelo menos 8 caracteres.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user_id: data.user?.id ?? null,
      needs_email_confirmation: !data.session,
    })
  } catch {
    return NextResponse.json({ error: 'Não foi possível criar a conta.' }, { status: 500 })
  }
}
