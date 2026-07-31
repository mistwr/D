import type { Metadata } from 'next'
import { CreditCard } from 'lucide-react'
import { ServicePage } from '@/components/website/service-page'

export const metadata: Metadata = { title: 'Crédito' }

export default function CreditoPage() {
  return (
    <ServicePage
      icon={CreditCard}
      color="#10B981"
      bg="#ECFDF5"
      title="Crédito com as melhores condições"
      subtitle="Serviço de Crédito"
      description="Intermediários de crédito certificados pelo Banco de Portugal. Comparamos as propostas de todas as instituições financeiras e garantimos as melhores condições para o seu financiamento."
      benefits={[
        'Intermediários registados no Banco de Portugal (Reg. nº XXXXX)',
        'Acesso a propostas de mais de 20 instituições financeiras',
        'Processo 100% digital com aprovação rápida',
        'Análise gratuita da sua situação financeira',
        'Negociação das melhores taxas de juro',
        'Acompanhamento até ao escriturário',
      ]}
      products={[
        { name: 'Crédito Habitação', desc: 'Taxa fixa, variável ou mista. Análise personalizada para a compra da sua casa.' },
        { name: 'Crédito Pessoal', desc: 'Para férias, obras, automóvel ou qualquer outro objetivo pessoal.' },
        { name: 'Crédito Automóvel', desc: 'Financiamento de viatura nova ou usada com condições competitivas.' },
        { name: 'Consolidação de Créditos', desc: 'Reduza a sua prestação mensal juntando todos os seus créditos num só.' },
      ]}
      faqs={[
        { q: 'São intermediários de crédito certificados?', a: 'Sim. Estamos registados no Banco de Portugal como intermediários de crédito vinculados, garantindo total conformidade regulatória.' },
        { q: 'Qual o custo do serviço?', a: 'A análise e comparação são gratuitas. Em caso de aprovação, aplicamos uma comissão de sucesso que está sempre detalhada na FINE (Ficha de Informação Normalizada Europeia).' },
        { q: 'Quanto tempo demora o processo de crédito habitação?', a: 'O processo completo demora em média 4 a 8 semanas, desde a submissão dos documentos até à escritura.' },
      ]}
    />
  )
}
