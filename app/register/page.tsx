'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', email: '', company_name: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords nao coincidem'); return }
    if (form.password.length < 6) { setError('Password minimo 6 caracteres'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao registar'); setLoading(false); return }
      router.replace('/dashboard')
    } catch (err) {
      setError('Erro de ligacao')
    } finally { setLoading(false) }
  }

  const fields = [
    { k: 'full_name', label: 'Nome completo', type: 'text', req: true },
    { k: 'email', label: 'Email', type: 'email', req: true },
    { k: 'company_name', label: 'Empresa', type: 'text', req: false },
    { k: 'phone', label: 'Telefone', type: 'tel', req: false },
    { k: 'password', label: 'Password', type: 'password', req: true },
    { k: 'confirm', label: 'Confirmar password', type: 'password', req: true },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #4338ca 0%, #3b82f6 100%)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 shadow-2xl" style={{ background: '#ffffff' }}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #4338ca, #3b82f6)' }}>
            <span className="text-2xl font-bold text-white">SD</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Registo de Parceiro</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error && <div className="rounded-lg p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{error}</div>}
          {fields.map(f => (
            <div key={f.k}>
              <label className="mb-1 block text-sm font-medium" style={{ color: '#374151' }}>{f.label}</label>
              <input type={f.type} value={form[f.k as keyof typeof form]} onChange={e => set(f.k, e.target.value)} required={f.req}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: '#fff', border: '1px solid #d1d5db', color: '#111827' }} />
            </div>
          ))}
          <button type="submit" disabled={loading} className="mt-2 w-full rounded-lg px-4 py-2.5 font-medium text-white disabled:opacity-50" style={{ background: '#4338ca' }}>
            {loading ? 'A registar...' : 'Registar'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm" style={{ color: '#6b7280' }}>
          {'Ja tem conta? '}<Link href="/login" className="font-medium" style={{ color: '#4338ca' }}>Entrar</Link>
        </p>
        <p className="mt-3 text-center text-xs">
          <Link href="/sobre" className="underline" style={{ color: '#6b7280' }}>Saber mais sobre o CRM</Link>
        </p>
      </div>
    </div>
  )
}
