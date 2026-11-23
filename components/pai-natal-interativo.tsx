'use client'

import { useEffect, useRef } from 'react'

// Pai Natal interativo (olhos seguem o rato, acena, pisca, salta e fala ao tocar).
// Usa /natal/pai-natal.js (sem dependências). Só aparece na época de Natal (quem o usa decide).
type Props = {
  tamanho?: number
  mensagens: string[]
  link?: { href: string; texto: string; novo?: boolean }
  balao?: 'cima' | 'esquerda'
  dica?: string | false
  saudar?: number
}

declare global {
  interface Window { PaiNatal?: { mount: (el: HTMLElement, opts: Record<string, unknown>) => (() => void) | undefined } }
}

let carregar: Promise<void> | null = null
function carregarScript() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.PaiNatal) return Promise.resolve()
  if (!carregar) {
    carregar = new Promise<void>((ok, falha) => {
      const s = document.createElement('script')
      s.src = '/natal/pai-natal.js'
      s.async = true
      s.onload = () => ok()
      s.onerror = () => { carregar = null; falha(new Error('pai-natal.js')) }
      document.body.appendChild(s)
    })
  }
  return carregar
}

export default function PaiNatalInterativo({ tamanho = 150, mensagens, link, balao = 'cima', dica, saudar }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const chave = JSON.stringify({ tamanho, mensagens, link, balao, dica, saudar })
  useEffect(() => {
    let desmontar: (() => void) | undefined
    let ativo = true
    carregarScript().then(() => {
      if (!ativo || !ref.current || !window.PaiNatal) return
      desmontar = window.PaiNatal.mount(ref.current, { tamanho, mensagens, link, balao, dica, saudar })
    }).catch(() => {})
    return () => { ativo = false; desmontar?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  return <div ref={ref} style={{ display: 'inline-block', minWidth: tamanho, minHeight: tamanho * 1.14 }} />
}
