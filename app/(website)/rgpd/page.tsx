import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'RGPD' }

export default function RGPDPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <h1 className="text-4xl font-bold mb-4">Proteção de Dados (RGPD)</h1>
      <p className="text-muted-foreground mb-10">Regulamento Geral sobre a Proteção de Dados — UE 2016/679</p>
      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section className="border border-border rounded-xl p-6">
          <h2 className="text-base font-bold text-foreground mb-3">Os seus direitos ao abrigo do RGPD</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Direito de acesso aos seus dados pessoais</li>
            <li>Direito de retificação de dados incorretos</li>
            <li>Direito ao apagamento (&quot;direito ao esquecimento&quot;)</li>
            <li>Direito à limitação do tratamento</li>
            <li>Direito à portabilidade dos dados</li>
            <li>Direito de oposição ao tratamento</li>
            <li>Direito de não ser sujeito a decisões automatizadas</li>
          </ul>
        </section>
        <section className="border border-border rounded-xl p-6">
          <h2 className="text-base font-bold text-foreground mb-3">Como exercer os seus direitos</h2>
          <p>Para exercer qualquer um dos seus direitos, envie um pedido por escrito para:</p>
          <div className="mt-3 space-y-1">
            <p><strong className="text-foreground">Email:</strong> rgpd@parcendi.pt</p>
            <p><strong className="text-foreground">Morada:</strong> Rua Principal, 1 — 4750-000 Barcelos, Portugal</p>
            <p><strong className="text-foreground">DPO:</strong> rgpd@parcendi.pt</p>
          </div>
        </section>
        <section className="border border-border rounded-xl p-6">
          <h2 className="text-base font-bold text-foreground mb-3">Prazo de resposta</h2>
          <p>Respondemos a todos os pedidos no prazo máximo de 30 dias a contar da data de receção, podendo este prazo ser prorrogado por mais 60 dias em casos complexos.</p>
        </section>
        <section className="border border-border rounded-xl p-6">
          <h2 className="text-base font-bold text-foreground mb-3">Autoridade de supervisão</h2>
          <p>Tem direito a apresentar reclamação junto da CNPD — Comissão Nacional de Proteção de Dados (www.cnpd.pt) caso considere que os seus dados estão a ser tratados de forma ilícita.</p>
        </section>
      </div>
    </div>
  )
}
