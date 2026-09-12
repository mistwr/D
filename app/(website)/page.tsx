import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Zap, Wifi, CreditCard, Home, Shield, CheckCircle2, Phone, Star, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroSlideshow } from '@/components/website/hero-slideshow'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'PARCENDi — Consultoria Multisserviços' }

const services = [
  { icon: Zap, title: 'Energia', description: 'Compare tarifários e poupe na sua fatura de eletricidade e gás natural com as melhores comercializadoras.', href: '/energia', color: '#F59E0B', bg: '#FFFBEB' },
  { icon: Wifi, title: 'Telecom', description: 'Pacotes de internet, televisão e telefone adaptados às suas necessidades ao melhor preço do mercado.', href: '/telecom', color: '#3B82F6', bg: '#EFF6FF' },
  { icon: CreditCard, title: 'Crédito', description: 'Crédito habitação, pessoal e consolidação de dívidas com condições vantajosas e aprovação rápida.', href: '/credito', color: '#10B981', bg: '#ECFDF5' },
  { icon: Home, title: 'Imobiliário', description: 'Compra, venda e arrendamento de imóveis com apoio especializado em todas as fases do processo.', href: '/imobiliario', color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: Shield, title: 'Seguros', description: 'Seguros de vida, habitação, saúde e automóvel com a melhor cobertura e prémio do mercado.', href: '/seguros', color: '#EF4444', bg: '#FEF2F2' },
]

const stats = [
  { value: '5.000+', label: 'Clientes satisfeitos' },
  { value: '12', label: 'Anos de experiência' },
  { value: '5', label: 'Áreas de serviço' },
  { value: '98%', label: 'Taxa de satisfação' },
]

const testimonials = [
  { name: 'Maria Oliveira', role: 'Particular', text: 'Consegui poupar 40% na minha fatura de energia. O atendimento foi excecional e o processo muito simples.', rating: 5 },
  { name: 'Carlos Fernandes', role: 'Empresário', text: 'A PARCENDi tratou de toda a burocracia do crédito habitação. Recomendo a toda a gente.', rating: 5 },
  { name: 'Ana Costa', role: 'Particular', text: 'Excelente serviço de telecom. Passei para um pacote muito melhor com menos 30€ por mês.', rating: 5 },
]

export default async function HomePage() {
  const supabase = await createClient()
  const [{ data: settings }, { data: campaigns }] = await Promise.all([
    (supabase.from('site_settings') as any).select('*').eq('id', 'main').maybeSingle(),
    (supabase.from('site_campaigns') as any)
      .select('*')
      .eq('is_active', true)
      .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
      .order('is_featured', { ascending: false })
      .order('position'),
  ])

  const primary = settings?.primary_color || '#0057FF'
  const secondary = settings?.secondary_color || '#0B1220'
  const ctaLabel = settings?.consultation_cta_label || 'Consultoria Gratuita'
  const phone = settings?.phone || '+351 961 383 587'
  const phoneHref = `tel:${String(phone).replace(/\s/g, '')}`
  const visibleCampaigns = (campaigns ?? []).slice(0, 6)

  return (
    <>
      <HeroSlideshow />

      <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(90deg, ${primary}, #2563EB)` }}>
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
            {stats.map((s) => <div key={s.label} className="text-center"><p className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{s.value}</p><p className="mt-2 text-xs font-medium uppercase tracking-wider text-blue-100 sm:text-sm">{s.label}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:mb-14"><h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">Cinco soluções completas</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Um único parceiro para energia, telecom, crédito, imobiliário e seguros — sem complicações.</p></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {services.map((service) => { const Icon = service.icon; return <Link key={service.title} href={service.href} className="group block rounded-2xl border border-border bg-white p-6 transition-all duration-300 hover:border-brand hover:shadow-xl sm:p-8"><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: service.bg }}><Icon size={28} style={{ color: service.color }} /></div><h3 className="mb-3 text-xl font-bold text-foreground">{service.title}</h3><p className="mb-5 text-sm leading-relaxed text-muted-foreground">{service.description}</p><div className="flex items-center gap-2 text-sm font-semibold text-brand">Explorar <ArrowRight size={16} /></div></Link> })}
            <div className="rounded-2xl border-2 border-brand bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8"><h3 className="mb-5 text-xl font-bold text-foreground">Porquê PARCENDi?</h3><ul className="space-y-4 text-sm">{['Serviço 100% gratuito', 'Comparação imparcial', 'Especialistas certificados', 'Acompanhamento pessoal', 'Sem burocracia desnecessária'].map((item) => <li key={item} className="flex items-start gap-3"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-brand" /><span className="font-medium text-foreground">{item}</span></li>)}</ul></div>
          </div>
        </div>
      </section>

      {visibleCampaigns.length > 0 && (
        <section className="bg-slate-50 py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10"><div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: primary }}><Sparkles size={16} /> Campanhas em vigor</div><h2 className="text-3xl font-bold text-foreground sm:text-4xl">Ofertas atuais</h2><p className="mt-2 max-w-2xl text-muted-foreground">Campanhas geridas diretamente pela equipa PARCENDi através do CRM.</p></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleCampaigns.map((campaign: any) => <article key={campaign.id} className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">{campaign.is_featured && <span className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: primary }}>Destaque</span>}<div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{campaign.operator || campaign.segment}</div><h3 className="pr-16 text-xl font-bold text-foreground">{campaign.title}</h3>{campaign.subtitle && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{campaign.subtitle}</p>}{campaign.price != null && <div className="mt-5 text-3xl font-extrabold" style={{ color: primary }}>{Number(campaign.price).toFixed(2).replace('.', ',')}€ <span className="text-sm font-normal text-muted-foreground">{campaign.price_suffix || '/mês'}</span></div>}{Array.isArray(campaign.features) && campaign.features.length > 0 && <ul className="mt-5 space-y-2 text-sm text-foreground">{campaign.features.slice(0, 5).map((feature: string) => <li key={feature} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: primary }} />{feature}</li>)}</ul>}<Link href={campaign.cta_url || '/contactos'} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-bold text-white" style={{ backgroundColor: primary }}>{campaign.cta_label || 'Pedir proposta'}</Link></article>)}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 text-white sm:py-20 lg:py-24" style={{ background: `linear-gradient(135deg, ${secondary}, #1E293B)` }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mb-10 text-center sm:mb-14"><h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Testemunhos de clientes satisfeitos</h2></div><div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-8">{testimonials.map((t) => <div key={t.name} className="rounded-2xl border border-slate-600 bg-slate-700 p-6 sm:p-8"><div className="mb-5 flex gap-1">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />)}</div><p className="mb-6 text-base font-medium leading-relaxed text-white">{t.text}</p><div className="border-t border-slate-600 pt-4"><p className="font-semibold text-white">{t.name}</p><p className="text-sm text-slate-300">{t.role}</p></div></div>)}</div></div>
      </section>

      <section className="relative overflow-hidden py-16 text-white sm:py-20 lg:py-24" style={{ background: `linear-gradient(90deg, ${primary}, #1D4ED8)` }}>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"><h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Pronto para transformar os seus custos?</h2><p className="mx-auto mb-8 mt-5 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-xl">Fale com um especialista PARCENDi. Consultoria gratuita e sem compromisso.</p><div className="flex flex-col justify-center gap-3 sm:flex-row"><Link href="/contactos" className="w-full sm:w-auto"><Button size="lg" className="min-h-12 w-full gap-2 rounded-xl bg-white px-8 font-semibold hover:bg-slate-100 sm:w-auto" style={{ color: primary }}>{ctaLabel} <ArrowRight size={20} /></Button></Link><a href={phoneHref} className="w-full sm:w-auto"><Button size="lg" className="min-h-12 w-full gap-2 rounded-xl border-2 border-white bg-white/15 px-8 font-semibold text-white hover:bg-white/25 sm:w-auto"><Phone size={20} /> {phone}</Button></a></div></div>
      </section>
    </>
  )
}
