'use client'

import { LogOut, Menu, X, User, LayoutDashboard, ShoppingCart, PlusCircle, Megaphone, FolderOpen, Calculator, Percent, FileCheck, Newspaper, AlertTriangle, Users, Upload, FileSpreadsheet, KeyRound, Target, Network, GitBranch, Shield, Building2, Circle } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { NotificationsDropdown, NotificationsDropdownMobile } from './notifications-dropdown'
import { createClient } from '@/lib/supabase/client'

interface NavbarProps {
  user: { full_name: string; role: string; email: string; id?: string; avatar_url?: string } | null
  onLogout?: () => void
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null)

  // Auth fetch helper
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const headers: Record<string, string> = { ...(options.headers as Record<string, string> ?? {}) }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(url, { ...options, credentials: 'include', headers })
  }, [])

  // Update presence heartbeat
  useEffect(() => {
    if (!user?.id) return
    const updatePresence = async () => {
      try {
        await authFetch('/api/presence', { method: 'POST' })
      } catch (e) { /* ignore */ }
    }
    updatePresence()
    const interval = setInterval(updatePresence, 30000) // Every 30s
    return () => clearInterval(interval)
  }, [user?.id, authFetch])
  
  // Close menu on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const parceiroLinks = [
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

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/parceiros', label: 'Parceiros', icon: Users },
    { href: '/admin/vendas', label: 'Vendas', icon: ShoppingCart },
    { href: '/admin/chargebacks', label: 'Chargebacks', icon: AlertTriangle },
    { href: '/admin/campanhas', label: 'Campanhas', icon: Megaphone },
    { href: '/admin/materiais', label: 'Materiais', icon: FolderOpen },
    { href: '/admin/publicacoes', label: 'Publicacoes', icon: Newspaper },
    { href: '/admin/comissoes', label: 'Comissoes', icon: Percent },
    { href: '/admin/contratos', label: 'Contratos', icon: FileCheck },
    { href: '/admin/documentos', label: 'Documentos', icon: Upload },
    { href: '/admin/import', label: 'Import/Export', icon: FileSpreadsheet },
    { href: '/admin/passwords', label: 'Passwords', icon: KeyRound },
    { href: '/admin/leads', label: 'Leads', icon: Target },
    { href: '/admin/estrutura', label: 'Estrutura', icon: Network },
    { href: '/admin/pipelines', label: 'Pipelines', icon: GitBranch },
    { href: '/admin/permissoes', label: 'Permissoes', icon: Shield },
    { href: '/admin/unidades', label: 'Unidades', icon: Building2 },
    { href: '/admin/online', label: 'Online', icon: Circle },
  ]

  const mobileLinks = user?.role === 'admin' ? adminLinks : parceiroLinks

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    if (onLogout) onLogout()
    else window.location.href = '/login'
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-0 left-64 right-0 z-40 hidden md:flex h-16 items-center justify-between px-4 lg:px-6" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-base lg:text-lg font-semibold truncate" style={{ color: '#1e293b' }}>
            {user?.role === 'admin' ? 'Painel de Administracao' : 'Portal do Parceiro'}
          </h1>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          {user && (
            <>
              <NotificationsDropdown authFetch={authFetch} />
              <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4" style={{ borderLeft: '1px solid #e2e8f0' }}>
                <Link href={user.role === 'admin' ? '/admin/perfil' : '/perfil'} className="w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-sky-500 transition-all" style={{ background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Avatar" width={36} height={36} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <User size={16} className="text-white lg:hidden" />
                      <User size={18} className="text-white hidden lg:block" />
                    </>
                  )}
                </Link>
                <div className="hidden xl:block">
                  <p className="text-sm font-semibold truncate max-w-[150px]" style={{ color: '#1e293b' }}>{user.full_name}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{user.role === 'admin' ? 'Administrador' : 'Parceiro'}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg px-3 lg:px-4 py-2 text-sm font-medium transition-all hover:shadow-md" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <LogOut size={16} /> <span className="hidden lg:inline">Sair</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Navbar - with safe area */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex md:hidden h-14 items-center justify-between px-3 safe-area-top" style={{ background: '#0f172a' }}>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setOpen(!open)} 
            className="p-2 rounded-lg active:scale-95 transition-transform" 
            style={{ background: 'rgba(255,255,255,0.1)' }}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
          </button>
          <Image src="/logo.jpg" alt="Logo" width={28} height={28} className="rounded-lg" />
          <span className="font-semibold text-white text-sm truncate max-w-[140px]">Soluções Diferentes</span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <NotificationsDropdownMobile authFetch={authFetch} />
              <button onClick={handleLogout} className="p-2 rounded-lg active:scale-95 transition-transform" style={{ background: 'rgba(239,68,68,0.2)' }} aria-label="Sair">
                <LogOut size={18} style={{ color: '#fca5a5' }} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu Drawer - Full height with safe areas */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setOpen(false)} 
            aria-hidden="true"
          />
          <div 
            className="absolute top-14 left-0 bottom-0 w-[280px] max-w-[85vw] overflow-y-auto scrollbar-hide" 
            style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
          >
            {/* User info on mobile */}
            {user && (
              <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <Link href={user.role === 'admin' ? '/admin/perfil' : '/perfil'} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                    <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{user.email}</p>
                  </div>
                </Link>
              </div>
            )}

            <nav className="p-3 space-y-1 safe-area-inset">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                {user?.role === 'admin' ? 'Administracao' : 'Menu'}
              </p>
              {mobileLinks.map(l => {
                const active = pathname === l.href
                return (
                  <Link 
                    key={l.href} 
                    href={l.href} 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium active:scale-[0.98] transition-all"
                    style={{ 
                      background: active ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : 'transparent', 
                      color: active ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    <l.icon size={20} />
                    {l.label}
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 mt-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-center" style={{ color: '#64748b' }}>Telecomunicacoes & Energia</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
