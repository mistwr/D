'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Imagens locais — energia, telecom e cidade
const SLIDES = [
  { url: '/slide-energia.jpg',  caption: 'Energia para o futuro',           id: 'slide-0' },
  { url: '/slide-telecom.jpg',  caption: 'Telecomunicacoes sem limites',     id: 'slide-1' },
  { url: '/slide-cidade.jpg',   caption: 'Solucoes que fazem a diferenca',   id: 'slide-2' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [current, setCurrent] = useState(0)
  const [fade, setFade] = useState(true)

  // Slideshow automático a cada 5s com fade
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % SLIDES.length)
        setFade(true)
      }, 600)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError || !data.user) {
        setError('Email ou password incorretos')
        setLoading(false)
        return
      }
      // Buscar role do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      router.replace(profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    } catch {
      setError('Erro de ligacao')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', alignItems: 'stretch' }}>

      {/* ---- LADO ESQUERDO: Slideshow ---- */}
      <div className="login-slideshow">
        {SLIDES.map((slide, i) => (
          <img
            key={slide.id}
            src={slide.url}
            alt={slide.caption}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: i === current && fade ? 1 : 0,
              transition: 'opacity 800ms ease-in-out',
              zIndex: 1,
            }}
          />
        ))}
        {/* Overlay escuro */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.85) 100%)',
          zIndex: 2,
        }} />

        {/* Conteudo sobre o slideshow */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3, display: 'flex', flexDirection: 'column', padding: '40px' }}>
          {/* Logo topo esquerdo */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg" style={{ border: '2px solid rgba(255,255,255,0.2)' }}>
              <Image src="/logo-solucoes.jpg" alt="Solucoes Diferentes" width={48} height={48} className="object-cover h-full w-full" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Solucoes Diferentes</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Telecomunicacoes & Energia</p>
            </div>
          </div>

          {/* Texto central */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <div
              className="transition-all duration-700"
              style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(8px)' }}
            >
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight text-white text-balance mb-4">
                {SLIDES[current].caption}
              </h2>
              <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
                A plataforma CRM da Solucoes Diferentes que une parceiros, energia e telecomunicacoes numa so experiencia.
              </p>
            </div>
          </div>

          {/* Indicadores do slideshow */}
          <div className="flex items-center gap-2 pb-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true) }, 300) }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 24 : 8,
                  height: 8,
                  background: i === current ? '#ffffff' : 'rgba(255,255,255,0.35)',
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
            <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Unsplash
            </span>
          </div>
        </div>
      </div>

      {/* ---- LADO DIREITO: Formulario ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#ffffff' }}>
        <div className="w-full max-w-[380px]">

          {/* Branding mobile (so visivel sem o painel esquerdo) */}
          <div className="mb-8 flex flex-col items-center lg:items-start">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md lg:hidden">
                <Image src="/logo-solucoes.jpg" alt="Solucoes Diferentes" width={48} height={48} className="object-cover h-full w-full" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>
                  Solucoes Diferentes
                </h1>
                <p className="text-xs" style={{ color: '#6b7280' }}>Telecomunicacoes & Energia</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Bem-vindo</h2>
            <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg p-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#374151' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="o-seu@email.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition focus:ring-2"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#111827' }}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: '#374151' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition focus:ring-2"
                  style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#111827' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition hover:opacity-70"
                  style={{ color: '#9ca3af' }}
                  aria-label={showPassword ? 'Esconder password' : 'Mostrar password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl py-3 font-semibold text-white transition disabled:opacity-60"
              style={{ background: '#1e3a5f' }}
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          {/* MyPoupar+ badge */}
          <div className="mt-8 flex items-center justify-center gap-2 rounded-xl py-3 px-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Image src="/logo-mypoupar.png" alt="MyPoupar+" width={24} height={24} className="object-contain" />
            <span className="text-xs font-medium" style={{ color: '#166534' }}>Powered by MyPoupar+</span>
          </div>

          <p className="mt-4 text-center text-xs" style={{ color: '#9ca3af' }}>
            Acesso restrito. Contacte o administrador para obter credenciais.
          </p>

          <p className="mt-3 text-center text-xs" style={{ color: '#9ca3af' }}>
            Ao aceder esta plataforma esta a aceitar a nossa{' '}
            <a href="/rgpd" className="underline hover:opacity-80 transition" style={{ color: '#4338ca' }}>
              Politica de Privacidade e Cookies
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
