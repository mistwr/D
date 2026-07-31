import type { Metadata } from 'next'
import { Wifi } from 'lucide-react'
import { ServicePage } from '@/components/website/service-page'

export const metadata: Metadata = { title: 'Telecom' }

export default function TelecomPage() {
  return (
    <ServicePage
      icon={Wifi}
      color="#3B82F6"
      bg="#EFF6FF"
      title="As melhores ofertas de Telecom"
      subtitle="Serviço de Telecom"
      description="Comparamos os pacotes de internet, televisão e telefone de todos os operadores e negociamos condições exclusivas para si, com foco na melhor relação qualidade-preço."
      benefits={[
        'Comparação entre todos os operadores: NOS, Vodafone, MEO e outros',
        'Negociação de condições exclusivas não disponíveis ao público',
        'Análise do perfil de utilização para recomendar o pacote ideal',
        'Gestão da portabilidade do número sem complicações',
        'Acompanhamento durante todo o processo de mudança',
        'Serviço gratuito para o cliente',
      ]}
      products={[
        { name: 'Internet Fibra', desc: 'Velocidades até 10Gbps com as melhores garantias de SLA disponíveis.' },
        { name: 'TV + Streaming', desc: 'Pacotes com canais premium e serviços de streaming incluídos.' },
        { name: 'Telefone Fixo', desc: 'Chamadas ilimitadas para a rede fixa e móvel nacional.' },
        { name: 'Mobile', desc: 'Tarifários móveis com dados ilimitados e chamadas incluídas.' },
      ]}
      faqs={[
        { q: 'Posso manter o meu número?', a: 'Sim. Tratamos de toda a portabilidade do número para que mantenha o mesmo número de telefone.' },
        { q: 'E se estiver em contrato com outro operador?', a: 'Analisamos as condições do seu contrato atual e verificamos se existe forma de sair sem penalização ou se a poupança compensa o custo de saída.' },
        { q: 'Qual a velocidade de internet recomendada?', a: 'Depende do número de utilizadores e do tipo de uso. Para a maioria dos lares, 200Mbps ou 500Mbps são suficientes.' },
      ]}
    />
  )
}
