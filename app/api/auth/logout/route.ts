import { NextResponse } from 'next/server'

export async function POST() {
  console.log('[v0] Logout: Removendo sessão')
  const res = NextResponse.json({ ok: true })
  res.cookies.set('sd_session', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  })
  console.log('[v0] Logout: Cookie removido')
  return res
}
