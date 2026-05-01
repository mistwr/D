'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'parceiro'
  full_name: string
  company_name: string | null
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
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          if (isMounted) router.replace('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, company_name, phone')
          .eq('id', session.user.id)
          .single()

        if (!isMounted) return

        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email ?? '',
          role: (profile?.role ?? 'parceiro') as 'admin' | 'parceiro',
          full_name: profile?.full_name ?? '',
          company_name: profile?.company_name ?? null,
        }

        if (requiredRole && authUser.role !== requiredRole) {
          router.replace(authUser.role === 'admin' ? '/admin/dashboard' : '/dashboard')
          return
        }

        setUser(authUser)
      } catch {
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

  return { user, loading }
}
