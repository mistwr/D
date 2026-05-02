'use client'

import { Bell, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4 shadow-sm" style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
      <div className="flex items-center gap-3">
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2">
          <Image
            src="/logo-mypoupar.png"
            alt="MyPoupar+"
            width={120}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <>
            <Link href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} aria-label="Notificacoes">
              <Bell size={18} style={{ color: '#6b7280' }} />
            </Link>
            <span className="hidden sm:block text-sm font-medium" style={{ color: '#374151' }}>{user.full_name}</span>
            <span className="hidden sm:block rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: user.role === 'admin' ? '#ede9fe' : '#dcfce7', color: user.role === 'admin' ? '#6d28d9' : '#166534' }}>
              {user.role === 'admin' ? 'Admin' : 'Parceiro'}
            </span>
            <button onClick={handleLogout} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm" style={{ color: '#ef4444' }}>
              <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
