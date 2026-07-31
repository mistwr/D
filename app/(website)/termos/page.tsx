import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Termos de Uso' }

export default function TermosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
      <p className="text-muted-foreground mb-10">Última atualização: Julho 2025</p>
      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">1. Aceitação dos termos</h2>
          <p>Ao aceder a este website, o utilizador aceita os presentes Termos de Uso. Se não concordar com alguma das condições, deverá cessar a utilização do website.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">2. Serviços</h2>
          <p>A PARCENDi presta serviços de consultoria e intermediação nas áreas de Energia, Telecom, Crédito, Imobiliário e Seguros. Os serviços de comparação e consultoria são gratuitos para o utilizador final.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">3. Propriedade intelectual</h2>
          <p>Todo o conteúdo deste website, incluindo textos, imagens, logótipos e software, é propriedade da PARCENDi e está protegido por direitos de autor. Não é permitida a reprodução sem autorização expressa.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">4. Limitação de responsabilidade</h2>
          <p>A PARCENDi não se responsabiliza por decisões tomadas com base nas informações disponibilizadas neste website. As simulações e comparações têm caráter meramente indicativo.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">5. Lei aplicável</h2>
          <p>Estes Termos de Uso são regidos pela lei portuguesa. Qualquer litígio será submetido à jurisdição exclusiva dos tribunais portugueses.</p>
        </section>
      </div>
    </div>
  )
}
