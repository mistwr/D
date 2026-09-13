'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Mic, MicOff, Send, Sparkles, MessageSquareText, ShieldCheck, PhoneCall, Radio, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type CoachingEvent = {
  id: string
  transcript_chunk: string
  speaker: 'client' | 'seller'
  insight_type: 'coach' | 'objection' | 'sentiment' | 'next_action' | 'warning'
  insight: string
  confidence: number | null
  created_at: string
}

type LiveCall = {
  id: string
  client_name: string | null
  phone_number: string
  status: string
  current_stage: string | null
  detected_intent: string | null
}

type LiveDevice = {
  name: string
  status: string
  telephony_mode: string
  sim_operator: string | null
  network_type: string | null
  battery_level: number | null
}

type LiveMetrics = {
  seller_talk_ratio: number
  client_talk_ratio: number
  interruptions: number
  transcript_count: number
}

type TranscriptRow = {
  id: string
  speaker: string
  text: string
  spoken_at: string
}

export function SofiaLiveCoach() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [liveText, setLiveText] = useState('')
  const [manualText, setManualText] = useState('')
  const [events, setEvents] = useState<CoachingEvent[]>([])
  const [sending, setSending] = useState(false)
  const [liveCall, setLiveCall] = useState<LiveCall | null>(null)
  const [device, setDevice] = useState<LiveDevice | null>(null)
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null)
  const [callTranscript, setCallTranscript] = useState<TranscriptRow[]>([])
  const [syncing, setSyncing] = useState(false)
  const recognitionRef = useRef<any>(null)
  const syncingRef = useRef(false)

  useEffect(() => {
    let channel: any
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const db = supabase as any
      const { data } = await db
        .from('sofia_live_coaching_events')
        .select('id,transcript_chunk,speaker,insight_type,insight,confidence,created_at')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (data) setEvents(data)

      channel = supabase
        .channel(`sofia-live-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'sofia_live_coaching_events', filter: `profile_id=eq.${user.id}`,
        }, (payload) => setEvents((prev) => [payload.new as CoachingEvent, ...prev].slice(0, 40)))
        .subscribe()
    })()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function refreshVoiceContext() {
      if (syncingRef.current) return
      syncingRef.current = true
      setSyncing(true)
      try {
        const { data: statusData, error: statusError } = await supabase.functions.invoke('sofia-live-coach', {
          body: { action: 'status' },
        })
        if (statusError) throw statusError
        if (cancelled) return

        setLiveCall(statusData?.call ?? null)
        setDevice(statusData?.device ?? null)
        setMetrics(statusData?.metrics ?? null)
        setCallTranscript(statusData?.transcripts ?? [])

        if (statusData?.call) {
          const { data: syncData, error: syncError } = await supabase.functions.invoke('sofia-live-coach', {
            body: { action: 'sync_active_call' },
          })
          if (syncError) throw syncError
          if (!cancelled) {
            setLiveCall(syncData?.call ?? statusData.call)
            setDevice(syncData?.device ?? statusData.device ?? null)
            setMetrics(syncData?.metrics ?? statusData.metrics ?? null)
          }
        }
      } catch (err) {
        console.error('Sofia live sync:', err)
      } finally {
        syncingRef.current = false
        if (!cancelled) setSyncing(false)
      }
    }

    refreshVoiceContext()
    const timer = window.setInterval(refreshVoiceContext, 2000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [userId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-PT'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event: any) => {
      let interim = ''
      const finals: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0]?.transcript || ''
        if (event.results[i].isFinal) finals.push(text)
        else interim += text
      }
      setLiveText(interim)
      finals.forEach((text) => { if (text.trim()) sendChunk(text.trim(), 'client') })
    }
    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') toast.error(`Microfone: ${event.error}`)
    }
    recognition.onend = () => {
      if (recognitionRef.current?._keepAlive) {
        try { recognition.start() } catch {}
      } else setListening(false)
    }
    recognitionRef.current = recognition

    return () => {
      recognition._keepAlive = false
      try { recognition.stop() } catch {}
    }
  }, [userId])

  async function sendChunk(text: string, speaker: 'client' | 'seller' = 'client') {
    if (!text.trim()) return
    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('sofia-live-coach', {
        body: { transcript: text.trim(), speaker, call_id: liveCall?.id ?? null },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
    } catch (err: any) {
      toast.error(err?.message || 'A Sofia não conseguiu analisar este trecho.')
    } finally {
      setSending(false)
    }
  }

  function toggleListening() {
    const recognition = recognitionRef.current
    if (!recognition) {
      toast.error('O reconhecimento de voz não está disponível neste browser. Use o modo manual.')
      return
    }
    if (listening) {
      recognition._keepAlive = false
      recognition.stop()
      setListening(false)
      setLiveText('')
    } else {
      recognition._keepAlive = true
      try { recognition.start(); setListening(true) } catch {}
    }
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault()
    const text = manualText.trim()
    if (!text) return
    setManualText('')
    await sendChunk(text)
  }

  const latest = events[0]
  const lastCallLine = callTranscript.at(-1)
  const engineLive = Boolean(liveCall)

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Bot size={26} /></div>
              <div>
                <h2 className="text-lg font-bold">Sofia em Direto</h2>
                <p className="text-sm text-muted-foreground">Copiloto comercial ligado ao motor de chamadas e ao microfone como fallback.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
              <span className={`h-2 w-2 rounded-full ${engineLive || listening ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              {engineLive ? 'Chamada ligada' : listening ? 'Microfone ativo' : 'Em espera'}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className={`rounded-xl border p-4 ${engineLive ? 'border-emerald-200 bg-emerald-50' : 'bg-secondary/30'}`}>
              <div className="flex items-center gap-2 text-sm font-semibold"><PhoneCall size={16} /> Motor de chamadas</div>
              {liveCall ? (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-medium">{liveCall.client_name || 'Cliente'} · {liveCall.phone_number}</p>
                  <p className="text-muted-foreground">Estado: {liveCall.status}{liveCall.detected_intent ? ` · Intenção: ${liveCall.detected_intent}` : ''}</p>
                </div>
              ) : <p className="mt-2 text-xs text-muted-foreground">Sem chamada ativa neste momento.</p>}
            </div>

            <div className="rounded-xl border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><Radio size={16} /> Gateway / dispositivo</div>
              {device ? (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{device.name} · {device.status}</p>
                  <p>{device.telephony_mode}{device.sim_operator ? ` · ${device.sim_operator}` : ''}{device.network_type ? ` · ${device.network_type}` : ''}</p>
                </div>
              ) : <p className="mt-2 text-xs text-muted-foreground">À espera de dispositivo associado à chamada.</p>}
            </div>
          </div>

          <div className="mt-4 rounded-xl border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText size={16} /> Transcrição em direto</div>
              {syncing && <span className="text-[11px] text-muted-foreground">a sincronizar…</span>}
            </div>
            <p className="min-h-16 text-sm leading-relaxed text-muted-foreground">
              {lastCallLine ? `${lastCallLine.speaker}: ${lastCallLine.text}` : liveText || (listening ? 'A ouvir a conversa…' : 'Quando houver chamada, a Sofia liga-se automaticamente ao transcript do motor de voz.')}
            </p>
          </div>

          {metrics && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Vendedor" value={`${metrics.seller_talk_ratio}%`} />
              <Metric label="Cliente" value={`${metrics.client_talk_ratio}%`} />
              <Metric label="Interrupções" value={String(metrics.interruptions)} />
              <Metric label="Trechos" value={String(metrics.transcript_count)} />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button onClick={toggleListening} variant={engineLive ? 'outline' : 'default'} className={`gap-2 sm:min-w-44 ${!engineLive && listening ? 'bg-red-600 hover:bg-red-700' : !engineLive ? 'bg-brand hover:bg-brand-dark' : ''}`}>
              {listening ? <MicOff size={17} /> : <Mic size={17} />}
              {listening ? 'Parar microfone' : engineLive ? 'Microfone fallback' : 'Iniciar Sofia'}
            </Button>
            {!supported && <p className="self-center text-xs text-amber-700">Reconhecimento de voz do browser indisponível. O motor de chamadas e o modo manual continuam ativos.</p>}
          </div>
        </div>

        <form onSubmit={submitManual} className="rounded-2xl border border-border bg-card p-5">
          <label className="text-sm font-semibold">Teste / trecho manual</label>
          <p className="mt-1 text-xs text-muted-foreground">Escreva o que o cliente disse para receber coaching imediato.</p>
          <div className="mt-3 flex gap-2">
            <input value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Ex.: Está muito caro, vou pensar…" className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30" />
            <Button type="submit" disabled={sending || !manualText.trim()} size="icon" className="bg-brand hover:bg-brand-dark"><Send size={16} /></Button>
          </div>
        </form>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-950">
          <div className="mb-1 flex items-center gap-2 font-semibold"><ShieldCheck size={15} /> Modo Copiloto Híbrido</div>
          A Sofia tenta primeiro usar a transcrição do motor de chamadas. Quando não existe uma chamada ligada, pode trabalhar pelo microfone do browser ou por texto manual.
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2"><Sparkles className="text-brand" size={18} /><h2 className="font-bold">Insight agora</h2></div>
          {latest ? (
            <div className="space-y-3">
              <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{latest.insight_type.replace('_', ' ')}</span>
              <p className="text-base font-medium leading-relaxed">{latest.insight}</p>
              <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">“{latest.transcript_chunk}”</div>
              {latest.confidence != null && <p className="text-xs text-muted-foreground">Confiança: {Math.round(Number(latest.confidence) * 100)}%</p>}
            </div>
          ) : <p className="text-sm text-muted-foreground">A Sofia mostra aqui a objeção, oportunidade ou próxima ação assim que detetar algo útil.</p>}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2"><Activity size={17} className="text-brand" /><h3 className="font-semibold">Histórico da conversa</h3></div>
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {events.length === 0 ? <p className="text-sm text-muted-foreground">Ainda sem insights nesta sessão.</p> : events.map((event) => (
              <div key={event.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase text-brand">{event.insight_type.replace('_', ' ')}</span>
                  <span className="text-[11px] text-muted-foreground">{new Date(event.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{event.insight}</p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{event.speaker === 'seller' ? 'Vendedor' : 'Cliente'}: {event.transcript_chunk}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}
