import Link from 'next/link'
import Image from 'next/image'

export function WebsiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-foreground text-secondary-foreground mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Image
                src="/logo-parcendi.png"
                alt="PARCENDi 5.0"
                width={150}
                height={50}
                className="h-12 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Consultora multisserviços especializada em soluções de Energia, Telecom, Crédito,
              Imobiliário e Seguros para particulares e empresas.
            </p>
            <div className="mt-6 space-y-1 text-sm text-slate-400">
              <p>geral@parcendi.pt</p>
              <p>+351 961 383 587</p>
              <p className="text-xs leading-relaxed max-w-xs">Rua Nova do Seixo 964<br />São Mamede de Infesta<br />Porto, Portugal</p>
            </div>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Serviços</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                { href: '/energia', label: 'Energia' },
                { href: '/telecom', label: 'Telecom' },
                { href: '/credito', label: 'Crédito' },
                { href: '/imobiliario', label: 'Imobiliário' },
                { href: '/seguros', label: 'Seguros' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Empresa</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                { href: '/barcelos', label: 'A PARCENDi' },
                { href: '/unidades', label: 'Unidades' },
                { href: '/contactos', label: 'Contactos' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                { href: '/privacidade', label: 'Privacidade' },
                { href: '/termos', label: 'Termos de Uso' },
                { href: '/rgpd', label: 'RGPD' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {year} PARCENDi. Todos os direitos reservados.</p>
          <p>NIF: 999 999 999 &bull; Membro da ERSE &bull; Licença ANACOM</p>
        </div>
      </div>
    </footer>
  )
}
