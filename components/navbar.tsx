'use client'

import { Bell, LogOut, Menu, X, User, LayoutDashboard, ShoppingCart, PlusCircle, Megaphone, FolderOpen, Calculator, Percent, FileCheck, Newspaper, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

interface NavbarProps {
  user: { full_name: string; role: string; email: string } | null
  onLogout?: () => void
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const mobileLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
    { href: '/vendas/novo', label: 'Nova Venda', icon: PlusCircle },
    { href: '/contratos', label: 'Contratos', icon: FileCheck },
    { href: '/comissoes', label: 'Comissoes', icon: Percent },
    { href: '/chargebacks', label: 'Chargebacks', icon: AlertTriangle },
    { href: '/campanhas', label: 'Campanhas', icon: Megaphone },
    { href: '/materiais', label: 'Materiais', icon: FolderOpen },
    { href: '/publicacoes', label: 'Publicacoes', icon: Newspaper },
    { href: '/simulador', label: 'Simulador', icon: Calculator },
  ]

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    if (onLogout) onLogout()
    else window.location.href = '/login'
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 left-64 right-0 z-40 hidden md:flex h-16 items-center justify-between px-6" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold" style={{ color: '#1e293b' }}>
            {user?.role === 'admin' ? 'Painel de Administracao' : 'Portal do Parceiro'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <button className="relative p-2 rounded-full transition-colors hover:bg-slate-100" aria-label="Notificacoes">
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

      {/* Mobile Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex md:hidden h-14 items-center justify-between px-4" style={{ background: '#0f172a' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
            {open ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
          </button>
          <Image src="/logo.jpg" alt="Logo" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold text-white text-sm">Solucoes Diferentes</span>
        </div>
        {user && (
          <button onClick={handleLogout} className="p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.2)' }}>
            <LogOut size={18} style={{ color: '#fca5a5' }} />
          </button>
        )}
      </nav>

      {/* Mobile Menu Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute top-14 left-0 bottom-0 w-72 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
            <nav className="p-4 space-y-1">
              {mobileLinks.map(l => {
                const active = pathname === l.href
                return (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium"
                    style={{ 
                      background: active ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : 'transparent', 
                      color: active ? '#ffffff' : '#94a3b8'
                    }}>
                    <l.icon size={20} />
                    {l.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
