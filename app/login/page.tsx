'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      
      if (!res.ok) { 
        setError(data.error || 'Erro ao entrar')
        setLoading(false)
        return 
      }

      router.replace(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    } catch (err) { 
      setError('Erro de ligação') 
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #4338ca 0%, #3b82f6 100%)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 shadow-2xl" style={{ background: '#ffffff' }}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #4338ca, #3b82f6)' }}>
            <span className="text-3xl font-bold text-white">SD</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Solucoes Diferentes</h1>
          <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>Plataforma CRM</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <div className="rounded-lg p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{error}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: '#374151' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition" placeholder="o-seu@email.com"
              style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: '#374151' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition" placeholder="••••••••"
              style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg px-4 py-2.5 font-medium text-white transition disabled:opacity-50"
            style={{ background: '#4338ca' }}>
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs" style={{ color: '#9ca3af' }}>
          Acesso restrito. Contacte o administrador para obter credenciais.
        </p>
        <p className="mt-3 text-center text-xs">
          <Link href="/sobre" className="underline" style={{ color: '#6b7280' }}>Saber mais sobre o CRM</Link>
        </p>
      </div>
    </div>
  )
}
