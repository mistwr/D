'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Cookie, ChevronDown, ChevronUp, Shield } from 'lucide-react'

const COOKIE_KEY = 'sd_cookie_consent'

interface ConsentState {
  accepted: boolean
  necessary: boolean
  analytics: boolean
  marketing: boolean
  timestamp: number
}

function getStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(COOKIE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ConsentState
  } catch {
    return null
  }
}

function storeConsent(state: ConsentState) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify(state))
  // Cookie HTTP para middleware (30 dias)
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify({ accepted: state.accepted, analytics: state.analytics, marketing: state.marketing }))}; path=/; expires=${expires}; SameSite=Lax`
}

export function CookieBanner() {
  const [show, setShow] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = getStoredConsent()
    if (!stored) {
      // Pequeno delay para nao aparecer imediatamente
      const t = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  if (!show) return null

  async function save(accepted: boolean, anal = analytics, mkt = marketing) {
    setSaving(true)
    const state: ConsentState = {
      accepted,
      necessary: true,
      analytics: anal,
      marketing: mkt,
      timestamp: Date.now(),
    }
    storeConsent(state)
    // Registar consentimento no servidor (best-effort)
    try {
      await fetch('/api/rgpd/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted, categories: { necessary: true, analytics: anal, marketing: mkt } }),
      })
    } catch { /* silencioso */ }
    setSaving(false)
    setShow(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      aria-modal="true"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="max-w-3xl mx-auto rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #e2e8f0' }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#eef2ff' }}>
            <Cookie size={20} style={{ color: '#0ea5e9' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold" style={{ color: '#1e293b' }}>
              Utilizamos cookies
            </h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: '#64748b' }}>
              Utilizamos cookies para garantir o funcionamento da plataforma e melhorar a sua experiência. Os cookies estritamente necessários não podem ser desactivados.{' '}
              <Link href="/rgpd" className="underline font-medium" style={{ color: '#0ea5e9' }}>
                Saiba mais na nossa Política de Privacidade e Cookies.
              </Link>
            </p>
          </div>
          <button
            onClick={() => save(false, false, false)}
            className="flex-shrink-0 p-1.5 rounded-lg transition hover:opacity-70"
            style={{ color: '#9ca3af' }}
            aria-label="Fechar e rejeitar cookies opcionais"
          >
            <X size={18} />
          </button>
        </div>

        {/* Detalhes expandiveis */}
        <div style={{ borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition hover:opacity-70"
            style={{ color: '#475569' }}
          >
            <span>Gerir preferencias de cookies</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded && (
            <div className="px-6 pb-4 space-y-3">
              {/* Necessarios */}
              <div className="flex items-start justify-between gap-4 rounded-xl p-4" style={{ background: '#f9fafb', border: '1px solid #e2e8f0' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>Cookies necessarios</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>
                    Essenciais para o funcionamento da plataforma: autenticacao, sessao e seguranca. Nao podem ser desactivados.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#d1fae5', color: '#065f46' }}>
                    <Shield size={11} /> Sempre activos
                  </span>
                </div>
              </div>

              {/* Analiticos */}
              <div className="flex items-start justify-between gap-4 rounded-xl p-4" style={{ background: '#f9fafb', border: '1px solid #e2e8f0' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>Cookies analiticos</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>
                    Permitem-nos compreender como a plataforma e utilizada para a melhorar continuamente. Os dados sao anonimizados.
                  </p>
                </div>
                <label className="flex-shrink-0 relative inline-flex items-center cursor-pointer" aria-label="Cookies analiticos">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={e => setAnalytics(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 rounded-full transition peer-checked:bg-indigo-600 peer-focus:ring-2 peer-focus:ring-indigo-300"
                    style={{ background: analytics ? '#4338ca' : '#d1d5db' }}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${analytics ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 rounded-xl p-4" style={{ background: '#f9fafb', border: '1px solid #e2e8f0' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>Cookies de marketing</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#64748b' }}>
                    Utilizados para personalizar conteudo e comunicacoes relevantes. Apenas partilhamos dados com parceiros de confianca.
                  </p>
                </div>
                <label className="flex-shrink-0 relative inline-flex items-center cursor-pointer" aria-label="Cookies de marketing">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={e => setMarketing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 rounded-full transition"
                    style={{ background: marketing ? '#4338ca' : '#d1d5db' }}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${marketing ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Botoes */}
        <div className="flex flex-col sm:flex-row gap-2 px-6 pb-6 pt-2">
          <button
            onClick={() => save(false, false, false)}
            disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold border transition hover:opacity-80 disabled:opacity-50"
            style={{ background: '#fff', color: '#475569', border: '1px solid #d1d5db' }}
          >
            Rejeitar opcionais
          </button>
          {expanded && (
            <button
              onClick={() => save(true, analytics, marketing)}
              disabled={saving}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold border transition hover:opacity-80 disabled:opacity-50"
              style={{ background: '#eef2ff', color: '#0ea5e9', border: '1px solid #c7d2fe' }}
            >
              Guardar preferencias
            </button>
          )}
          <button
            onClick={() => save(true, true, true)}
            disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition hover:opacity-80 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: '#fff' }}
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  )
}
