import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Users, Award, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'A PARCENDi — Barcelos' }

const milestones = [
  { year: '2012', event: 'Fundação da PARCENDi em Barcelos' },
  { year: '2014', event: 'Certificação como Intermediário Energético pela ERSE' },
  { year: '2016', event: 'Registo no Banco de Portugal como Intermediário de Crédito' },
  { year: '2018', event: 'Licença ASF como Corretor de Seguros' },
  { year: '2020', event: 'Lançamento do serviço de Mediação Imobiliária (licença AMI)' },
  { year: '2024', event: 'Mais de 5.000 clientes e expansão para todo o território nacional' },
]

const values = [
  { icon: Users, title: 'Foco no Cliente', desc: 'O cliente é sempre o centro de tudo o que fazemos. O nosso sucesso é medido pela satisfação das pessoas que servimos.' },
  { icon: Award, title: 'Excelência', desc: 'Certificamos a nossa equipa constantemente e seguimos os mais altos padrões de qualidade em todos os serviços.' },
  { icon: MapPin, title: 'Proximidade', desc: 'Nascemos em Barcelos e orgulhamo-nos das raízes locais, mas servimos clientes em todo o Portugal.' },
  { icon: Clock, title: 'Disponibilidade', desc: 'Estamos sempre disponíveis para os nossos clientes, antes, durante e após a contratação de qualquer serviço.' },
]

export default function BarcelosPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-brand text-sm font-medium mb-4">
              <MapPin size={16} /> Barcelos, Portugal
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-5 text-balance">
              A PARCENDi — quem somos
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Somos uma consultora multisserviços com sede em Barcelos, especializada em Energia,
              Telecom, Crédito, Imobiliário e Seguros. Fundada em 2012, a nossa missão é simplificar
              a vida dos portugueses, encontrando as melhores soluções para cada necessidade.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold mb-10 text-center">Os nossos valores</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => {
            const Icon = v.icon
            return (
              <div key={v.title} className="border border-border rounded-xl p-6">
                <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand" />
                </div>
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-secondary py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">A nossa história</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-8">
              {milestones.map((m) => (
                <div key={m.year} className="flex gap-6 items-start">
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 bg-brand rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{m.year}</span>
                  </div>
                  <div className="pt-4">
                    <p className="font-medium">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Pronto para conhecer-nos?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Visite-nos em Barcelos ou fale com a nossa equipa. Estamos disponíveis para si.
        </p>
        <Link href="/contactos">
          <Button size="lg" className="bg-brand hover:bg-brand-dark text-white gap-2 h-12 px-8">
            Contactar agora <ArrowRight size={18} />
          </Button>
        </Link>
      </section>
    </>
  )
}
