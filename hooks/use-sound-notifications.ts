'use client'

import { useEffect, useRef, useCallback } from 'react'

// Generates a simple notification chime using Web Audio API
function createNotificationSound(ctx: AudioContext) {
  const frequencies = [880, 1108, 1320]
  let startTime = ctx.currentTime

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.value = freq

    const t = startTime + i * 0.12
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)

    osc.start(t)
    osc.stop(t + 0.25)
  })
}

export function useSoundNotifications(enabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playSound = useCallback(() => {
    if (!enabled) return
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => createNotificationSound(ctx))
      } else {
        createNotificationSound(ctx)
      }
    } catch {
      // Audio not available in this environment
    }
  }, [enabled])

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [])

  return playSound
}
