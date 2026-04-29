'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { 
          credentials: 'include'
        })
        
        if (!isMounted) return

        if (res.status === 401) {
          router.replace('/login')
          return
        }

        const data = await res.json()
        
        if (!isMounted) return

        if (!data.user) {
          router.replace('/login')
          return
        }

        if (requiredRole && data.user.role !== requiredRole) {
          const redirectTo = data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard'
          router.replace(redirectTo)
          return
        }

        setUser(data.user)
      } catch (e) {
        if (isMounted) {
          router.replace('/login')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router, requiredRole])

  return { user, loading }
}
