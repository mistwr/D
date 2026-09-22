'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LuminBrand } from '@/components/lumin-brand'

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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: '#d6a84b', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6" style={{ background: 'radial-gradient(circle at top, #1b160d 0%, #090909 36%, #050812 100%)' }}>
      <div className="text-center flex flex-col items-center gap-5">
        <LuminBrand inverse showPartner={false} />
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>CRM Soluções Diferentes</h1>
          <p className="text-base sm:text-lg" style={{ color: '#b8b0a2' }}>Gestão comercial potenciada pela Lumin AI</p>
        </div>
      </div>
      <div className="flex flex-col gap-6 max-w-md">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/sobre" className="px-6 py-3 rounded-lg font-medium text-center" style={{ background: 'rgba(255,255,255,0.06)', color: '#e7b95f', border: '1px solid rgba(231,185,95,0.18)' }}>
            Saber Mais
          </Link>
          <Link href="/login" className="px-6 py-3 rounded-lg font-medium text-center" style={{ background: 'linear-gradient(135deg, #f1cf76 0%, #d6a84b 100%)', color: '#17130b' }}>
            Entrar
          </Link>
          <Link href="/register" className="px-6 py-3 rounded-lg font-medium text-center" style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff' }}>
            Registar
          </Link>
        </div>
        <a 
          href="https://coberturasolucoesdiferentesv1-dzzbne45m.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-lg font-medium text-center w-full" 
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}
        >
          📡 Cobertura Telecom
        </a>
      </div>
    </div>
  )
}
