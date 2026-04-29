import { NextResponse } from 'next/server'
import { createUser as createUserLocal, getUserByEmail as getUserByEmailLocal } from '@/lib/store'

export async function POST(req: Request) {
  const { email, password, full_name, company_name, phone } = await req.json()
  console.log('[v0] /api/auth/register: email=', email, 'full_name=', full_name)
  
  if (!email || !password || !full_name) {
    console.log('[v0] /api/auth/register: Campos obrigatorios em falta')
    return NextResponse.json({ error: 'Campos obrigatorios em falta' }, { status: 400 })
  }

  // Verificar se email já existe
  const existing = getUserByEmailLocal(email)
  console.log('[v0] /api/auth/register: Email existe?', !!existing)
  
  if (existing) {
    return NextResponse.json({ error: 'Email ja registado' }, { status: 409 })
  }

  // Criar utilizador localmente
  console.log('[v0] /api/auth/register: Criando user no local store...')
  const user = createUserLocal({
    email,
    password,
    full_name,
    role: 'parceiro',
    company_name: company_name || '',
    phone: phone || '',
  })

  console.log('[v0] /api/auth/register: User criado?', !!user, 'id:', user?.id)
  
  if (!user) {
    console.log('[v0] /api/auth/register: Falha ao criar user')
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }

  // Criar token e cookie
  const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64')
  console.log('[v0] /api/auth/register: Token criado:', token.substring(0, 20) + '...')
  
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
  
  console.log('[v0] /api/auth/register: Cookie setado com sucesso!')
  return res
}

