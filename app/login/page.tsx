'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Imagens locais — energia, telecom e cidade
const SLIDES = [
  { url: '/slide-energia.jpg',  caption: 'Energia para o futuro' },
  { url: '/slide-telecom.jpg',  caption: 'Telecomunicacoes sem limites' },
  { url: '/slide-cidade.jpg',   caption: 'Solucoes que fazem a diferenca' },
  { url: '/slide-energia.jpg',  caption: 'Energia limpa e sustentavel' },
  { url: '/slide-telecom.jpg',  caption: 'Tecnologia ao seu servico' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
    } catch {
      setError('Erro de ligacao')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0f172a' }}>

      {/* ---- LADO ESQUERDO: Slideshow ---- */}
      <div className="relative hidden lg:flex lg:w-[58%] xl:w-[62%] flex-col overflow-hidden">
        {/* Imagens pré-carregadas, só a atual fica visível */}
        {SLIDES.map((slide, i) => (
          <img
            key={slide.url}
            src={slide.url}
            alt={slide.caption}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: i === current && fade ? 1 : 0 }}
          />
        ))}
        {/* Overlay escuro gradiente */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.25) 0%, rgba(15,23,42,0.75) 100%)' }} />

        {/* Conteudo sobre o slideshow */}
        <div className="relative z-10 flex flex-col h-full p-10">
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
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10" style={{ background: '#ffffff' }}>
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
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition focus:ring-2"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#111827' }}
              />
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
        </div>
      </div>
    </div>
  )
}
