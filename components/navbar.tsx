'use client'

import { Bell, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { MiniChatbot } from '@/components/mini-chatbot'

interface NavbarProps {
  user: { full_name: string; role: string; email: string } | null
  onLogout?: () => void
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    if (onLogout) onLogout()
    else window.location.href = '/login'
  }

  return (
    <>
    {user && (
      <MiniChatbot
        role={user.role as 'admin' | 'parceiro'}
        userName={user.full_name}
      />
    )}
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4 shadow-sm" style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
      <div className="flex items-center gap-3">
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#4338ca' }}>
            <span className="text-sm font-bold text-white">SD</span>
          </div>
          <span className="hidden sm:block text-sm font-bold" style={{ color: '#111827' }}>Solucoes Diferentes</span>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <>
            <Link href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}>
              <Bell size={18} style={{ color: '#6b7280' }} />
            </Link>
            <span className="hidden sm:block text-sm font-medium" style={{ color: '#374151' }}>{user.full_name}</span>
            <span className="hidden sm:block rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: user.role === 'admin' ? '#ede9fe' : '#dbeafe', color: user.role === 'admin' ? '#6d28d9' : '#1e40af' }}>
              {user.role}
            </span>
            <button onClick={handleLogout} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm" style={{ color: '#ef4444' }}>
              <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </>
        )}
      </div>
      </nav>
    </>
  )
}
