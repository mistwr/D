'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Palette, Megaphone, Plus, Trash2, MonitorSmartphone, Pencil, X } from 'lucide-react'

type Settings = {
  id: string; brand_name: string; logo_url: string | null; primary_color: string; secondary_color: string; accent_color: string;
  phone: string | null; email: string | null; hero_title: string | null; hero_subtitle: string | null;
  consultation_cta_label: string; energy_simulator_url: string | null
}

type Campaign = {
  id: string; segment: string; operator: string | null; title: string; subtitle: string | null; price: number | null;
  price_suffix: string | null; features: string[] | null; cta_label: string; cta_url: string | null;
  is_active: boolean; is_featured: boolean; position: number
}

type Draft = {
  segment: string; operator: string; title: string; subtitle: string; price: string; price_suffix: string;
  features: string; cta_label: string; cta_url: string; is_featured: boolean
}

const emptySettings: Settings = {
  id: 'main', brand_name: 'PARCENDi', logo_url: null, primary_color: '#0057FF', secondary_color: '#0B1220', accent_color: '#60A5FA',
  phone: null, email: null, hero_title: null, hero_subtitle: null, consultation_cta_label: 'Pedir consultoria gratuita', energy_simulator_url: null,
}

const emptyDraft: Draft = {
  segment: 'telecom', operator: '', title: '', subtitle: '', price: '', price_suffix: '/mês', features: '',
  cta_label: 'Pedir proposta', cta_url: '/contactos', is_featured: false,
}

function toDraft(c: Campaign): Draft {
  return {
    segment: c.segment || 'telecom', operator: c.operator || '', title: c.title || '', subtitle: c.subtitle || '',
    price: c.price == null ? '' : String(c.price), price_suffix: c.price_suffix || '/mês',
    features: Array.isArray(c.features) ? c.features.join('\n') : '', cta_label: c.cta_label || 'Pedir proposta',
    cta_url: c.cta_url || '/contactos', is_featured: !!c.is_featured,
  }
}

export function SiteManagerV2({ settings, campaigns, userId }: { settings: Settings | null; campaigns: Campaign[]; userId: string }) {
  const supabase = createClient()
  const [form, setForm] = useState<Settings>(settings ?? emptySettings)
  const [items, setItems] = useState<Campaign[]>(campaigns)
  const [saving, setSaving] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft)

  const previewStyle = useMemo(() => ({ background: `linear-gradient(135deg, ${form.secondary_color}, ${form.primary_color})` }), [form.secondary_color, form.primary_color])
  const set = (key: keyof Settings, value: string) => setForm((p) => ({ ...p, [key]: value }))

  async function saveBranding() {
    setSaving(true)
    const { error } = await (supabase.from('site_settings') as any).upsert({ ...form, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    setSaving(false)
    if (error) return toast.error('Não foi possível guardar as alterações')
    toast.success('Site e branding atualizados')
  }

  function payloadFromDraft(d: Draft) {
    return {
      segment: d.segment,
      operator: d.operator.trim() || null,
      title: d.title.trim(),
      subtitle: d.subtitle.trim() || null,
      price: d.price ? Number(d.price) : null,
      price_suffix: d.price_suffix.trim() || '/mês',
      features: d.features.split('\n').map((x) => x.trim()).filter(Boolean),
      cta_label: d.cta_label.trim() || 'Pedir proposta',
      cta_url: d.cta_url.trim() || '/contactos',
      is_featured: d.is_featured,
      updated_at: new Date().toISOString(),
    }
  }

  async function addCampaign() {
    if (!draft.title.trim()) return toast.error('Indica o nome da campanha')
    setSaving(true)
    const { data, error } = await (supabase.from('site_campaigns') as any).insert({
      ...payloadFromDraft(draft), is_active: true, position: items.length, created_by: userId,
    }).select().single()
    setSaving(false)
    if (error) return toast.error('Erro ao criar campanha')
    setItems((p) => [...p, data])
    setDraft(emptyDraft); setShowNew(false)
    toast.success('Campanha criada')
  }

  function beginEdit(c: Campaign) { setEditingId(c.id); setEditDraft(toDraft(c)) }
  function cancelEdit() { setEditingId(null); setEditDraft(emptyDraft) }

  async function saveCampaign(id: string) {
    if (!editDraft.title.trim()) return toast.error('O título é obrigatório')
    setSaving(true)
    const patch = payloadFromDraft(editDraft)
    const { data, error } = await (supabase.from('site_campaigns') as any).update(patch).eq('id', id).select().single()
    setSaving(false)
    if (error) return toast.error('Erro ao guardar campanha')
    setItems((p) => p.map((x) => x.id === id ? data : x))
    cancelEdit(); toast.success('Campanha atualizada')
  }

  async function toggleCampaign(c: Campaign, field: 'is_active' | 'is_featured') {
    const next = !c[field]
    const { error } = await (supabase.from('site_campaigns') as any).update({ [field]: next, updated_at: new Date().toISOString() }).eq('id', c.id)
    if (error) return toast.error('Erro ao atualizar campanha')
    setItems((p) => p.map((x) => x.id === c.id ? { ...x, [field]: next } : x))
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Apagar esta campanha do site?')) return
    const { error } = await (supabase.from('site_campaigns') as any).delete().eq('id', id)
    if (error) return toast.error('Erro ao apagar campanha')
    setItems((p) => p.filter((x) => x.id !== id)); toast.success('Campanha apagada')
  }

  const DraftFields = ({ value, onChange }: { value: Draft; onChange: (d: Draft) => void }) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5"><Label>Segmento</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value.segment} onChange={(e) => onChange({ ...value, segment: e.target.value })}><option value="telecom">Telecom</option><option value="energia">Energia</option><option value="credito">Crédito</option><option value="imobiliario">Imobiliário</option><option value="seguros">Seguros</option></select></div>
      <div className="space-y-1.5"><Label>Operadora / Marca</Label><Input value={value.operator} onChange={(e) => onChange({ ...value, operator: e.target.value })} /></div>
      <div className="space-y-1.5 sm:col-span-2"><Label>Título *</Label><Input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} /></div>
      <div className="space-y-1.5 sm:col-span-2"><Label>Descrição</Label><Input value={value.subtitle} onChange={(e) => onChange({ ...value, subtitle: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>Preço (€)</Label><Input type="number" step="0.01" value={value.price} onChange={(e) => onChange({ ...value, price: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>Sufixo</Label><Input value={value.price_suffix} onChange={(e) => onChange({ ...value, price_suffix: e.target.value })} placeholder="/mês" /></div>
      <div className="space-y-1.5"><Label>Texto CTA</Label><Input value={value.cta_label} onChange={(e) => onChange({ ...value, cta_label: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>Destino CTA</Label><Input value={value.cta_url} onChange={(e) => onChange({ ...value, cta_url: e.target.value })} /></div>
      <div className="space-y-1.5 sm:col-span-2"><Label>Vantagens — uma por linha</Label><textarea rows={4} value={value.features} onChange={(e) => onChange({ ...value, features: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.is_featured} onChange={(e) => onChange({ ...value, is_featured: e.target.checked })} /> Destacar no site</label>
    </div>
  )

  return <Tabs defaultValue="branding" className="space-y-5">
    <TabsList className="w-full justify-start overflow-x-auto bg-secondary"><TabsTrigger value="branding" className="gap-2"><Palette size={14}/> Branding</TabsTrigger><TabsTrigger value="conteudo" className="gap-2"><MonitorSmartphone size={14}/> Conteúdo</TabsTrigger><TabsTrigger value="campanhas" className="gap-2"><Megaphone size={14}/> Campanhas</TabsTrigger></TabsList>

    <TabsContent value="branding" className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6"><h2 className="mb-5 text-sm font-semibold">Identidade visual</h2><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5 sm:col-span-2"><Label>Nome da marca</Label><Input value={form.brand_name} onChange={(e)=>set('brand_name',e.target.value)}/></div><div className="space-y-1.5 sm:col-span-2"><Label>URL do logótipo</Label><Input value={form.logo_url??''} onChange={(e)=>set('logo_url',e.target.value)}/></div>{([['primary_color','Cor principal'],['secondary_color','Cor escura'],['accent_color','Cor de destaque']] as const).map(([key,label])=><div key={key} className="space-y-1.5"><Label>{label}</Label><div className="flex gap-2"><input type="color" value={form[key]} onChange={(e)=>set(key,e.target.value)} className="h-10 w-12 rounded border p-1"/><Input value={form[key]} onChange={(e)=>set(key,e.target.value)}/></div></div>)}<div className="space-y-1.5"><Label>Telefone</Label><Input value={form.phone??''} onChange={(e)=>set('phone',e.target.value)}/></div><div className="space-y-1.5"><Label>Email</Label><Input value={form.email??''} onChange={(e)=>set('email',e.target.value)}/></div></div></div>
        <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="p-5 text-white" style={previewStyle}><div className="mb-10 text-sm font-bold">{form.brand_name}</div><div className="max-w-sm text-2xl font-extrabold">{form.hero_title||'Título principal do site'}</div><div className="mt-3 text-sm opacity-80">{form.hero_subtitle||'Subtítulo do site.'}</div><button type="button" className="mt-5 rounded-lg bg-white px-4 py-2 text-xs font-bold" style={{color:form.primary_color}}>{form.consultation_cta_label}</button></div><div className="p-4 text-xs text-muted-foreground">Pré-visualização rápida.</div></div>
      </div><div className="flex justify-end"><Button onClick={saveBranding} disabled={saving} className="gap-2 bg-brand text-white">{saving?<Loader2 size={15} className="animate-spin"/>:<Save size={15}/>} Guardar alterações</Button></div>
    </TabsContent>

    <TabsContent value="conteudo" className="space-y-5"><div className="rounded-xl border border-border bg-card p-4 sm:p-6"><div className="space-y-4"><div className="space-y-1.5"><Label>Título principal</Label><Input value={form.hero_title??''} onChange={(e)=>set('hero_title',e.target.value)}/></div><div className="space-y-1.5"><Label>Subtítulo</Label><textarea rows={3} value={form.hero_subtitle??''} onChange={(e)=>set('hero_subtitle',e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label>Texto do botão</Label><Input value={form.consultation_cta_label} onChange={(e)=>set('consultation_cta_label',e.target.value)}/></div><div className="space-y-1.5"><Label>URL do simulador</Label><Input value={form.energy_simulator_url??''} onChange={(e)=>set('energy_simulator_url',e.target.value)}/></div></div></div></div><div className="flex justify-end"><Button onClick={saveBranding} disabled={saving} className="gap-2 bg-brand text-white"><Save size={15}/> Guardar conteúdo</Button></div></TabsContent>

    <TabsContent value="campanhas" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold">Campanhas visíveis no site</h2><p className="text-xs text-muted-foreground">Cria, edita, destaca, ativa ou desativa sem mexer no código.</p></div><Button onClick={()=>setShowNew((v)=>!v)} className="gap-2 bg-brand text-white"><Plus size={15}/> Nova campanha</Button></div>
      {showNew&&<div className="rounded-xl border border-brand/30 bg-card p-4 sm:p-6"><DraftFields value={draft} onChange={setDraft}/><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={()=>setShowNew(false)}>Cancelar</Button><Button onClick={addCampaign} disabled={saving} className="bg-brand text-white">Criar campanha</Button></div></div>}
      <div className="grid gap-3">{items.length===0&&<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Ainda não existem campanhas configuradas.</div>}{items.map((c)=><div key={c.id} className="rounded-xl border border-border bg-card p-4">{editingId===c.id?<><DraftFields value={editDraft} onChange={setEditDraft}/><div className="mt-4 flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={cancelEdit} className="gap-2"><X size={14}/> Cancelar</Button><Button onClick={()=>saveCampaign(c.id)} disabled={saving} className="gap-2 bg-brand text-white"><Save size={14}/> Guardar campanha</Button></div></>:<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{c.title}</h3><Badge variant="secondary">{c.segment}</Badge>{c.operator&&<Badge variant="outline">{c.operator}</Badge>}{c.is_featured&&<Badge>Destaque</Badge>}</div>{c.subtitle&&<p className="mt-1 text-sm text-muted-foreground">{c.subtitle}</p>}{c.price!=null&&<p className="mt-2 text-lg font-bold">{Number(c.price).toFixed(2)}€ <span className="text-xs font-normal text-muted-foreground">{c.price_suffix||'/mês'}</span></p>}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>beginEdit(c)} className="gap-1"><Pencil size={14}/> Editar</Button><Button size="sm" variant={c.is_active?'default':'outline'} onClick={()=>toggleCampaign(c,'is_active')}>{c.is_active?'Ativa':'Inativa'}</Button><Button size="sm" variant="outline" onClick={()=>toggleCampaign(c,'is_featured')}>{c.is_featured?'Sem destaque':'Destacar'}</Button><Button size="icon" variant="outline" onClick={()=>deleteCampaign(c.id)}><Trash2 size={15}/></Button></div></div>}</div>)}</div>
    </TabsContent>
  </Tabs>
}
