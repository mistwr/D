'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    // Timeout de segurança - se demorar mais de 5 segundos, mostrar página
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.log('[v0] Auth check timeout - showing landing page')
        setLoading(false)
      }
    }, 5000)
    
    const checkAuth = async () => {
      try {
        console.log('[v0] Checking auth...')
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('[v0] Session result:', session ? 'has session' : 'no session', sessionError?.message)
        
        if (sessionError || !session) { 
          if (isMounted) setLoading(false)
          return 
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles').select('role').eq('id', session.user.id).single()
        
        console.log('[v0] Profile result:', profile, profileError?.message)
        
        if (profileError || !profile) {
          console.error('[v0] Profile error:', profileError)
          if (isMounted) setLoading(false)
          return
        }
        
        const role = profile?.role ?? 'parceiro'
        console.log('[v0] Redirecting to:', role === 'admin' ? '/admin/dashboard' : '/dashboard')
        router.replace(role === 'admin' ? '/admin/dashboard' : '/dashboard')
      } catch (err) {
        console.error('[v0] Auth check error:', err)
        if (isMounted) setLoading(false)
      }
    }
    
    checkAuth()
    
    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f8fafc' }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: '#0ea5e9', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6" style={{ background: '#f9fafb' }}>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3" style={{ color: '#1e293b' }}>Soluções Diferentes</h1>
        <p className="text-lg" style={{ color: '#64748b' }}>CRM Inteligente para Gestão de Vendas</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/sobre" className="px-6 py-3 rounded-lg font-medium text-center" style={{ background: '#f8fafc', color: '#0ea5e9' }}>
          Saber Mais
        </Link>
        <Link href="/login" className="px-6 py-3 rounded-lg font-medium text-center" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: 'white' }}>
          Entrar
        </Link>
        <Link href="/register" className="px-6 py-3 rounded-lg font-medium text-center" style={{ background: '#e5e7eb', color: '#1e293b' }}>
          Registar
        </Link>
        <a 
          href="https://coberturasolucoesdiferentesv1-dzzbne45m.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-lg font-medium text-center" 
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}
        >
          📡 Cobertura Telecom
        </a>
      </div>
    </div>
  )
}
