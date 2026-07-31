'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/energia', label: 'Energia' },
  { href: '/telecom', label: 'Telecom' },
  { href: '/credito', label: 'Crédito' },
  { href: '/imobiliario', label: 'Imobiliário' },
  { href: '/seguros', label: 'Seguros' },
  { href: '/barcelos', label: 'Barcelos' },
  { href: '/contactos', label: 'Contactos' },
]

export function WebsiteHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo-parcendi.png"
              alt="PARCENDi 5.0"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-brand bg-brand-light'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Área CRM</Button>
            </Link>
            <Link href="/contactos">
              <Button size="sm" className="bg-brand hover:bg-brand-dark text-white">
                Falar com especialista
              </Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-border px-4 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block px-3 py-2 rounded-md text-sm font-medium',
                pathname === link.href
                  ? 'text-brand bg-brand-light'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 space-y-2">
            <Link href="/auth/login" className="block">
              <Button variant="outline" size="sm" className="w-full">Área CRM</Button>
            </Link>
            <Link href="/contactos" className="block">
              <Button size="sm" className="w-full bg-brand hover:bg-brand-dark text-white">
                Falar com especialista
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
