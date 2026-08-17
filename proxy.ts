import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const CRM_PREFIX = '/crm'
const AUTH_ROUTES = ['/auth/login', '/auth/signup']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const { pathname } = request.nextUrl

  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname.startsWith(CRM_PREFIX) || AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('crm', 'configuracao-pendente')
      return NextResponse.redirect(url)
    }
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (pathname.startsWith(CRM_PREFIX) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/crm/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
