import type { Metadata } from 'next'
import Link from 'next/link'
import { Zap, Calculator, ArrowRight } from 'lucide-react'
import { ServicePage } from '@/components/website/service-page'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Energia' }

export default async function EnergiaPage() {
  const supabase = await createClient()
  const { data: settings } = await (supabase.from('site_settings') as any)
    .select('energy_simulator_url, primary_color')
    .eq('id', 'main')
    .maybeSingle()

  const simulatorUrl = settings?.energy_simulator_url || null
  const primary = settings?.primary_color || '#0057FF'

  return (
    <>
      <ServicePage
        icon={Zap}
        color="#F59E0B"
        bg="#FFFBEB"
        title="Poupe na sua fatura de Energia"
        subtitle="Serviço de Energia"
        description="Comparamos todas as comercializadoras de eletricidade e gás natural do mercado liberalizado e encontramos a melhor oferta para o seu perfil de consumo — sem qualquer custo."
        benefits={[
          'Comparação imparcial de todas as comercializadoras',
          'Poupança média de 20% a 40% na fatura de energia',
          'Processo simples: nós tratamos de tudo',
          'Sem interrupção de serviço durante a mudança',
          'Acompanhamento pós-contrato incluído',
          'Certificados como intermediários energéticos pela ERSE',
        ]}
        products={[
          { name: 'Eletricidade', desc: 'Tarifários mono-horário, bi-horário e tri-horário para particulares e empresas.' },
          { name: 'Gás Natural', desc: 'Soluções de gás natural para habitação e uso industrial com melhores condições.' },
          { name: 'Energia Renovável', desc: 'Tarifários 100% verdes e soluções de autoconsumo fotovoltaico.' },
          { name: 'Gestão de Energia', desc: 'Análise do perfil de consumo e recomendações de eficiência energética.' },
        ]}
        faqs={[
          { q: 'Qual o custo do serviço?', a: 'O serviço é completamente gratuito para o cliente. Somos remunerados pelas comercializadoras pelo serviço de intermediação.' },
          { q: 'Vou ter corte de luz durante a mudança?', a: 'Não. A mudança de comercializador não implica qualquer interrupção no fornecimento de energia.' },
          { q: 'Quanto posso poupar?', a: 'Em média os nossos clientes poupam entre 20% a 40% na fatura. O valor exato depende do seu perfil de consumo e do tarifário atual.' },
        ]}
      />

      {simulatorUrl && (
        <section className="bg-slate-50 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="grid gap-0 md:grid-cols-[1.2fr_.8fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${primary}14` }}>
                  <Calculator size={24} style={{ color: primary }} />
                </div>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Simule a sua poupança em energia</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Faça uma simulação rápida e veja se existe margem para reduzir a sua fatura. Se quiser apoio, a equipa PARCENDi trata depois da análise consigo.
                </p>
              </div>
              <div className="flex items-center justify-center p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${primary}, #1D4ED8)` }}>
                <Link href={simulatorUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold sm:w-auto" style={{ color: primary }}>
                  Abrir simulador <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
