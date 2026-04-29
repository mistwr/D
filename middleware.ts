import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('sd_session')?.value

  // Rotas PUBLICAS - sem proteção
  const publicRoutes = ['/', '/login', '/register', '/sobre']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Static files - sem proteção
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/public/') ||
    /\.(pdf|png|jpg|jpeg|gif|webp|svg|ico|woff2|woff|ttf|eot)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // APIs de autenticação são públicas
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Se tem sessão, deixa passar
  if (session) {
    return NextResponse.next()
  }

  // Sem sessão em rota protegida
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ],
}
