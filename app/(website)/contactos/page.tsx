import type { Metadata } from 'next'
import { ContactForm } from '@/components/website/contact-form'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Contactos' }

export default function ContactosPage() {
  return (
    <>
      <section className="bg-brand-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Fale connosco</h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            A nossa equipa está disponível para responder a todas as suas questões. Sem compromissos, sem custos.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Informação de contacto</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-brand" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Telefone</p>
                  <a href="tel:+351253000000" className="text-muted-foreground hover:text-brand transition-colors">
                    +351 253 000 000
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-brand" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Email</p>
                  <a href="mailto:geral@parcendi.pt" className="text-muted-foreground hover:text-brand transition-colors">
                    geral@parcendi.pt
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-brand" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Morada</p>
                  <p className="text-muted-foreground">Rua Principal, 1<br />4750-000 Barcelos, Portugal</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-light rounded-lg flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-brand" />
                </div>
                <div>
                  <p className="font-semibold mb-1">Horário</p>
                  <p className="text-muted-foreground">Segunda a Sexta: 9h00 – 18h30<br />Sábado: 9h00 – 13h00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Enviar mensagem</h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  )
}
