import type { Metadata } from 'next'
import { Shield } from 'lucide-react'
import { ServicePage } from '@/components/website/service-page'

export const metadata: Metadata = { title: 'Seguros' }

export default function SegurosPage() {
  return (
    <ServicePage
      icon={Shield}
      color="#EF4444"
      bg="#FEF2F2"
      title="Seguros com a melhor cobertura"
      subtitle="Serviço de Seguros"
      description="Corretores de seguros certificados pela ASF. Comparamos as propostas de todas as seguradoras e garantimos a melhor cobertura ao melhor preço para si e para a sua família."
      benefits={[
        'Corretores de seguros licenciados pela ASF',
        'Comparação entre mais de 15 seguradoras nacionais e internacionais',
        'Análise personalizada das suas necessidades de proteção',
        'Preço mais baixo para a mesma cobertura — garantido',
        'Gestão de sinistros incluída sem custo adicional',
        'Renovações automáticas com renegociação anual',
      ]}
      products={[
        { name: 'Seguro de Vida', desc: 'Proteção financeira para si e para a sua família em caso de imprevistos.' },
        { name: 'Seguro Habitação', desc: 'Proteção completa para o seu imóvel contra incêndio, inundações e outros riscos.' },
        { name: 'Seguro Saúde', desc: 'Acesso a cuidados de saúde privados com os melhores planos do mercado.' },
        { name: 'Seguro Automóvel', desc: 'De responsabilidade civil a multirriscos, encontramos a melhor opção para o seu veículo.' },
      ]}
      faqs={[
        { q: 'São corretores de seguros certificados?', a: 'Sim. Estamos registados na ASF (Autoridade de Supervisão de Seguros e Fundos de Pensões) como corretores de seguros, garantindo acesso às melhores condições de mercado.' },
        { q: 'Quando devo contratar um seguro de vida?', a: 'O seguro de vida é especialmente recomendado quando tem dependentes financeiros, crédito habitação ou responsabilidades financeiras a longo prazo.' },
        { q: 'O que acontece se tiver um sinistro?', a: 'A nossa equipa acompanha todo o processo de sinistro, desde a participação até ao recebimento da indemnização, sem qualquer custo adicional.' },
      ]}
    />
  )
}
