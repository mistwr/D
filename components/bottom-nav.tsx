'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, PlusCircle, User, Menu } from 'lucide-react'

interface BottomNavProps {
  userRole?: string
  onMenuClick?: () => void
}

export function BottomNav({ userRole = 'parceiro', onMenuClick }: BottomNavProps) {
  const pathname = usePathname()

  const parceiroItems = [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
    { href: '/vendas/novo', label: 'Nova', icon: PlusCircle, highlight: true },
    { href: '/comissoes', label: 'Comissoes', icon: User },
  ]

  const adminItems = [
    { href: '/admin/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/admin/vendas', label: 'Vendas', icon: ShoppingCart },
    { href: '/admin/parceiros', label: 'Parceiros', icon: User },
  ]

  const items = userRole === 'admin' ? adminItems : parceiroItems

  return (
    <nav className="mobile-bottom-nav">
      {items.map((item) => {
        const active = pathname === item.href
        const isHighlight = 'highlight' in item && item.highlight

        if (isHighlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-1 -mt-5"
            >
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
              >
                <item.icon size={24} className="text-white" />
              </div>
              <span className="text-[10px] mt-1 font-medium" style={{ color: '#f97316' }}>{item.label}</span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-2 transition-colors"
          >
            <item.icon 
              size={22} 
              style={{ color: active ? '#0ea5e9' : '#94a3b8' }} 
            />
            <span 
              className="text-[10px] mt-1 font-medium"
              style={{ color: active ? '#0ea5e9' : '#94a3b8' }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
      <button
        onClick={onMenuClick}
        className="flex-1 flex flex-col items-center justify-center py-2 transition-colors"
      >
        <Menu size={22} style={{ color: '#94a3b8' }} />
        <span className="text-[10px] mt-1 font-medium" style={{ color: '#94a3b8' }}>Mais</span>
      </button>
    </nav>
  )
}
