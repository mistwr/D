'use client'

import { useEffect, useState } from 'react'

// Tema de Natal do CRM: faixa fina com as cores da época no topo e neve muito discreta.
// Só aparece de 20/11 a 6/1 e desliga-se sozinho. Respeita "reduzir movimento".
export function epocaNatal(d = new Date()) {
  const m = d.getMonth(), dia = d.getDate()
  return (m === 10 && dia >= 20) || m === 11 || (m === 0 && dia <= 6)
}

const FLOCOS = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37) % 100, delay: (i * 1.7) % 14, dur: 12 + ((i * 3) % 10), size: 2 + ((i * 5) % 3), op: 0.18 + ((i * 7) % 4) / 20,
}))

export function NatalTheme() {
  const [ativo, setAtivo] = useState(false)
  useEffect(() => { setAtivo(epocaNatal()) }, [])
  if (!ativo) return null
  return (
    <>
      <div aria-hidden style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 60, background: 'linear-gradient(90deg,#7F1D1D,#B91C1C 30%,#e7b95f 50%,#166534 70%,#0C2B1E)' }} />
      <div aria-hidden className="natal-neve" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 55 }}>
        {FLOCOS.map((f, i) => (
          <span key={i} style={{ position: 'absolute', top: -10, left: `${f.left}%`, width: f.size, height: f.size, borderRadius: '50%', background: '#e7b95f', opacity: f.op, animation: `natalCair ${f.dur}s linear ${f.delay}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes natalCair{to{transform:translate3d(20px,105vh,0)}}@media (prefers-reduced-motion:reduce){.natal-neve{display:none}}`}</style>
    </>
  )
}

export function NatalTag({ inverse = false }: { inverse?: boolean }) {
  const [ativo, setAtivo] = useState(false)
  useEffect(() => { setAtivo(epocaNatal()) }, [])
  if (!ativo) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: inverse ? '#e7b95f' : '#a8741e' }}>
      🎄 Boas Festas
    </span>
  )
}
