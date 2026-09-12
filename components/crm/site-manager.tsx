'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Palette, Megaphone, Plus, Trash2, MonitorSmartphone } from 'lucide-react'

type Settings = {
  id: string
  brand_name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  phone: string | null
  email: string | null
  hero_title: string | null
  hero_subtitle: string | null
  consultation_cta_label: string
  energy_simulator_url: string | null
}

type Campaign = {
  id: string
  segment: string
  operator: string | null
  title: string
  subtitle: string | null
  price: number | null
  price_suffix: string | null
  features: string[] | null
  cta_label: string
  cta_url: string | null
  is_active: boolean
  is_featured: boolean
  position: number
}

const emptySettings: Settings = {
  id: 'main',
  brand_name: 'PARCENDi',
  logo_url: null,
  primary_color: '#0057FF',
  secondary_color: '#0B1220',
  accent_color: '#60A5FA',
  phone: null,
  email: null,
  hero_title: null,
  hero_subtitle: null,
  consultation_cta_label: 'Pedir consultoria gratuita',
  energy_simulator_url: null,
}

export function SiteManager({ settings, campaigns, userId }: { settings: Settings | null; campaigns: Campaign[]; userId: string }) {
  const supabase = createClient()
  const [form, setForm] = useState<Settings>(settings ?? emptySettings)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<Campaign[]>(campaigns)
  const [showNew, setShowNew] = useState(false)
  const [campaignDraft, setCampaignDraft] = useState({
    segment: 'telecom', operator: '', title: '', subtitle: '', price: '', features: '', cta_label: 'Pedir proposta', cta_url: '/contactos', is_featured: false,
  })

  const previewStyle = useMemo(() => ({
    background: `linear-gradient(135deg, ${form.secondary_color}, ${form.primary_color})`,
  }), [form.secondary_color, form.primary_color])

  const set = (key: keyof Settings, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  async function saveBranding() {
    setSaving(true)
    const payload = { ...form, updated_by: userId, updated_at: new Date().toISOString() }
    const { error } = await (supabase.from('site_settings') as any).upsert(payload, { onConflict: 'id' })
    setSaving(false)
    if (error) return toast.error('Não foi possível guardar. Confirma a ligação da base de dados desta versão Vercel.')
    toast.success('Site e branding atualizados')
  }

  async function addCampaign() {
    if (!campaignDraft.title.trim()) return toast.error('Indica o nome da campanha')
    setSaving(true)
    const features = campaignDraft.features.split('\n').map((x) => x.trim()).filter(Boolean)
    const { data, error } = await (supabase.from('site_campaigns') as any).insert({
      segment: campaignDraft.segment,
      operator: campaignDraft.operator.trim() || null,
      title: campaignDraft.title.trim(),
      subtitle: campaignDraft.subtitle.trim() || null,
      price: campaignDraft.price ? Number(campaignDraft.price) : null,
      features,
      cta_label: campaignDraft.cta_label.trim() || 'Pedir proposta',
      cta_url: campaignDraft.cta_url.trim() || '/contactos',
      is_active: true,
      is_featured: campaignDraft.is_featured,
      position: items.length,
      created_by: userId,
    }).select().single()
    setSaving(false)
    if (error) return toast.error('Erro ao criar campanha')
    setItems((prev) => [...prev, data])
    setCampaignDraft({ segment: 'telecom', operator: '', title: '', subtitle: '', price: '', features: '', cta_label: 'Pedir proposta', cta_url: '/contactos', is_featured: false })
    setShowNew(false)
    toast.success('Campanha criada')
  }

  async function toggleCampaign(campaign: Campaign, field: 'is_active' | 'is_featured') {
    const next = !campaign[field]
    const { error } = await (supabase.from('site_campaigns') as any).update({ [field]: next, updated_at: new Date().toISOString() }).eq('id', campaign.id)
    if (error) return toast.error('Erro ao atualizar campanha')
    setItems((prev) => prev.map((item) => item.id === campaign.id ? { ...item, [field]: next } : item))
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Apagar esta campanha do site?')) return
    const { error } = await (supabase.from('site_campaigns') as any).delete().eq('id', id)
    if (error) return toast.error('Erro ao apagar campanha')
    setItems((prev) => prev.filter((item) => item.id !== id))
    toast.success('Campanha apagada')
  }

  return (
    <Tabs defaultValue="branding" className="space-y-5">
      <TabsList className="w-full justify-start overflow-x-auto bg-secondary">
        <TabsTrigger value="branding" className="gap-2"><Palette size={14} /> Branding</TabsTrigger>
        <TabsTrigger value="conteudo" className="gap-2"><MonitorSmartphone size={14} /> Conteúdo</TabsTrigger>
        <TabsTrigger value="campanhas" className="gap-2"><Megaphone size={14} /> Campanhas</TabsTrigger>
      </TabsList>

      <TabsContent value="branding" className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="mb-5 text-sm font-semibold">Identidade visual</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label>Nome da marca</Label><Input value={form.brand_name} onChange={(e) => set('brand_name', e.target.value)} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>URL do logótipo</Label><Input value={form.logo_url ?? ''} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://.../logo.png" /></div>
              {([['primary_color', 'Cor principal'], ['secondary_color', 'Cor escura'], ['accent_color', 'Cor de destaque']] as const).map(([key, label]) => (
                <div key={key} className="space-y-1.5"><Label>{label}</Label><div className="flex gap-2"><input type="color" value={form[key]} onChange={(e) => set(key, e.target.value)} className="h-10 w-12 cursor-pointer rounded border border-border bg-card p-1" /><Input value={form[key]} onChange={(e) => set(key, e.target.value)} /></div></div>
              ))}
              <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} /></div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="p-5 text-white" style={previewStyle}>
              <div className="mb-10 text-sm font-bold">{form.brand_name}</div>
              <div className="max-w-sm text-2xl font-extrabold leading-tight">{form.hero_title || 'Título principal do site'}</div>
              <div className="mt-3 text-sm opacity-80">{form.hero_subtitle || 'Subtítulo do site.'}</div>
              <button type="button" className="mt-5 rounded-lg bg-white px-4 py-2 text-xs font-bold" style={{ color: form.primary_color }}>{form.consultation_cta_label}</button>
            </div>
            <div className="p-4 text-xs text-muted-foreground">Pré-visualização rápida. Guarda quando estiveres satisfeito.</div>
          </div>
        </div>
        <div className="flex justify-end"><Button onClick={saveBranding} disabled={saving} className="gap-2 bg-brand text-white hover:bg-brand-dark">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar alterações</Button></div>
      </TabsContent>

      <TabsContent value="conteudo" className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-5 text-sm font-semibold">Conteúdo principal e integrações</h2>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Título principal</Label><Input value={form.hero_title ?? ''} onChange={(e) => set('hero_title', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Subtítulo</Label><textarea value={form.hero_subtitle ?? ''} onChange={(e) => set('hero_subtitle', e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Texto do botão de consultoria</Label><Input value={form.consultation_cta_label} onChange={(e) => set('consultation_cta_label', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>URL do simulador de energia</Label><Input value={form.energy_simulator_url ?? ''} onChange={(e) => set('energy_simulator_url', e.target.value)} placeholder="https://..." /></div>
            </div>
          </div>
        </div>
        <div className="flex justify-end"><Button onClick={saveBranding} disabled={saving} className="gap-2 bg-brand text-white hover:bg-brand-dark">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar conteúdo</Button></div>
      </TabsContent>

      <TabsContent value="campanhas" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold">Campanhas visíveis no site</h2><p className="text-xs text-muted-foreground">Ativa, destaca ou cria campanhas sem alterar o código.</p></div><Button onClick={() => setShowNew((v) => !v)} className="gap-2 bg-brand text-white hover:bg-brand-dark"><Plus size={15} /> Nova campanha</Button></div>

        {showNew && (
          <div className="rounded-xl border border-brand/30 bg-card p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Segmento</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={campaignDraft.segment} onChange={(e) => setCampaignDraft({ ...campaignDraft, segment: e.target.value })}><option value="telecom">Telecom</option><option value="energia">Energia</option><option value="credito">Crédito</option><option value="imobiliario">Imobiliário</option><option value="seguros">Seguros</option></select></div>
              <div className="space-y-1.5"><Label>Operadora / Marca</Label><Input value={campaignDraft.operator} onChange={(e) => setCampaignDraft({ ...campaignDraft, operator: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Título *</Label><Input value={campaignDraft.title} onChange={(e) => setCampaignDraft({ ...campaignDraft, title: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Descrição</Label><Input value={campaignDraft.subtitle} onChange={(e) => setCampaignDraft({ ...campaignDraft, subtitle: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Preço (€)</Label><Input type="number" step="0.01" value={campaignDraft.price} onChange={(e) => setCampaignDraft({ ...campaignDraft, price: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Texto CTA</Label><Input value={campaignDraft.cta_label} onChange={(e) => setCampaignDraft({ ...campaignDraft, cta_label: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Vantagens — uma por linha</Label><textarea rows={4} value={campaignDraft.features} onChange={(e) => setCampaignDraft({ ...campaignDraft, features: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={campaignDraft.is_featured} onChange={(e) => setCampaignDraft({ ...campaignDraft, is_featured: e.target.checked })} /> Destacar no site</label>
            </div>
            <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button><Button onClick={addCampaign} disabled={saving} className="bg-brand text-white hover:bg-brand-dark">Criar campanha</Button></div>
          </div>
        )}

        <div className="grid gap-3">
          {items.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Ainda não existem campanhas configuradas.</div>}
          {items.map((campaign) => (
            <div key={campaign.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{campaign.title}</h3><Badge variant="secondary">{campaign.segment}</Badge>{campaign.operator && <Badge variant="outline">{campaign.operator}</Badge>}{campaign.is_featured && <Badge>Destaque</Badge>}</div>{campaign.subtitle && <p className="mt-1 text-sm text-muted-foreground">{campaign.subtitle}</p>}{campaign.price != null && <p className="mt-2 text-lg font-bold">{Number(campaign.price).toFixed(2)}€ <span className="text-xs font-normal text-muted-foreground">{campaign.price_suffix || '/mês'}</span></p>}</div>
                <div className="flex flex-wrap gap-2"><Button size="sm" variant={campaign.is_active ? 'default' : 'outline'} onClick={() => toggleCampaign(campaign, 'is_active')}>{campaign.is_active ? 'Ativa' : 'Inativa'}</Button><Button size="sm" variant="outline" onClick={() => toggleCampaign(campaign, 'is_featured')}>{campaign.is_featured ? 'Remover destaque' : 'Destacar'}</Button><Button size="icon" variant="outline" onClick={() => deleteCampaign(campaign.id)}><Trash2 size={15} /></Button></div>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
