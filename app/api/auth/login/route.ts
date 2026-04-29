import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e password obrigatórios' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.json({ error: 'Email ou password incorretos' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, company_name')
    .eq('id', data.user.id)
    .single()

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: profile?.full_name ?? '',
      role: profile?.role ?? 'parceiro',
      company_name: profile?.company_name ?? '',
    }
  })
}
