import { NextResponse } from 'next/server'
import { getUserById as getUserByIdLocal } from '@/lib/store'
import { cookies } from 'next/headers'

export async function GET() {
  const jar = await cookies()
  const token = jar.get('sd_session')?.value
  console.log('[v0] /api/auth/me: Token presente:', !!token)
  
  if (!token) {
    console.log('[v0] /api/auth/me: Sem token, retornando 401')
    return NextResponse.json({ user: null }, { status: 401 })
  }
  
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    console.log('[v0] /api/auth/me: User ID:', decoded.id)
    
    // Buscar em local store
    const user = getUserByIdLocal(decoded.id)
    console.log('[v0] /api/auth/me: Utilizador encontrado?', !!user)
    
    if (!user) {
      console.log('[v0] /api/auth/me: Utilizador não encontrado')
      return NextResponse.json({ user: null }, { status: 401 })
    }
    
    console.log('[v0] /api/auth/me: Retornando utilizador:', user.email)
    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name, 
        role: user.role, 
        company_name: user.company_name 
      } 
    })
  } catch (e: any) {
    console.log('[v0] /api/auth/me: Erro:', e.message)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}


