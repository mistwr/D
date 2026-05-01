'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Bot, X, Send, Minimize2, Maximize2, Loader2, ChevronDown } from 'lucide-react'

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
  const accentLight = isAdmin ? '#eef2ff' : '#f0f9ff'

  const suggestions = isAdmin
    ? ['Resumo de vendas hoje', 'Parceiros com mais vendas', 'Vendas por operadora']
    : ['Como funciona a minha comissao?', 'Ver as minhas vendas', 'Como registar uma venda?']

  function getMessageText(msg: any): string {
    if (!msg.parts || !Array.isArray(msg.parts)) return ''
    return msg.parts
      .filter((p: any): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p: any) => p.text)
      .join('')
  }

  return (
    <>
      {/* Botao flutuante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: accentColor, color: '#fff' }}
          aria-label="Abrir assistente"
        >
          <Bot size={20} />
          <span className="text-sm font-medium hidden sm:inline">
            {isAdmin ? 'Analise IA' : 'Assistente'}
          </span>
        </button>
      )}

      {/* Janela do chat */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl transition-all"
          style={{
            width: '360px',
            height: minimized ? '56px' : '500px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: accentColor }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Bot size={16} color="#fff" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">
                  {isAdmin ? 'Analise de Dados' : 'Assistente'}
                </p>
                {!minimized && (
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {isAdmin ? 'Consultas e analises em tempo real' : `Ola, ${userName || 'parceiro'}!`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(m => !m)}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                {minimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f9fafb' }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: accentLight }}>
                      <Bot size={24} style={{ color: accentColor }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium" style={{ color: '#111827' }}>
                        {isAdmin ? 'Analise os seus dados' : 'Como posso ajudar?'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                        {isAdmin
                          ? 'Faca perguntas sobre vendas, parceiros e comissoes'
                          : 'Tire duvidas sobre comissoes, vendas e campanhas'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      {suggestions.map(s => (
                        <button
                          key={s}
                          onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50) }}
                          className="rounded-lg px-3 py-2 text-left text-xs transition-colors w-full"
                          style={{ background: '#fff', border: `1px solid #e5e7eb`, color: '#374151' }}
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
                      <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                          style={{
                            background: isUser ? accentColor : '#fff',
                            color: isUser ? '#fff' : '#111827',
                            border: isUser ? 'none' : '1px solid #e5e7eb',
                            borderBottomRightRadius: isUser ? '4px' : undefined,
                            borderBottomLeftRadius: !isUser ? '4px' : undefined,
                          }}
                        >
                          {text}
                        </div>
                      </div>
                    )
                  })
                )}

                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: '#fff', border: '1px solid #e5e7eb', borderBottomLeftRadius: '4px' }}>
                      <Loader2 size={14} style={{ color: accentColor }} className="animate-spin" />
                      <span className="text-xs" style={{ color: '#6b7280' }}>A pensar...</span>
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
                  className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
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
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
