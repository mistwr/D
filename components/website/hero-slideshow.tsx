'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Phone, Zap, Wifi, CreditCard, Home, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Slide = {
  image: string
  segment: string
  icon: React.ElementType
  color: string
  title: string
  highlight: string
  description: string
  href: string
}

const slides: Slide[] = [
  {
    image: '/hero/energia.png',
    segment: 'Energia',
    icon: Zap,
    color: '#F59E0B',
    title: 'Poupe na sua fatura de',
    highlight: 'energia',
    description: 'Comparamos as melhores comercializadoras de eletricidade e gás natural para reduzir os seus custos até 40%.',
    href: '/energia',
  },
  {
    image: '/hero/telecom.png',
    segment: 'Telecom',
    icon: Wifi,
    color: '#3B82F6',
    title: 'Internet e TV ao melhor',
    highlight: 'preço',
    description: 'Pacotes de internet, televisão e telefone adaptados às suas necessidades, sem pagar a mais.',
    href: '/telecom',
  },
  {
    image: '/hero/credito.png',
    segment: 'Crédito',
    icon: CreditCard,
    color: '#10B981',
    title: 'Crédito com condições',
    highlight: 'vantajosas',
    description: 'Crédito habitação, pessoal e consolidação de dívidas com aprovação rápida e taxas competitivas.',
    href: '/credito',
  },
  {
    image: '/hero/imobiliario.png',
    segment: 'Imobiliário',
    icon: Home,
    color: '#8B5CF6',
    title: 'Encontre o imóvel dos seus',
    highlight: 'sonhos',
    description: 'Compra, venda e arrendamento com apoio especializado em todas as fases do processo.',
    href: '/imobiliario',
  },
  {
    image: '/hero/seguros.png',
    segment: 'Seguros',
    icon: Shield,
    color: '#EF4444',
    title: 'Proteja o que é',
    highlight: 'importante',
    description: 'Seguros de vida, habitação, saúde e automóvel com a melhor cobertura e prémio do mercado.',
    href: '/seguros',
  },
]

const SLIDE_DURATION = 6000

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [next, paused])

  return (
    <section
      className="relative h-[85vh] min-h-[600px] max-h-[900px] overflow-hidden bg-foreground text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel"
      aria-label="Serviços PARCENDi"
    >
      {/* Background images */}
      {slides.map((slide, i) => (
        <div
          key={slide.segment}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000 ease-in-out',
            i === current ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={i !== current}
        >
          <div
            className={cn(
              'absolute inset-0 bg-cover bg-center transition-transform ease-out',
              i === current ? 'scale-105' : 'scale-100',
            )}
            style={{
              backgroundImage: `url(${slide.image})`,
              transitionDuration: `${SLIDE_DURATION + 1000}ms`,
            }}
          />
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/80 to-foreground/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white border-0 rounded-full px-4 py-1.5 text-sm mb-6 shadow-lg font-semibold text-foreground">
            <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
            Soluções Integradas 360°
          </div>

          {slides.map((slide, i) => {
            const Icon = slide.icon
            return (
              <div
                key={slide.segment}
                className={cn(
                  'transition-all duration-700',
                  i === current ? 'block opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4',
                )}
              >
                <div className="flex items-center gap-2 mb-6">
                  <span
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-lg"
                    style={{ backgroundColor: slide.color }}
                  >
                    <Icon size={18} />
                    {slide.segment}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-balance mb-5">
                  {slide.title}{' '}
                  <span style={{ color: slide.color }}>{slide.highlight}</span>
                </h1>
                <p className="text-lg text-slate-200 leading-relaxed max-w-xl mb-8">
                  {slide.description}
                </p>
              </div>
            )
          })}

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contactos">
              <Button size="lg" className="bg-brand hover:bg-brand-dark text-white gap-2 h-12 px-8 w-full sm:w-auto">
                Falar com especialista <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="tel:+351253000000">
              <Button
                size="lg"
                className="border-2 border-white bg-white bg-opacity-10 text-white hover:bg-opacity-20 h-12 px-8 gap-2 w-full sm:w-auto font-semibold transition-all"
              >
                <Phone size={18} /> +351 253 000 000
              </Button>
            </a>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-4 sm:left-6 lg:left-8 flex items-center gap-3">
          {slides.map((slide, i) => (
            <button
              key={slide.segment}
              onClick={() => setCurrent(i)}
              className="group flex items-center gap-2"
              aria-label={`Ver ${slide.segment}`}
              aria-current={i === current}
            >
              <span
                className={cn(
                  'block h-1 rounded-full transition-all duration-500',
                  i === current ? 'w-10' : 'w-5 bg-white/40 group-hover:bg-white/60',
                )}
                style={i === current ? { backgroundColor: slide.color } : undefined}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
