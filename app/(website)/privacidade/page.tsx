import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Política de Privacidade' }

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
      <p className="text-muted-foreground mb-10">Última atualização: Julho 2025</p>
      <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">1. Responsável pelo tratamento</h2>
          <p>A PARCENDi Lda., com sede em Barcelos, Portugal, NIF 999 999 999 (doravante &quot;PARCENDi&quot;), é responsável pelo tratamento dos dados pessoais recolhidos através deste website e dos seus serviços.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">2. Dados recolhidos</h2>
          <p>Recolhemos os seguintes dados pessoais: nome, endereço de email, número de telefone, e dados de utilização do website. A recolha destes dados é necessária para a prestação dos nossos serviços e resposta às suas questões.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">3. Finalidades do tratamento</h2>
          <p>Os seus dados são tratados para: (a) resposta a pedidos de contacto e orçamentos; (b) prestação dos serviços contratados; (c) envio de comunicações de marketing, com o seu consentimento; (d) cumprimento de obrigações legais.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">4. Os seus direitos</h2>
          <p>Tem direito a aceder, retificar, apagar e portabilizar os seus dados. Pode exercer estes direitos através do email rgpd@parcendi.pt. Tem também o direito de apresentar reclamação à CNPD (Comissão Nacional de Proteção de Dados).</p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">5. Contacto DPO</h2>
          <p>O nosso Encarregado de Proteção de Dados pode ser contactado em rgpd@parcendi.pt.</p>
        </section>
      </div>
    </div>
  )
}
