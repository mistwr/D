'use client'

import { Bell, LogOut, Menu, X, User } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

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
    <nav className="fixed top-0 left-64 right-0 z-40 hidden md:flex h-16 items-center justify-between px-6" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold" style={{ color: '#1e293b' }}>
          {user?.role === 'admin' ? 'Painel de Administracao' : 'Portal do Parceiro'}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <button className="relative p-2 rounded-full transition-colors hover:bg-white" aria-label="Notificacoes">
              <Bell size={20} style={{ color: '#64748b' }} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#f97316' }}></span>
            </button>
            <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid #e2e8f0' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                <User size={18} className="text-white" />
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{user.full_name}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>{user.role === 'admin' ? 'Administrador' : 'Parceiro'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:shadow-md" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <LogOut size={16} /> <span className="hidden lg:inline">Sair</span>
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
