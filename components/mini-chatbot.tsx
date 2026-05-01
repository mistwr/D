'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { X, Send, Minimize2, Maximize2, Loader2, ChevronDown, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface MiniChatbotProps {
  role: 'admin' | 'parceiro'
  userName?: string
}

export function MiniChatbot({ role, userName }: MiniChatbotProps) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open, minimized])

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, minimized])

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    sendMessage({ text })
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isAdmin = role === 'admin'
  const accentColor = isAdmin ? '#4338ca' : '#0891b2'
  const accentDark = isAdmin ? '#3730a3' : '#0e7490'

  const suggestions = isAdmin
    ? ['Resumo de vendas de hoje', 'Parceiros com mais vendas', 'Vendas por operadora']
    : ['Como funciona a minha comissao?', 'Como registar uma venda?', 'Ver campanhas activas']

  function getMessageText(msg: any): string {
    if (!msg.parts || !Array.isArray(msg.parts)) return ''
    return msg.parts
      .filter((p: any): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p: any) => p.text)
      .join('')
  }

  const assistantName = isAdmin ? 'Sofia — Analise IA' : 'Sofia — Assistente'
  const assistantSub = isAdmin ? 'Consultas e analises em tempo real' : `Ola${userName ? `, ${userName.split(' ')[0]}` : ''}! Como posso ajudar?`

  return (
    <>
      {/* Botao flutuante com avatar */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 pr-4"
          style={{ background: '#fff', border: `2px solid ${accentColor}`, padding: '6px 16px 6px 6px' }}
          aria-label="Abrir assistente"
        >
          <div className="relative flex-shrink-0">
            <div className="h-10 w-10 rounded-full overflow-hidden" style={{ border: `2px solid ${accentColor}` }}>
              <Image
                src="/assistente.jpg"
                alt="Sofia - Assistente"
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            </div>
            {/* indicador online */}
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white" style={{ background: '#22c55e' }} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-tight" style={{ color: accentColor }}>Sofia</p>
            <p className="text-xs leading-tight" style={{ color: '#6b7280' }}>
              {isAdmin ? 'Analise IA' : 'Assistente'}
            </p>
          </div>
        </button>
      )}

      {/* Janela do chat */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl transition-all"
          style={{
            width: '370px',
            height: minimized ? '64px' : '520px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          {/* Header com imagem real */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentDark})` }}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="h-10 w-10 rounded-full overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.4)' }}>
                  <Image
                    src="/assistente.jpg"
                    alt="Sofia"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2" style={{ background: '#22c55e', borderColor: accentDark }} />
              </div>
              {!minimized && (
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{assistantName}</p>
                  <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.8)' }}>{assistantSub}</p>
                </div>
              )}
              {minimized && (
                <p className="text-sm font-semibold text-white">Sofia</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(m => !m)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/20"
                style={{ color: 'rgba(255,255,255,0.9)' }}
                aria-label={minimized ? 'Expandir' : 'Minimizar'}
              >
                {minimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/20"
                style={{ color: 'rgba(255,255,255,0.9)' }}
                aria-label="Fechar"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Area de mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f8fafc' }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 pt-2">
                    {/* Avatar grande no estado vazio */}
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full overflow-hidden shadow-lg mx-auto" style={{ border: `3px solid ${accentColor}` }}>
                        <Image
                          src="/assistente.jpg"
                          alt="Sofia"
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full shadow" style={{ background: accentColor }}>
                        <Sparkles size={14} color="#fff" />
                      </div>
                    </div>
                    <div className="text-center px-2">
                      <p className="text-sm font-semibold" style={{ color: '#111827' }}>
                        {isAdmin ? 'Analise os seus dados com IA' : 'Estou aqui para ajudar!'}
                      </p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6b7280' }}>
                        {isAdmin
                          ? 'Faca perguntas sobre vendas, parceiros, comissoes e mais'
                          : 'Tire duvidas sobre comissoes, vendas, campanhas e muito mais'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <p className="text-xs font-medium px-1" style={{ color: '#9ca3af' }}>Sugestoes rapidas</p>
                      {suggestions.map(s => (
                        <button
                          key={s}
                          onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50) }}
                          className="rounded-xl px-4 py-2.5 text-left text-xs font-medium transition-colors w-full"
                          style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#374151' }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const text = getMessageText(msg)
                    if (!text) return null
                    const isUser = msg.role === 'user'
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {/* Avatar pequeno nas mensagens do assistente */}
                        {!isUser && (
                          <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0 mb-0.5">
                            <Image src="/assistente.jpg" alt="Sofia" width={28} height={28} className="object-cover w-full h-full" />
                          </div>
                        )}
                        <div
                          className="max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                          style={{
                            background: isUser ? accentColor : '#fff',
                            color: isUser ? '#fff' : '#111827',
                            border: isUser ? 'none' : '1px solid #e5e7eb',
                            borderBottomRightRadius: isUser ? '4px' : '16px',
                            borderBottomLeftRadius: !isUser ? '4px' : '16px',
                            boxShadow: isUser ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                          }}
                        >
                          {text}
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Indicador a pensar */}
                {isStreaming && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0">
                      <Image src="/assistente.jpg" alt="Sofia" width={28} height={28} className="object-cover w-full h-full" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: accentColor, animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: accentColor, animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: accentColor, animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 p-3 flex-shrink-0" style={{ borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={isStreaming}
                  placeholder={isAdmin ? 'Pergunte sobre dados...' : 'Escreva a sua duvida...'}
                  className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none"
                  style={{
                    background: '#f3f4f6',
                    color: '#111827',
                    border: '1px solid transparent',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all"
                  style={{
                    background: !input.trim() || isStreaming ? '#e5e7eb' : accentColor,
                    color: !input.trim() || isStreaming ? '#9ca3af' : '#fff',
                  }}
                  aria-label="Enviar"
                >
                  <Send size={15} />
                </button>
              </div>

              {/* Rodape discreto */}
              <div className="px-4 pb-2 text-center" style={{ background: '#fff' }}>
                <p className="text-xs" style={{ color: '#d1d5db' }}>Powered by IA &middot; Solucoes Diferentes</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
