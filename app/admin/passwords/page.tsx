'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { KeyRound, Eye, EyeOff, CheckCircle, User } from 'lucide-react'

interface Parceiro { id: string; full_name: string; email: string; company_name: string }

export default function AdminPasswordsPage() {
  const { user, loading: authLoading, authFetch } = useAuth('admin')
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [loading, setLoading] = useState(true)

  // Alterar password de parceiro
  const [selectedId, setSelectedId] = useState('')
  const [newPass, setNewPass] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [savingP, setSavingP] = useState(false)
  const [successP, setSuccessP] = useState('')
  const [errorP, setErrorP] = useState('')

  // Alterar propria password
  const [myPass, setMyPass] = useState('')
  const [showMy, setShowMy] = useState(false)
  const [savingM, setSavingM] = useState(false)
  const [successM, setSuccessM] = useState('')
  const [errorM, setErrorM] = useState('')

  useEffect(() => {
    if (!user) return
    authFetch('/api/vendas?parceiros=1').then(r => r.json()).then(res => {
      setParceiros(res.parceiros || [])
      setLoading(false)
    })
  }, [user, authFetch])

  async function changeParceiroPass() {
    setErrorP(''); setSuccessP('')
    if (!selectedId) { setErrorP('Selecione um parceiro'); return }
    if (!newPass || newPass.length < 6) { setErrorP('Password deve ter pelo menos 6 caracteres'); return }
    setSavingP(true)
    const res = await authFetch('/api/auth/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: selectedId, new_password: newPass }),
    })
    const data = await res.json()
    setSavingP(false)
    if (!res.ok) { setErrorP(data.error || 'Erro'); return }
    setSuccessP('Password alterada com sucesso!')
    setNewPass(''); setSelectedId('')
    setTimeout(() => setSuccessP(''), 3000)
  }

  async function changeMyPass() {
    setErrorM(''); setSuccessM('')
    if (!myPass || myPass.length < 6) { setErrorM('Password deve ter pelo menos 6 caracteres'); return }
    setSavingM(true)
    const res = await authFetch('/api/auth/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password: myPass }),
    })
    const data = await res.json()
    setSavingM(false)
    if (!res.ok) { setErrorM(data.error || 'Erro'); return }
    setSuccessM('A sua password foi alterada!')
    setMyPass('')
    setTimeout(() => setSuccessM(''), 3000)
  }

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#f3f4f6' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#4f46e5' }} />
    </div>
  )

  const inputStyle = { border: '1px solid #d1d5db', background: '#fff', color: '#111827' }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Navbar user={user} />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 md:ml-64 pt-16">
          <div className="p-4 md:p-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <KeyRound size={28} style={{ color: '#4338ca' }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Gestao de Passwords</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>Altere passwords de parceiros ou da sua conta</p>
              </div>
            </div>

            {/* Alterar password de parceiro */}
            <div className="rounded-xl p-6 mb-6 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="flex items-center gap-2 mb-5">
                <User size={18} style={{ color: '#4338ca' }} />
                <h2 className="text-base font-semibold" style={{ color: '#111827' }}>Alterar Password de Parceiro</h2>
              </div>
              {errorP && <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{errorP}</div>}
              {successP && (
                <div className="mb-4 flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}>
                  <CheckCircle size={16} /> {successP}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Parceiro *</label>
                  <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-sm outline-none" style={inputStyle}>
                    <option value="">Selecionar parceiro...</option>
                    {parceiros.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} {p.email ? `(${p.email})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Nova Password *</label>
                  <div className="relative">
                    <input type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none pr-10" placeholder="Minimo 6 caracteres" style={inputStyle} />
                    <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-2.5">
                      {showNew ? <EyeOff size={16} style={{ color: '#9ca3af' }} /> : <Eye size={16} style={{ color: '#9ca3af' }} />}
                    </button>
                  </div>
                </div>
                <button onClick={changeParceiroPass} disabled={savingP}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#4338ca' }}>
                  {savingP ? 'A guardar...' : 'Alterar Password do Parceiro'}
                </button>
              </div>
            </div>

            {/* Alterar propria password */}
            <div className="rounded-xl p-6 shadow-sm" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="flex items-center gap-2 mb-5">
                <KeyRound size={18} style={{ color: '#4338ca' }} />
                <h2 className="text-base font-semibold" style={{ color: '#111827' }}>Alterar a Minha Password</h2>
              </div>
              {errorM && <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{errorM}</div>}
              {successM && (
                <div className="mb-4 flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}>
                  <CheckCircle size={16} /> {successM}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Nova Password *</label>
                  <div className="relative">
                    <input type={showMy ? 'text' : 'password'} value={myPass} onChange={e => setMyPass(e.target.value)}
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none pr-10" placeholder="Minimo 6 caracteres" style={inputStyle} />
                    <button type="button" onClick={() => setShowMy(s => !s)} className="absolute right-3 top-2.5">
                      {showMy ? <EyeOff size={16} style={{ color: '#9ca3af' }} /> : <Eye size={16} style={{ color: '#9ca3af' }} />}
                    </button>
                  </div>
                </div>
                <button onClick={changeMyPass} disabled={savingM}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#4338ca' }}>
                  {savingM ? 'A guardar...' : 'Alterar a Minha Password'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
