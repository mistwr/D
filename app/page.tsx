'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) { 
          setLoading(false)
          return 
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles').select('role').eq('id', session.user.id).single()
        
        if (profileError) {
          console.error('Profile error:', profileError)
          setLoading(false)
          return
        }
        
        const role = profile?.role ?? 'parceiro'
        router.replace(role === 'admin' ? '/admin/dashboard' : '/dashboard')
      } catch (err) {
        console.error('Auth check error:', err)
        setLoading(false)
      }
    }
    checkAuth()
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
      <div className="flex gap-4">
        <Link href="/sobre" className="px-6 py-3 rounded-lg font-medium" style={{ background: '#f8fafc', color: '#0ea5e9' }}>
          Saber Mais
        </Link>
        <Link href="/login" className="px-6 py-3 rounded-lg font-medium" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: 'white' }}>
          Entrar
        </Link>
        <Link href="/register" className="px-6 py-3 rounded-lg font-medium" style={{ background: '#e5e7eb', color: '#1e293b' }}>
          Registar
        </Link>
      </div>
    </div>
  )
}
