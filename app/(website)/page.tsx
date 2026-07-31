import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Zap, Wifi, CreditCard, Home, Shield, CheckCircle2, Phone, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroSlideshow } from '@/components/website/hero-slideshow'

export const metadata: Metadata = {
  title: 'PARCENDi — Consultoria Multisserviços',
}

const services = [
  {
    icon: Zap,
    title: 'Energia',
    description: 'Compare tarifários e poupe na sua fatura de eletricidade e gás natural com as melhores comercializadoras.',
    href: '/energia',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    icon: Wifi,
    title: 'Telecom',
    description: 'Pacotes de internet, televisão e telefone adaptados às suas necessidades ao melhor preço do mercado.',
    href: '/telecom',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    icon: CreditCard,
    title: 'Crédito',
    description: 'Crédito habitação, pessoal e consolidação de dívidas com condições vantajosas e aprovação rápida.',
    href: '/credito',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    icon: Home,
    title: 'Imobiliário',
    description: 'Compra, venda e arrendamento de imóveis com apoio especializado em todas as fases do processo.',
    href: '/imobiliario',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    icon: Shield,
    title: 'Seguros',
    description: 'Seguros de vida, habitação, saúde e automóvel com a melhor cobertura e prémio do mercado.',
    href: '/seguros',
    color: '#EF4444',
    bg: '#FEF2F2',
  },
]

const stats = [
  { value: '5.000+', label: 'Clientes satisfeitos' },
  { value: '12', label: 'Anos de experiência' },
  { value: '5', label: 'Áreas de serviço' },
  { value: '98%', label: 'Taxa de satisfação' },
]

const testimonials = [
  {
    name: 'Maria Oliveira',
    role: 'Particular',
    text: 'Consegui poupar 40% na minha fatura de energia. O atendimento foi excecional e o processo muito simples.',
    rating: 5,
  },
  {
    name: 'Carlos Fernandes',
    role: 'Empresário',
    text: 'A PARCENDi tratou de toda a burocracia do crédito habitação. Recomendo a toda a gente.',
    rating: 5,
  },
  {
    name: 'Ana Costa',
    role: 'Particular',
    text: 'Excelente serviço de telecom. Passei para um pacote muito melhor com menos 30€ por mês.',
    rating: 5,
  },
]

export default function HomePage() {
  return (
    <>
      {/* HERO SLIDESHOW */}
      <HeroSlideshow />

      {/* STATS - Premium solid background with gradient */}
      <section className="relative bg-gradient-to-r from-brand to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl lg:text-5xl font-bold tracking-tight">{s.value}</p>
                <p className="text-sm text-blue-100 mt-2 font-medium uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES - Premium white background with solid cards */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-balance mb-6 text-foreground">Cinco soluções completas</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Um único parceiro para todas as suas necessidades em intermediação. Energia, telecom, crédito, imobiliário e seguros — sem complicações, sem intermediários desnecessários.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="group block bg-white border border-border rounded-2xl p-8 hover:border-brand hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:-rotate-6"
                    style={{ backgroundColor: service.bg }}
                  >
                    <Icon size={28} style={{ color: service.color }} />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-foreground">{service.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">{service.description}</p>
                  <div className="flex items-center gap-2 text-brand text-sm font-semibold group-hover:gap-3 transition-all">
                    Explorar <ArrowRight size={16} />
                  </div>
                </Link>
              )
            })}

            {/* Why us card - Prominent */}
            <div className="border border-brand border-2 rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-white lg:col-span-1">
              <h3 className="font-bold text-xl mb-6 text-foreground">Porquê PARCENDi?</h3>
              <ul className="space-y-4 text-sm">
                {[
                  'Serviço 100% gratuito',
                  'Comparação imparcial',
                  'Especialistas certificados',
                  'Acompanhamento pessoal',
                  'Sem burocracia desnecessária',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-brand mt-0.5 shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS - Premium dark section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Testemunhos de clientes satisfeitos</h2>
            <p className="text-xl text-slate-300">Mais de 5.000 clientes em todo o país confiam em nós.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-slate-700 rounded-2xl p-8 border border-slate-600 hover:border-white hover:shadow-xl transition-all">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-base leading-relaxed mb-6 text-white font-medium">{t.text}</p>
                <div className="pt-4 border-t border-slate-600">
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-slate-300">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Premium gradient background */}
      <section className="relative bg-gradient-to-r from-brand to-blue-700 text-white overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,.1) 50%, transparent 70%)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance leading-tight">
            Pronto para transformar os seus custos?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Fale com um especialista PARCENDi. Consultoria gratuita, sem compromissos, sem custos ocultos. Encontramos as melhores soluções para sua empresa ou família.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contactos">
              <Button size="lg" className="bg-white hover:bg-slate-100 text-brand gap-2 h-13 px-9 font-semibold text-base rounded-xl">
                Consultoria Gratuita <ArrowRight size={20} />
              </Button>
            </Link>
            <a href="tel:+351253000000">
              <Button size="lg" className="bg-white bg-opacity-20 hover:bg-opacity-30 border-2 border-white text-white h-13 px-9 font-semibold text-base rounded-xl gap-2 transition-all">
                <Phone size={20} /> +351 253 000 000
              </Button>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
