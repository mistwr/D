'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, Briefcase, GitBranch, CheckSquare,
  FileText, DollarSign, ArrowLeftRight, RefreshCw, Handshake,
  Building2, ScrollText, Settings, LogOut, ChevronLeft, ChevronRight,
  Zap, Wifi, CreditCard, Home, Shield, Bell, ChevronDown, UserCog,
  Menu, X, Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/lib/supabase/types'
import { initials, fullName } from '@/lib/format'

const mainNav = [
  { href: '/crm/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm/leads', label: 'Leads', icon: Users },
  { href: '/crm/clientes', label: 'Clientes', icon: Briefcase },
  { href: '/crm/negocios', label: 'Negócios', icon: GitBranch },
  { href: '/crm/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/crm/documentos', label: 'Documentos', icon: FileText },
]

const pipelineNav = [
  { href: '/crm/pipeline/energia', label: 'Energia', icon: Zap, color: '#F59E0B' },
  { href: '/crm/pipeline/telecom', label: 'Telecom', icon: Wifi, color: '#3B82F6' },
  { href: '/crm/pipeline/credito', label: 'Crédito', icon: CreditCard, color: '#10B981' },
  { href: '/crm/pipeline/imobiliario', label: 'Imobiliário', icon: Home, color: '#8B5CF6' },
  { href: '/crm/pipeline/seguros', label: 'Seguros', icon: Shield, color: '#EF4444' },
]

const financeNav = [
  { href: '/crm/comissoes', label: 'Comissões', icon: DollarSign },
  { href: '/crm/cross-sell', label: 'Cross-sell', icon: ArrowLeftRight },
  { href: '/crm/renovacoes', label: 'Renovações', icon: RefreshCw },
  { href: '/crm/parceiros', label: 'Parceiros', icon: Handshake },
]

const adminNav = [
  { href: '/crm/site', label: 'Site e Branding', icon: Palette },
  { href: '/crm/utilizadores', label: 'Utilizadores e Permissões', icon: UserCog },
  { href: '/crm/unidades', label: 'Unidades', icon: Building2 },
  { href: '/crm/logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/crm/configuracoes', label: 'Configurações', icon: Settings },
]

interface SidebarProps { profile: Profile | null }

export function CRMSidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pipelinesOpen, setPipelinesOpen] = useState(true)
  const supabase = createClient()

  const isAdmin = Boolean(profile?.role && ['superadmin', 'admin', 'ceo', 'direcao'].includes(profile.role))

  useEffect(() => setMobileOpen(false), [pathname])
  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [mobileOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    toast.success('Sessão terminada')
  }

  const NavItem = ({ href, label, icon: Icon, color }: { href: string; label: string; icon: React.ElementType; color?: string }) => {
    const active = pathname === href || (href !== '/crm/dashboard' && pathname.startsWith(href))
    return (
      <Link href={href} onClick={() => setMobileOpen(false)} className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all md:py-2',
        active ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
        collapsed && 'md:justify-center md:px-2',
      )} title={collapsed ? label : undefined}>
        <Icon size={18} style={color ? { color } : undefined} className={cn('shrink-0', active && !color && 'text-brand')} />
        <span className={cn('truncate', collapsed && 'md:hidden')}>{label}</span>
      </Link>
    )
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
        <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-foreground hover:bg-secondary" aria-label="Abrir menu"><Menu size={22} /></button>
        <Link href="/crm/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">P</div>
          <span className="font-bold tracking-tight">PARCEN<span className="text-blue-500">Di</span></span>
        </Link>
        <Link href="/crm/notificacoes" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary" aria-label="Notificações"><Bell size={20} /></Link>
      </header>

      {mobileOpen && <button type="button" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/45 md:hidden" />}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(86vw,280px)] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'md:static md:h-screen md:translate-x-0 md:shrink-0 md:transition-all',
        collapsed ? 'md:w-16' : 'md:w-60',
      )}>
        <div className={cn('flex items-center justify-between border-b border-sidebar-border p-4', collapsed && 'md:justify-center')}>
          <Link href="/crm/dashboard" onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2', collapsed && 'md:hidden')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">P</div>
            <span className="text-sm font-bold tracking-tight text-white">PARCEN<span className="text-blue-400">Di</span></span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent/50 md:hidden" aria-label="Fechar menu"><X size={20} /></button>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden rounded-md p-1 text-sidebar-foreground/50 hover:bg-sidebar-accent/50 md:block" aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {mainNav.map((item) => <NavItem key={item.href} {...item} />)}
          <button onClick={() => setPipelinesOpen(!pipelinesOpen)} className={cn('mt-4 flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40', collapsed && 'md:hidden')}>
            <span>Pipelines</span><ChevronDown size={12} className={cn('transition-transform', pipelinesOpen && 'rotate-180')} />
          </button>
          {pipelinesOpen && pipelineNav.map((item) => <NavItem key={item.href} {...item} />)}

          <p className={cn('mt-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40', collapsed && 'md:hidden')}>Financeiro</p>
          {financeNav.map((item) => <NavItem key={item.href} {...item} />)}

          {isAdmin && <>
            <p className={cn('mt-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40', collapsed && 'md:hidden')}>Administração</p>
            {adminNav.map((item) => <NavItem key={item.href} {...item} />)}
          </>}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className={cn('flex items-center gap-3', collapsed && 'md:flex-col md:gap-2')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">{profile ? initials(profile.first_name, profile.last_name) : '?'}</div>
            <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <p className="truncate text-xs font-semibold text-sidebar-foreground">{profile ? fullName(profile) : 'Utilizador'}</p>
              <p className="truncate text-xs text-sidebar-foreground/50">{profile?.role}</p>
            </div>
            <button onClick={handleLogout} className="rounded-md p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-red-400" title="Sair"><LogOut size={15} /></button>
          </div>
        </div>
      </aside>
    </>
  )
}
