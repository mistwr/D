import type { Metadata } from 'next'
import { MapPin, Phone, Mail } from 'lucide-react'

export const metadata: Metadata = { title: 'Unidades' }

const units = [
  {
    name: 'PARCENDi Sede',
    type: 'Sede',
    city: 'Barcelos',
    address: 'Rua Principal, 1 — 4750-000 Barcelos',
    phone: '+351 253 000 000',
    email: 'geral@parcendi.pt',
    hours: 'Seg–Sex: 9h–18h30',
  },
  {
    name: 'PARCENDi Barcelos Norte',
    type: 'Agência',
    city: 'Barcelos',
    address: 'Avenida do Norte, 45 — 4750-100 Barcelos',
    phone: '+351 253 100 100',
    email: 'barcelos@parcendi.pt',
    hours: 'Seg–Sex: 9h–18h30 | Sáb: 9h–13h',
  },
]

export default function UnidadesPage() {
  return (
    <>
      <section className="bg-brand-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">As nossas unidades</h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Encontre a unidade PARCENDi mais próxima de si e venha falar com os nossos especialistas.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {units.map((u) => (
            <div key={u.name} className="border border-border rounded-xl p-8 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{u.name}</h2>
                  <span className="text-xs font-medium text-brand bg-brand-light px-2 py-0.5 rounded-full mt-1 inline-block">
                    {u.type}
                  </span>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-brand" />
                  <span>{u.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0 text-brand" />
                  <a href={`tel:${u.phone.replace(/\s/g, '')}`} className="hover:text-foreground transition-colors">{u.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="shrink-0 text-brand" />
                  <a href={`mailto:${u.email}`} className="hover:text-foreground transition-colors">{u.email}</a>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-medium text-foreground">Horário</p>
                  <p className="text-xs mt-0.5">{u.hours}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
