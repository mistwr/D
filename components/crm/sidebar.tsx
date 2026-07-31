'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, Briefcase, GitBranch, CheckSquare,
  FileText, DollarSign, ArrowLeftRight, RefreshCw, Handshake,
  Building2, ScrollText, Settings, LogOut, ChevronLeft, ChevronRight,
  Zap, Wifi, CreditCard, Home, Shield, Bell, ChevronDown, UserCog
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
  { href: '/crm/utilizadores', label: 'Utilizadores e Permissões', icon: UserCog },
  { href: '/crm/unidades', label: 'Unidades', icon: Building2 },
  { href: '/crm/logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/crm/configuracoes', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  profile: Profile | null
}

export function CRMSidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [pipelinesOpen, setPipelinesOpen] = useState(true)
  const supabase = createClient()

  const isAdmin = profile?.role && ['superadmin', 'admin', 'ceo', 'direcao'].includes(profile.role)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    toast.success('Sessão terminada')
  }

  const NavItem = ({ href, label, icon: Icon, color }: { href: string; label: string; icon: React.ElementType; color?: string }) => {
    const active = pathname === href || (href !== '/crm/dashboard' && pathname.startsWith(href))
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
          active
            ? 'bg-sidebar-accent text-white'
            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
          collapsed && 'justify-center px-2',
        )}
        title={collapsed ? label : undefined}
      >
        <Icon size={18} style={color ? { color } : undefined} className={cn('shrink-0', active && !color && 'text-brand')} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center justify-between p-4 border-b border-sidebar-border shrink-0', collapsed && 'justify-center')}>
        {!collapsed && (
          <Link href="/crm/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-bold text-sm text-white tracking-tight">
              PARCEN<span className="text-blue-400">Di</span>
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {/* Main */}
        {mainNav.map((item) => <NavItem key={item.href} {...item} />)}

        {/* Pipeline */}
        {!collapsed && (
          <button
            onClick={() => setPipelinesOpen(!pipelinesOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mt-4 hover:text-sidebar-foreground/60 transition-colors"
          >
            <span>Pipelines</span>
            <ChevronDown size={12} className={cn('transition-transform', pipelinesOpen && 'rotate-180')} />
          </button>
        )}
        {collapsed && <div className="my-3 border-t border-sidebar-border" />}
        {pipelinesOpen && pipelineNav.map((item) => <NavItem key={item.href} {...item} />)}

        {/* Finance */}
        {!collapsed && (
          <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mt-4">
            Financeiro
          </p>
        )}
        {collapsed && <div className="my-3 border-t border-sidebar-border" />}
        {financeNav.map((item) => <NavItem key={item.href} {...item} />)}

        {/* Admin */}
        {isAdmin && (
          <>
            {!collapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mt-4">
                Administração
              </p>
            )}
            {collapsed && <div className="my-3 border-t border-sidebar-border" />}
            {adminNav.map((item) => <NavItem key={item.href} {...item} />)}
          </>
        )}
      </nav>

      {/* User */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'flex-col gap-2')}>
          <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {profile ? initials(profile.first_name, profile.last_name) : '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">
                {profile ? fullName(profile) : 'Utilizador'}
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{profile?.role}</p>
            </div>
          )}
          <div className={cn('flex items-center gap-1', collapsed && 'flex-col')}>
            <Link
              href="/crm/notificacoes"
              className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              title="Notificações"
            >
              <Bell size={15} />
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-red-400 hover:bg-sidebar-accent/50 transition-colors"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
