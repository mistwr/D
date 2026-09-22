'use client'

import Link from 'next/link'
import { LuminBrand } from './lumin-brand'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, PlusCircle, Megaphone, Users, Upload, FolderOpen, FileSpreadsheet, Calculator, Percent, FileCheck, KeyRound, Newspaper, AlertTriangle, Zap, Phone, Network, GitBranch, Shield, Building2, Target, Crown, Circle, User, UserPlus, FileText, FileDown, Facebook, PhoneCall, ExternalLink, Bot, Sparkles } from 'lucide-react'

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
    { href: '/admin/facebook-leads', label: 'Facebook Leads', icon: Facebook },
    { href: '/admin/alertas', label: 'Centro de Alertas', icon: AlertTriangle },
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
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col overflow-y-auto shadow-lg" style={{ background: 'linear-gradient(180deg, #050812 0%, #0b0a08 58%, #11100d 100%)' }}>
      {/* Lumin AI + cliente */}
      <div className="p-5 border-b" style={{ borderColor: 'rgba(231,185,95,0.16)' }}>
        <LuminBrand inverse />
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
                background: active ? 'linear-gradient(135deg, #f1cf76 0%, #d6a84b 100%)' : 'transparent', 
                color: active ? '#17130b' : '#a7a29a',
                boxShadow: active ? '0 6px 18px rgba(214,168,75,0.22)' : 'none'
              }}>
              <l.icon size={18} />
              {l.label}
            </Link>
          )
        })}
      </nav>

      {/* Lumin AI - value first, no hard sell */}
      <div className="px-4 pb-2 space-y-2">
        <a
          href="https://rebornaaqi.vercel.app/?utm_source=crm_solucoes&utm_medium=partner&utm_campaign=lumin_growth&utm_content=sidebar_robot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200"
          style={{ background: 'rgba(231,185,95,0.10)', color: '#f1cf76', border: '1px solid rgba(231,185,95,0.22)' }}
        >
          <span className="flex items-center gap-2"><Bot size={17} /> Falar com o Lumin</span>
          <ExternalLink size={14} style={{ opacity: 0.8 }} />
        </a>
        <a
          href="https://luminai.pt/simulacao-gratis/?utm_source=crm_solucoes&utm_medium=partner&utm_campaign=lumin_growth&utm_content=sidebar_simulacao"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
          style={{ color: '#b8b0a2' }}
        >
          <span className="flex items-center gap-2"><Sparkles size={16} /> Simulação grátis</span>
          <ExternalLink size={13} style={{ opacity: 0.65 }} />
        </a>
      </div>

      {/* SD Dialer */}
      <div className="px-4 pb-2">
        <a
          href="https://imaginative-flan-e3a8a5.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#ffffff', boxShadow: '0 4px 12px rgba(34,197,94,0.25)' }}
        >
          <span className="flex items-center gap-2">
            <PhoneCall size={17} /> SD Dialer
          </span>
          <ExternalLink size={14} style={{ opacity: 0.85 }} />
        </a>
      </div>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <a href="https://luminai.pt/?utm_source=crm_solucoes&utm_medium=partner&utm_campaign=lumin_growth&utm_content=sidebar_brand" target="_blank" rel="noopener noreferrer" className="block text-[11px] text-center hover:opacity-90" style={{ color: '#8c816d' }}>Lumin AI · CRM Soluções Diferentes</a>
      </div>
    </aside>
  )
}
