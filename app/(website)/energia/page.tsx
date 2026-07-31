import type { Metadata } from 'next'
import { Zap } from 'lucide-react'
import { ServicePage } from '@/components/website/service-page'

export const metadata: Metadata = { title: 'Energia' }

export default function EnergiaPage() {
  return (
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
  )
}
