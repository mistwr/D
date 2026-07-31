import type { Metadata } from 'next'
import { Home } from 'lucide-react'
import { ServicePage } from '@/components/website/service-page'

export const metadata: Metadata = { title: 'Imobiliário' }

export default function ImobiliarioPage() {
  return (
    <ServicePage
      icon={Home}
      color="#8B5CF6"
      bg="#F5F3FF"
      title="O imóvel certo para si"
      subtitle="Serviço Imobiliário"
      description="Mediação imobiliária com foco total nas suas necessidades. Compramos, vendemos e arrendamos imóveis em todo o país com total transparência e profissionalismo."
      benefits={[
        'Consultores imobiliários certificados AMI',
        'Rede alargada de imóveis em todo o território nacional',
        'Avaliação gratuita do seu imóvel',
        'Apoio jurídico e fiscal incluído',
        'Marketing profissional para venda mais rápida',
        'Negociação especializada em representação do cliente',
      ]}
      products={[
        { name: 'Compra de Imóveis', desc: 'Encontramos o imóvel ideal de acordo com o seu perfil e orçamento.' },
        { name: 'Venda de Imóveis', desc: 'Vendemos o seu imóvel ao melhor preço e no menor prazo possível.' },
        { name: 'Arrendamento', desc: 'Gestão completa do processo de arrendamento para proprietários e inquilinos.' },
        { name: 'Avaliação Imobiliária', desc: 'Avaliação rigorosa do valor de mercado do seu imóvel por peritos certificados.' },
      ]}
      faqs={[
        { q: 'Qual a comissão de mediação imobiliária?', a: 'A nossa comissão é transparente e negociada previamente. Para venda, tipicamente 3% a 5% do valor de venda, pago apenas em caso de sucesso.' },
        { q: 'Trabalham em todo o Portugal?', a: 'Sim. Temos rede de consultores em todo o território nacional, com especial enfoque no Minho e no Grande Porto.' },
        { q: 'Quanto tempo demora a vender um imóvel?', a: 'Em média, os imóveis que mediamos são vendidos em 45 a 90 dias, dependendo da localização, condição e preço do imóvel.' },
      ]}
    />
  )
}
