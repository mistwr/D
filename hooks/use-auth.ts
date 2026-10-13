'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '@/lib/auth-fetch'
import { withTimeout } from '@/lib/utils/request'
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
  const [failure,setFailure] = useState<Error|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await withTimeout(supabase.auth.getSession(),8000)

        if (sessionError) throw sessionError

        if (!session) {
          if (isMounted) router.replace('/login')
          return
        }


        const { data: profile, error: profileError } = await withTimeout(supabase
          .from('profiles')
          .select('role, full_name, company_name, phone, is_superadmin, pode_criar_estrutura, pode_criar_parceiros, avatar_url')
          .eq('id', session.user.id)
          .single(),10000)


        if (!isMounted) return

        if (profileError || !profile) {
          throw new Error('Não foi possível carregar o teu perfil. Tenta novamente.')
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


        if (requiredRole && authUser.role !== requiredRole) {
          router.replace(authUser.role === 'admin' ? '/admin/dashboard' : '/dashboard')
          return
        }

        setUser(authUser)
      } catch (err) {
        if (isMounted) setFailure(err instanceof Error?err:new Error('Não foi possível confirmar a sessão.'))
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

  if (failure) throw failure
  return { user, loading, authFetch }
}
