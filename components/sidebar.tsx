'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, PlusCircle, Megaphone, Users, Upload, FolderOpen, FileSpreadsheet, Calculator, Percent, FileCheck, KeyRound, Newspaper, AlertTriangle, Network, GitBranch, Shield, Building2, Target, Crown, Circle, User, UserPlus, FileText, FileDown } from 'lucide-react'

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
    <aside className="hidden lg:flex lg:w-64 lg:shrink-0 flex-col overflow-y-auto shadow-xl sticky top-0 h-screen z-10" style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0f172a 50%, #1a2847 100%)', borderRight: '2px solid #0066cc' }}>
      {/* Logo - mesma altura da Navbar (h-16 = 4rem) */}
      <div className="flex h-16 items-center gap-3 px-5 border-b flex-shrink-0" style={{ borderColor: 'rgba(0, 102, 204, 0.2)', minHeight: '4rem' }}>
        <Image src="/logo.jpg" alt="Soluções Diferentes" width={48} height={48} className="rounded-lg shadow-lg" />
        <div>
          <p className="font-bold text-white text-sm leading-tight">Soluções</p>
          <p className="font-bold text-sm leading-tight" style={{ color: '#22c55e' }}>Diferentes</p>
        </div>
      </div>

      {/* Quick Stats removido - sidebar limpa e profissional */}

      <nav className="flex-1 flex flex-col gap-1.5 p-4 overflow-y-auto">
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#0066cc', letterSpacing: '0.1em' }}>
          {role === 'admin' ? 'Administração' : 'Menu'}
        </p>
        {links.map(l => {
          const active = pathname === l.href
          return (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-semibold transition-all duration-300"
              style={{ 
                background: active ? 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)' : 'transparent', 
                color: active ? '#ffffff' : '#cbd5e1',
                boxShadow: active ? '0 8px 16px rgba(0, 102, 204, 0.25)' : 'none',
                borderLeft: active ? '3px solid #22c55e' : '3px solid transparent',
                paddingLeft: active ? 'calc(0.875rem - 3px)' : '0.875rem'
              }}>
              <l.icon size={20} />
              <span>{l.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer - Premium */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(0, 102, 204, 0.2)', background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.05) 0%, rgba(0, 82, 163, 0.02) 100%)' }}>
        <p className="text-xs text-center font-medium" style={{ color: '#0066cc' }}>Telecomunicações & Energia</p>
      </div>
    </aside>
  )
}
