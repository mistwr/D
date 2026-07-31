import Link from 'next/link'
import { ArrowRight, CheckCircle2, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

interface ServicePageProps {
  icon: LucideIcon
  color: string
  bg: string
  title: string
  subtitle: string
  description: string
  benefits: string[]
  products: { name: string; desc: string }[]
  faqs: { q: string; a: string }[]
}

export function ServicePage({
  icon: Icon,
  color,
  bg,
  title,
  subtitle,
  description,
  benefits,
  products,
  faqs,
}: ServicePageProps) {
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: bg }} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '22' }}>
              <Icon size={24} style={{ color }} />
            </div>
            <span className="font-medium text-sm" style={{ color }}>{subtitle}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-balance mb-5 max-w-2xl">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mb-8">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contactos">
              <Button size="lg" className="text-white gap-2 h-12 px-8" style={{ backgroundColor: color }}>
                Pedir consultoria gratuita <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="tel:+351253000000">
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8">
                <Phone size={18} /> Ligar agora
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Porque escolher a PARCENDi?</h2>
            <ul className="space-y-4">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0" style={{ color }} />
                  <span className="text-muted-foreground leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.name} className="border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                <h3 className="font-semibold mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="bg-secondary py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-10">Perguntas frequentes</h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.q} className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-semibold mb-3">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center bg-foreground rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-slate-300 mb-8 max-w-md mx-auto">
            A nossa equipa está disponível para si. Sem custos, sem compromissos.
          </p>
          <Link href="/contactos">
            <Button size="lg" className="text-white gap-2 h-12 px-8" style={{ backgroundColor: color }}>
              Falar com especialista <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
