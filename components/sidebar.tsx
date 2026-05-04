'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, PlusCircle, Megaphone, Send, Users, FileText, Upload, FolderOpen, FileSpreadsheet, Calculator, Percent, FileCheck, KeyRound, Newspaper } from 'lucide-react'

interface SidebarProps { userRole: string }

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const parceiroLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/vendas', label: 'As Minhas Vendas', icon: ShoppingCart },
    { href: '/vendas/novo', label: 'Registar Nova Venda', icon: PlusCircle },
    { href: '/contratos', label: 'Os Meus Contratos', icon: FileCheck },
    { href: '/comissoes', label: 'As Minhas Comissoes', icon: Percent },
    { href: '/campanhas', label: 'Campanhas', icon: Megaphone },
    { href: '/materiais', label: 'Materiais de Apoio', icon: FolderOpen },
    { href: '/publicacoes', label: 'Publicacoes', icon: Newspaper },
    { href: '/simulador', label: 'Simulador', icon: Calculator },
  ]

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/parceiros', label: 'Parceiros', icon: Users },
    { href: '/admin/vendas', label: 'Vendas', icon: ShoppingCart },
    { href: '/admin/campanhas', label: 'Campanhas', icon: Megaphone },
    { href: '/admin/materiais', label: 'Materiais de Apoio', icon: FolderOpen },
    { href: '/admin/publicacoes', label: 'Publicacoes', icon: Newspaper },
    { href: '/admin/comissoes', label: 'Comissoes', icon: Percent },
    { href: '/admin/contratos', label: 'Contratos', icon: FileCheck },
    { href: '/admin/documentos', label: 'Documentos', icon: Upload },
    { href: '/admin/import', label: 'Import / Export', icon: FileSpreadsheet },
    { href: '/admin/passwords', label: 'Passwords', icon: KeyRound },
  ]

  const links = userRole === 'admin' ? adminLinks : parceiroLinks

  return (
    <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 flex-col overflow-y-auto" style={{ background: '#ffffff', borderRight: '1px solid #e5e7eb' }}>
      <nav className="flex flex-col gap-1 p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
          {userRole === 'admin' ? 'Administracao' : 'Menu'}
        </p>
        {links.map(l => {
          const active = pathname === l.href
          return (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{ background: active ? '#eef2ff' : 'transparent', color: active ? '#4338ca' : '#374151' }}>
              <l.icon size={18} />
              {l.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
