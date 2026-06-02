'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'parceiro'
  full_name: string
  company_name: string | null
  is_superadmin: boolean
  pode_criar_estrutura?: boolean
  pode_criar_parceiros?: boolean
  avatar_url?: string
}

export function useAuth(requiredRole?: 'admin' | 'parceiro') {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    const checkAuth = async () => {
      try {
        console.log('[v0] useAuth: checking session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.log('[v0] useAuth: session error', sessionError.message)
        }

        if (!session) {
          console.log('[v0] useAuth: no session, redirecting to login')
          if (isMounted) router.replace('/login')
          return
        }

        console.log('[v0] useAuth: session found for', session.user.email)

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, company_name, phone, is_superadmin, pode_criar_estrutura, pode_criar_parceiros, avatar_url')
          .eq('id', session.user.id)
          .single()

        console.log('[v0] useAuth: profile result', profile, profileError?.message)

        if (!isMounted) return

        if (profileError || !profile) {
          console.log('[v0] useAuth: no profile found, redirecting to login')
          if (isMounted) router.replace('/login')
          return
        }

        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email ?? '',
          role: (profile?.role ?? 'parceiro') as 'admin' | 'parceiro',
          full_name: profile?.full_name ?? '',
          company_name: profile?.company_name ?? null,
          is_superadmin: profile?.is_superadmin ?? false,
          pode_criar_estrutura: profile?.pode_criar_estrutura ?? false,
          pode_criar_parceiros: profile?.pode_criar_parceiros ?? false,
          avatar_url: profile?.avatar_url ?? undefined,
        }

        console.log('[v0] useAuth: authUser created', authUser.email, authUser.role)

        if (requiredRole && authUser.role !== requiredRole) {
          console.log('[v0] useAuth: role mismatch, redirecting')
          router.replace(authUser.role === 'admin' ? '/admin/dashboard' : '/dashboard')
          return
        }

        console.log('[v0] useAuth: setting user')
        setUser(authUser)
      } catch (err) {
        console.log('[v0] useAuth: catch error', err)
        if (isMounted) router.replace('/login')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login')
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router, requiredRole])

  /** Fetch wrapper que envia sempre Authorization: Bearer <token> */
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const headers: Record<string, string> = { ...(options.headers as Record<string, string> ?? {}) }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(url, { ...options, credentials: 'include', headers })
  }, [])

  return { user, loading, authFetch }
}
