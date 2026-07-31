'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { SEGMENT_LABELS, SEGMENT_COLORS } from '@/lib/constants'
import type { Segment } from '@/lib/supabase/types'

const SEGMENTS: Segment[] = ['energia', 'telecom', 'credito', 'imobiliario', 'seguros']

interface Props {
  leads: { segment: string; created_at: string }[]
  deals: { segment: string; stage: string; value: number | null }[]
}

export function DashboardCharts({ leads, deals }: Props) {
  // Leads by segment
  const leadsBySegment = SEGMENTS.map((s) => ({
    name: SEGMENT_LABELS[s],
    total: leads.filter((l) => l.segment === s).length,
    color: SEGMENT_COLORS[s],
  }))

  // Deals by segment for pie
  const dealsBySegment = SEGMENTS
    .map((s) => ({
      name: SEGMENT_LABELS[s],
      value: deals.filter((d) => d.segment === s).length,
      color: SEGMENT_COLORS[s],
    }))
    .filter((d) => d.value > 0)

  return (
    <div className="space-y-5">
      {/* Leads by segment */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4 text-sm">Leads por Segmento</h3>
        {leads.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadsBySegment} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.008 240)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid oklch(0.9 0.008 240)' }}
              />
              <Bar dataKey="total" name="Leads" radius={[4, 4, 0, 0]}>
                {leadsBySegment.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Sem dados disponíveis
          </div>
        )}
      </div>

      {/* Deals by segment */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4 text-sm">Negócios por Segmento</h3>
        {dealsBySegment.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={dealsBySegment}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                paddingAngle={3}
              >
                {dealsBySegment.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            Sem dados disponíveis
          </div>
        )}
      </div>
    </div>
  )
}
