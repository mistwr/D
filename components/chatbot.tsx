'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react'

function getMessageText(parts: any[]): string {
  if (!parts || !Array.isArray(parts)) return ''
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('')
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chatbot' }),
  })

  const isStreaming = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return
    sendMessage({ text })
    setInput('')
  }

  return (
    <>
      {/* Botao flutuante */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          width: 60, height: 60,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)',
          boxShadow: '0 8px 32px rgba(30,58,95,0.4)',
        }}
        aria-label={open ? 'Fechar chatbot' : 'Abrir assistente'}
      >
        {open
          ? <ChevronDown size={24} color="white" />
          : <MessageCircle size={24} color="white" />
        }
        {!open && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full animate-pulse"
            style={{ background: '#22c55e', border: '2px solid white' }} />
        )}
      </button>

      {/* Janela do chat */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 flex flex-col overflow-hidden rounded-2xl"
          style={{
            width: 360,
            height: 520,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            border: '1px solid rgba(255,255,255,0.15)',
            background: '#fff',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)' }}>
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/30">
                <Image
                  src="/chatbot-avatar.jpg"
                  alt="Sofia - Assistente Virtual"
                  width={40} height={40}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Sofia</p>
              <p className="text-xs text-blue-200 leading-tight">Assistente Virtual</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/10 transition-colors">
              <X size={16} color="white" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: '#f8fafc' }}>
            {/* Mensagem inicial */}
            {messages.length === 0 && (
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                  <Image src="/chatbot-avatar.jpg" alt="Sofia" width={28} height={28} className="object-cover" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]"
                  style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <p className="text-sm" style={{ color: '#374151' }}>
                    Ola! Sou a Sofia, a sua assistente virtual. Como posso ajudar?
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const text = getMessageText(msg.parts as any[])
              const isUser = msg.role === 'user'
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isUser && (
                    <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0">
                      <Image src="/chatbot-avatar.jpg" alt="Sofia" width={28} height={28} className="object-cover" />
                    </div>
                  )}
                  <div
                    className="rounded-2xl px-3 py-2 max-w-[80%] text-sm leading-relaxed"
                    style={isUser
                      ? { background: 'linear-gradient(135deg, #1e3a5f, #2d6a9f)', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: '#fff', color: '#374151', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderBottomLeftRadius: 4 }
                    }
                  >
                    {text || <span className="opacity-50 italic">...</span>}
                  </div>
                </div>
              )
            })}

            {/* Indicador de digitacao */}
            {isStreaming && (
              <div className="flex items-end gap-2">
                <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0">
                  <Image src="/chatbot-avatar.jpg" alt="Sofia" width={28} height={28} className="object-cover" />
                </div>
                <div className="rounded-2xl rounded-bl-sm px-3 py-2"
                  style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full animate-bounce"
                        style={{ background: '#9ca3af', animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 border-t flex-shrink-0"
            style={{ borderColor: '#e5e7eb', background: '#fff' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escreva a sua mensagem..."
              disabled={isStreaming}
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none transition-all"
              style={{
                background: '#f3f4f6',
                color: '#111827',
                border: '1.5px solid transparent',
              }}
              onFocus={e => { e.target.style.border = '1.5px solid #2d6a9f'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.border = '1.5px solid transparent'; e.target.style.background = '#f3f4f6' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all"
              style={{
                width: 36, height: 36,
                background: !input.trim() || isStreaming ? '#e5e7eb' : 'linear-gradient(135deg, #1e3a5f, #2d6a9f)',
                cursor: !input.trim() || isStreaming ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={15} color={!input.trim() || isStreaming ? '#9ca3af' : '#fff'} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
