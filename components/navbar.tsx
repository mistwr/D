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
      <nav className="sticky top-0 z-40 hidden lg:flex h-16 items-center justify-between px-6" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', minHeight: '4rem' }}>
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-6">
          <Image src="/logo.jpg" alt="Logo" width={48} height={48} className="rounded-lg shadow-md flex-shrink-0" />
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold" style={{ color: '#003d99' }}>
              {user?.role === 'admin' ? 'Painel de Administração' : 'Portal do Parceiro'}
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: '#0066cc' }}>Soluções Diferentes</p>
          </div>
        </div>

        {/* Right: Notifications + User + Logout */}
        {user && (
          <div className="flex items-center gap-6">
            <NotificationsDropdown authFetch={authFetch} />
            
            {/* User Info */}
            <div className="flex items-center gap-4 pl-6" style={{ borderLeft: '1px solid #e2e8f0' }}>
              <Link href={user.role === 'admin' ? '/admin/perfil' : '/perfil'} className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-offset-2 transition-all" style={{ background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)', boxShadow: '0 2px 8px rgba(0, 102, 204, 0.15)' }}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </Link>
              <div className="flex flex-col justify-center">
                <p className="text-sm font-semibold truncate max-w-[200px]" style={{ color: '#1e293b' }}>{user.full_name}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#64748b' }}>{user.role === 'admin' ? 'Administrador' : 'Parceiro'}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95" style={{ background: '#fee2e2', color: '#b91c1c', boxShadow: '0 1px 3px rgba(220, 38, 38, 0.15)' }}>
              <LogOut size={18} /> Sair
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Navbar - with safe area */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex lg:hidden h-16 items-center justify-between px-4 safe-area-top" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setOpen(!open)} 
            className="p-2.5 rounded-lg active:scale-95 transition-transform" 
            style={{ background: '#f0f4f8' }}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} style={{ color: '#003d99' }} /> : <Menu size={20} style={{ color: '#003d99' }} />}
          </button>
          <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="rounded-lg shadow-md" />
          <span className="font-bold text-sm truncate max-w-[140px]" style={{ color: '#003d99' }}>Soluções</span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <NotificationsDropdownMobile authFetch={authFetch} />
              <button onClick={handleLogout} className="p-2.5 rounded-lg active:scale-95 transition-all" style={{ background: '#fee2e2' }} aria-label="Sair">
                <LogOut size={18} style={{ color: '#b91c1c' }} />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu Drawer - Full height with safe areas */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setOpen(false)} 
            aria-hidden="true"
          />
          <div 
            className="absolute top-16 left-0 bottom-0 w-[280px] max-w-[85vw] overflow-y-auto scrollbar-hide" 
            style={{ background: '#ffffff' }}
          >
            {/* User info on mobile */}
            {user && (
              <div className="p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
                <Link href={user.role === 'admin' ? '/admin/perfil' : '/perfil'} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)' }}>
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1e293b' }}>{user.full_name}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>{user.email}</p>
                  </div>
                </Link>
              </div>
            )}

            <nav className="p-2 space-y-1 safe-area-inset">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                {user?.role === 'admin' ? 'Administracao' : 'Menu'}
              </p>
              {mobileLinks.map(l => {
                const active = pathname === l.href
                return (
                  <Link 
                    key={l.href} 
                    href={l.href} 
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium active:scale-[0.98] transition-all"
                    style={{ 
                      background: active ? '#f0f4f8' : 'transparent', 
                      color: active ? '#003d99' : '#64748b'
                    }}
                  >
                    <l.icon size={20} />
                    {l.label}
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 mt-auto border-t" style={{ borderColor: '#e2e8f0' }}>
              <p className="text-xs text-center" style={{ color: '#64748b' }}>Telecomunicacoes & Energia</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
