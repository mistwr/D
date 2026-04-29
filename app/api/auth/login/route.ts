import { NextResponse } from 'next/server'
import { getUserByEmail as getUserByEmailLocal } from '@/lib/store'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  console.log('[v0] /api/auth/login: email=', email)

  // USAR APENAS LOCAL STORE - Supabase será adicionado depois
  console.log('[v0] /api/auth/login: Buscando em local store...')
  const user = getUserByEmailLocal(email)
  console.log('[v0] /api/auth/login: User encontrado?', !!user)

  if (!user) {
    console.log('[v0] /api/auth/login: User não encontrado - Email ou senha incorretos')
    return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
  }

  if (user.password !== password) {
    console.log('[v0] /api/auth/login: Password incorreta')
    return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
  }

  console.log('[v0] /api/auth/login: Credenciais corretas, criando token')
  
  // Criar token e cookie
  const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64')
  console.log('[v0] /api/auth/login: Token:', token.substring(0, 20) + '...')
  
  const res = NextResponse.json({
    user: { 
      id: user.id, 
      email: user.email, 
      full_name: user.full_name, 
      role: user.role, 
      company_name: user.company_name 
    }
  })
  
  res.cookies.set('sd_session', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  })
  
  console.log('[v0] /api/auth/login: Cookie setado com sucesso!')
  return res
}


