'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Mic, MicOff, Send, Sparkles, MessageSquareText, ShieldCheck } from 'lucide-react'
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

export function SofiaLiveCoach() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [liveText, setLiveText] = useState('')
  const [manualText, setManualText] = useState('')
  const [events, setEvents] = useState<CoachingEvent[]>([])
  const [sending, setSending] = useState(false)
  const recognitionRef = useRef<any>(null)

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
        .limit(20)
      if (data) setEvents(data)

      channel = supabase
        .channel(`sofia-live-${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'sofia_live_coaching_events', filter: `profile_id=eq.${user.id}`,
        }, (payload) => {
          setEvents((prev) => [payload.new as CoachingEvent, ...prev].slice(0, 30))
        })
        .subscribe()
    })()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

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
      finals.forEach((text) => { if (text.trim()) sendChunk(text.trim()) })
    }
    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') toast.error(`Microfone: ${event.error}`)
    }
    recognition.onend = () => {
      if (recognitionRef.current?._keepAlive) {
        try { recognition.start() } catch {}
      } else {
        setListening(false)
      }
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
        body: { transcript: text.trim(), speaker },
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
      try {
        recognition.start()
        setListening(true)
      } catch {}
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

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand"><Bot size={26} /></div>
              <div>
                <h2 className="text-lg font-bold">Sofia em Direto</h2>
                <p className="text-sm text-muted-foreground">Copiloto de vendas: ouve, transcreve e sugere a próxima resposta.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
              <span className={`h-2 w-2 rounded-full ${listening ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              {listening ? 'A ouvir' : 'Em espera'}
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><MessageSquareText size={16} /> Transcrição em direto</div>
            <p className="min-h-16 text-sm leading-relaxed text-muted-foreground">
              {liveText || (listening ? 'A ouvir a conversa…' : 'Carregue em “Iniciar Sofia” e permita o acesso ao microfone.')}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button onClick={toggleListening} className={`gap-2 sm:min-w-44 ${listening ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-dark'}`}>
              {listening ? <MicOff size={17} /> : <Mic size={17} />}
              {listening ? 'Parar Sofia' : 'Iniciar Sofia'}
            </Button>
            {!supported && <p className="self-center text-xs text-amber-700">Reconhecimento de voz indisponível neste browser. O modo manual continua ativo.</p>}
          </div>
        </div>

        <form onSubmit={submitManual} className="rounded-2xl border border-border bg-card p-5">
          <label className="text-sm font-semibold">Teste / trecho manual</label>
          <p className="mt-1 text-xs text-muted-foreground">Pode escrever ou colar o que o cliente acabou de dizer para receber coaching imediato.</p>
          <div className="mt-3 flex gap-2">
            <input value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Ex.: Está muito caro, vou pensar…" className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30" />
            <Button type="submit" disabled={sending || !manualText.trim()} size="icon" className="bg-brand hover:bg-brand-dark"><Send size={16} /></Button>
          </div>
        </form>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900">
          <div className="mb-1 flex items-center gap-2 font-semibold"><ShieldCheck size={15} /> Modo Copiloto</div>
          Esta versão usa o microfone do dispositivo/browser. Para chamadas GSM com áudio separado das duas pessoas, a Sofia será ligada ao gateway/LiveKit já existente no motor de voz.
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
          <h3 className="mb-3 font-semibold">Histórico da conversa</h3>
          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {events.length === 0 ? <p className="text-sm text-muted-foreground">Ainda sem insights nesta sessão.</p> : events.map((event) => (
              <div key={event.id} className="rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase text-brand">{event.insight_type.replace('_', ' ')}</span>
                  <span className="text-[11px] text-muted-foreground">{new Date(event.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{event.insight}</p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{event.transcript_chunk}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
