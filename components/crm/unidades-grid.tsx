import { Building2, Users, GitBranch, Phone, Mail, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UnitType } from '@/lib/supabase/types'

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  sede: 'Sede', franquia: 'Franquia', parceiro: 'Parceiro', agencia: 'Agência',
}

const UNIT_TYPE_COLORS: Record<UnitType, string> = {
  sede: 'bg-brand/10 text-brand border-brand/20',
  franquia: 'bg-amber-50 text-amber-700 border-amber-200',
  parceiro: 'bg-teal-50 text-teal-700 border-teal-200',
  agencia: 'bg-violet-50 text-violet-700 border-violet-200',
}

interface Unit {
  id: string
  name: string
  code: string
  type: string
  city: string | null
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  profiles?: { first_name: string; last_name: string } | null
}

interface Props {
  units: Unit[]
  leadsByUnit: Record<string, number>
  dealsByUnit: Record<string, number>
}

export function UnidadesGrid({ units, leadsByUnit, dealsByUnit }: Props) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-5">{units.length} unidade{units.length !== 1 ? 's' : ''}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.length === 0 ? (
          <p className="text-muted-foreground col-span-3 py-8 text-center">Nenhuma unidade registada</p>
        ) : (
          units.map((unit) => {
            const leads = leadsByUnit[unit.id] ?? 0
            const deals = dealsByUnit[unit.id] ?? 0
            const typeConfig = UNIT_TYPE_COLORS[unit.type as UnitType] ?? 'bg-secondary text-foreground border-border'

            return (
              <div key={unit.id} className={cn('bg-card border rounded-xl p-5 flex flex-col gap-4', !unit.is_active && 'opacity-60')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{unit.name}</p>
                      <p className="text-xs text-muted-foreground">{unit.code}</p>
                    </div>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border shrink-0', typeConfig)}>
                    {UNIT_TYPE_LABELS[unit.type as UnitType] ?? unit.type}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users size={13} />
                    <span className="text-xs">{leads} leads</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <GitBranch size={13} />
                    <span className="text-xs">{deals} negócios</span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-border pt-3">
                  {unit.city && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin size={12} /> {unit.city}
                    </div>
                  )}
                  {unit.phone && (
                    <a href={`tel:${unit.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand transition-colors">
                      <Phone size={12} /> {unit.phone}
                    </a>
                  )}
                  {unit.email && (
                    <a href={`mailto:${unit.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand transition-colors">
                      <Mail size={12} /> {unit.email}
                    </a>
                  )}
                </div>

                {unit.profiles && (
                  <p className="text-xs text-muted-foreground border-t border-border pt-3">
                    Gestor: <span className="font-medium text-foreground">{unit.profiles.first_name} {unit.profiles.last_name}</span>
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
