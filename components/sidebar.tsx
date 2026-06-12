'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, PlusCircle, Megaphone, Users, Upload, FolderOpen, FileSpreadsheet, Calculator, Percent, FileCheck, KeyRound, Newspaper, AlertTriangle, Zap, Phone, Network, GitBranch, Shield, Building2, Target, Crown, Circle, User, UserPlus, FileText, FileDown } from 'lucide-react'

interface SidebarUser {
  role: string
  is_superadmin?: boolean
  pode_criar_estrutura?: boolean
  pode_criar_parceiros?: boolean
}

interface SidebarProps { 
  user?: SidebarUser | null
  // Legacy props for backwards compatibility
  userRole?: string
  isSuperAdmin?: boolean
  podeGerir?: boolean 
}

export function Sidebar({ user, userRole, isSuperAdmin = false, podeGerir = false }: SidebarProps) {
  const pathname = usePathname()
  
  // Use new user object or fall back to legacy props
  const role = user?.role ?? userRole ?? 'parceiro'
  const superAdmin = user?.is_superadmin ?? isSuperAdmin
  const canManage = user?.pode_criar_estrutura || user?.pode_criar_parceiros || podeGerir

  // Links base para parceiro
  const parceiroBaseLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/vendas', label: 'As Minhas Vendas', icon: ShoppingCart },
    { href: '/vendas/novo', label: 'Registar Nova Venda', icon: PlusCircle },
    { href: '/leads', label: 'As Minhas Leads', icon: Target },
    { href: '/contratos', label: 'Os Meus Contratos', icon: FileCheck },
    { href: '/comissoes', label: 'As Minhas Comissoes', icon: Percent },
    { href: '/chargebacks', label: 'Chargebacks', icon: AlertTriangle },
    { href: '/campanhas', label: 'Campanhas', icon: Megaphone },
    { href: '/materiais', label: 'Materiais de Apoio', icon: FolderOpen },
    { href: '/publicacoes', label: 'Publicacoes', icon: Newspaper },
    { href: '/simulador', label: 'Simulador', icon: Calculator },
  ]

  // Links adicionais se tem permissao de gerir estrutura
  const parceiroGestorLinks = [
    { href: '/estrutura', label: 'Minha Estrutura', icon: Network },
  ]

  const parceiroLinks = canManage 
    ? [...parceiroBaseLinks, ...parceiroGestorLinks, { href: '/perfil', label: 'Meu Perfil', icon: User }]
    : [...parceiroBaseLinks, { href: '/perfil', label: 'Meu Perfil', icon: User }]

  // Links basicos para todos os admins (incluindo VIP)
  const adminBaseLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/parceiros', label: 'Parceiros', icon: Users },
    { href: '/admin/vendas', label: 'Vendas', icon: ShoppingCart },
    { href: '/admin/chargebacks', label: 'Chargebacks', icon: AlertTriangle },
    { href: '/admin/campanhas', label: 'Campanhas', icon: Megaphone },
    { href: '/admin/materiais', label: 'Materiais de Apoio', icon: FolderOpen },
    { href: '/admin/publicacoes', label: 'Publicacoes', icon: Newspaper },
    { href: '/admin/comissoes', label: 'Comissoes', icon: Percent },
    { href: '/admin/contratos', label: 'Contratos', icon: FileCheck },
    { href: '/admin/estrutura', label: 'Minha Equipa', icon: Network },
    { href: '/admin/online', label: 'Online', icon: Circle },
    { href: '/admin/perfil', label: 'Meu Perfil', icon: User },
  ]

  // Links exclusivos para SuperAdmin
  const superAdminLinks = [
    { href: '/admin/admins-vip', label: 'Admins VIP', icon: Crown },
    { href: '/admin/documentos', label: 'Documentos', icon: Upload },
    { href: '/admin/document-templates', label: 'Templates de Documentos', icon: FileText },
    { href: '/admin/pdf-templates', label: 'Templates PDF', icon: FileDown },
    { href: '/admin/leads-upload', label: 'Base de Dados de Leads', icon: Target },
    { href: '/admin/import', label: 'Import / Export', icon: FileSpreadsheet },
    { href: '/admin/passwords', label: 'Passwords', icon: KeyRound },
    // Enterprise
    { href: '/admin/leads', label: 'Leads (Pipelines)', icon: Target },
    { href: '/admin/pipelines', label: 'Pipelines', icon: GitBranch },
    { href: '/admin/permissoes', label: 'Permissoes', icon: Shield },
    { href: '/admin/unidades', label: 'Unidades/Franquias', icon: Building2 },
  ]

  // Admin VIP só vê links básicos, SuperAdmin vê todos
  const adminLinks = superAdmin 
    ? [...adminBaseLinks, ...superAdminLinks]
    : adminBaseLinks

  const links = role === 'admin' ? adminLinks : parceiroLinks

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col overflow-y-auto shadow-lg" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <Image src="/logo.jpg" alt="Soluções Diferentes" width={48} height={48} className="rounded-lg" />
        <div>
          <p className="font-bold text-white text-sm leading-tight">Soluções</p>
          <p className="font-bold text-sm leading-tight" style={{ color: '#22c55e' }}>Diferentes</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(14,165,233,0.15)' }}>
            <Phone size={16} className="mx-auto mb-1" style={{ color: '#38bdf8' }} />
            <p className="text-xs font-medium" style={{ color: '#38bdf8' }}>Telecom</p>
          </div>
          <div className="rounded-lg p-2.5 text-center" style={{ background: 'rgba(249,115,22,0.15)' }}>
            <Zap size={16} className="mx-auto mb-1" style={{ color: '#fb923c' }} />
            <p className="text-xs font-medium" style={{ color: '#fb923c' }}>Energia</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
          {role === 'admin' ? 'Administracao' : 'Menu'}
        </p>
        {links.map(l => {
          const active = pathname === l.href
          return (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
              style={{ 
                background: active ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : 'transparent', 
                color: active ? '#ffffff' : '#94a3b8',
                boxShadow: active ? '0 4px 12px rgba(14,165,233,0.3)' : 'none'
              }}>
              <l.icon size={18} />
              {l.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <p className="text-xs text-center" style={{ color: '#64748b' }}>Telecomunicações & Energia</p>
      </div>
    </aside>
  )
}
