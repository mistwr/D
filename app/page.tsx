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
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { setLoading(false); return }
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', session.user.id).single()
        const role = profile?.role ?? 'parceiro'
        router.replace(role === 'admin' ? '/admin/dashboard' : '/dashboard')
      } catch {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f3f4f6' }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: '#4f46e5', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6" style={{ background: '#f9fafb' }}>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-3" style={{ color: '#111827' }}>Soluções Diferentes</h1>
        <p className="text-lg" style={{ color: '#6b7280' }}>CRM Inteligente para Gestão de Vendas</p>
      </div>
      <div className="flex gap-4">
        <Link href="/sobre" className="px-6 py-3 rounded-lg font-medium" style={{ background: '#f3f4f6', color: '#4338ca' }}>
          Saber Mais
        </Link>
        <Link href="/login" className="px-6 py-3 rounded-lg font-medium" style={{ background: '#4338ca', color: 'white' }}>
          Entrar
        </Link>
        <Link href="/register" className="px-6 py-3 rounded-lg font-medium" style={{ background: '#e5e7eb', color: '#111827' }}>
          Registar
        </Link>
      </div>
    </div>
  )
}
