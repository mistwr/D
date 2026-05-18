'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/dashboard') }, [router])
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#0ea5e9' }} />
    </div>
  )
}
