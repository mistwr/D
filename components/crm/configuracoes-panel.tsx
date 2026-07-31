'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { SEGMENT_LABELS, ROLE_LABELS, ADMIN_ROLES } from '@/lib/constants'
import type { Profile, CommissionConfig, Segment } from '@/lib/supabase/types'
import { formatPercent } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, UserCircle, Percent } from 'lucide-react'

interface Props {
  profile: Profile | null
  commissionConfigs: CommissionConfig[]
}

export function ConfiguracoesPanel({ profile, commissionConfigs }: Props) {
  const isAdmin = profile?.role && ADMIN_ROLES.includes(profile.role)

  return (
    <Tabs defaultValue="perfil" className="space-y-6">
      <TabsList className="bg-secondary">
        <TabsTrigger value="perfil" className="gap-2"><UserCircle size={14} /> Perfil</TabsTrigger>
        {isAdmin && <TabsTrigger value="comissoes" className="gap-2"><Percent size={14} /> Comissões</TabsTrigger>}
      </TabsList>

      <TabsContent value="perfil">
        <ProfileTab profile={profile} />
      </TabsContent>
      {isAdmin && (
        <TabsContent value="comissoes">
          <CommissionsTab configs={commissionConfigs} />
        </TabsContent>
      )}
    </Tabs>
  )
}

function ProfileTab({ profile }: { profile: Profile | null }) {
  const [form, setForm] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    phone: profile?.phone ?? '',
    nif: profile?.nif ?? '',
    iban: profile?.iban ?? '',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any).update({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      nif: form.nif || null,
      iban: form.iban || null,
    }).eq('id', profile.id)
    setLoading(false)
    if (error) { toast.error('Erro ao guardar perfil'); return }
    toast.success('Perfil atualizado com sucesso')
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 max-w-xl">
      <h2 className="font-semibold text-sm mb-4">Dados Pessoais</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Primeiro Nome</Label>
            <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Apelido</Label>
            <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={profile?.email ?? ''} disabled className="opacity-60 cursor-not-allowed" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+351 9XX XXX XXX" />
          </div>
          <div className="space-y-1.5">
            <Label>NIF</Label>
            <Input value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} placeholder="000 000 000" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>IBAN</Label>
          <Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} placeholder="PT50 0000 0000 0000 0000 0000 0" />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">
            Função: <span className="font-medium text-foreground">{profile?.role ? ROLE_LABELS[profile.role] : '—'}</span>
          </div>
          <Button type="submit" disabled={loading} size="sm" className="ml-auto gap-1.5 bg-brand hover:bg-brand-dark text-white">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar
          </Button>
        </div>
      </form>
    </div>
  )
}

function CommissionsTab({ configs }: { configs: CommissionConfig[] }) {
  const bySegment: Partial<Record<Segment, CommissionConfig[]>> = {}
  configs.forEach((c) => {
    if (!bySegment[c.segment]) bySegment[c.segment] = []
    bySegment[c.segment]!.push(c)
  })

  return (
    <div className="space-y-6">
      {Object.entries(SEGMENT_LABELS).map(([seg, label]) => {
        const segConfigs = bySegment[seg as Segment] ?? []
        return (
          <div key={seg} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary">
              <h3 className="font-semibold text-sm">{label}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Função</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">%</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Franquia</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Marketing</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Recrutamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {segConfigs.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-3 text-xs text-muted-foreground">Sem configuração definida</td></tr>
                  ) : (
                    segConfigs.map((c) => (
                      <tr key={c.id} className="hover:bg-secondary/30">
                        <td className="px-4 py-2.5 text-sm">{ROLE_LABELS[c.role] ?? c.role}</td>
                        <td className="px-4 py-2.5 font-medium">{formatPercent(c.percentage)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{formatPercent(c.franquia_percentage)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{formatPercent(c.marketing_percentage)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{formatPercent(c.recrutamento_percentage)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}


