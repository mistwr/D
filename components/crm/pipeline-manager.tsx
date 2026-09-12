'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Save, ArrowUp, ArrowDown, Archive, CheckCircle2, XCircle } from 'lucide-react'

const SEGMENTS = [
  ['energia', 'Energia'],
  ['telecom', 'Telecom'],
  ['credito', 'Crédito'],
  ['imobiliario', 'Imobiliário'],
  ['seguros', 'Seguros'],
] as const

type Stage = {
  id: string
  segment: string
  name: string
  position: number
  color: string
  is_won: boolean
  is_lost: boolean
  is_active: boolean
}

export function PipelineManager({ initialStages }: { initialStages: Stage[] }) {
  const supabase = createClient()
  const [segment, setSegment] = useState('energia')
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [busy, setBusy] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3B82F6')

  const visible = useMemo(
    () => stages.filter((s) => s.segment === segment && s.is_active).sort((a, b) => a.position - b.position),
    [stages, segment],
  )

  function patchLocal(id: string, patch: Partial<Stage>) {
    setStages((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s))
  }

  async function saveStage(stage: Stage) {
    setBusy(stage.id)
    const { error } = await (supabase.from('pipeline_stages') as any)
      .update({
        name: stage.name.trim(),
        color: stage.color,
        is_won: stage.is_won,
        is_lost: stage.is_lost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stage.id)
    setBusy(null)
    if (error) return toast.error('Erro ao guardar etapa')
    toast.success('Etapa atualizada')
  }

  async function addStage() {
    if (!newName.trim()) return toast.error('Indica o nome da etapa')
    setBusy('new')
    const position = visible.length ? Math.max(...visible.map((s) => s.position)) + 1 : 0
    const { data, error } = await (supabase.from('pipeline_stages') as any)
      .insert({ segment, name: newName.trim(), color: newColor, position, is_won: false, is_lost: false, is_active: true })
      .select('*')
      .single()
    setBusy(null)
    if (error) return toast.error('Erro ao criar etapa')
    setStages((prev) => [...prev, data])
    setNewName('')
    toast.success('Etapa criada')
  }

  async function move(stage: Stage, direction: -1 | 1) {
    const index = visible.findIndex((s) => s.id === stage.id)
    const other = visible[index + direction]
    if (!other) return
    setBusy(stage.id)
    const { error: e1 } = await (supabase.from('pipeline_stages') as any).update({ position: other.position }).eq('id', stage.id)
    const { error: e2 } = await (supabase.from('pipeline_stages') as any).update({ position: stage.position }).eq('id', other.id)
    setBusy(null)
    if (e1 || e2) return toast.error('Erro ao reordenar etapas')
    setStages((prev) => prev.map((s) => s.id === stage.id ? { ...s, position: other.position } : s.id === other.id ? { ...s, position: stage.position } : s))
  }

  async function archive(stage: Stage) {
    if (!confirm(`Desativar a etapa “${stage.name}”?`)) return
    setBusy(stage.id)
    const { error } = await (supabase.from('pipeline_stages') as any).update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', stage.id)
    setBusy(null)
    if (error) return toast.error('Erro ao desativar etapa')
    patchLocal(stage.id, { is_active: false })
    toast.success('Etapa desativada')
  }

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {SEGMENTS.map(([value, label]) => (
            <Button key={value} size="sm" variant={segment === value ? 'default' : 'outline'} onClick={() => setSegment(value)}>{label}</Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="font-semibold">Etapas do pipeline</h2>
          <p className="text-sm text-muted-foreground">Renomeia, muda cores, ordena e define estados finais sem alterar código.</p>
        </div>

        <div className="space-y-3">
          {visible.map((stage, index) => (
            <div key={stage.id} className="rounded-xl border border-border p-3 sm:p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_170px_auto] lg:items-end">
                <div className="space-y-1.5">
                  <Label>Nome da etapa</Label>
                  <Input value={stage.name} onChange={(e) => patchLocal(stage.id, { name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cor</Label>
                  <div className="flex gap-2"><input type="color" value={stage.color || '#3B82F6'} onChange={(e) => patchLocal(stage.id, { color: e.target.value })} className="h-10 w-12 rounded border border-input bg-background p-1" /><Input value={stage.color || ''} onChange={(e) => patchLocal(stage.id, { color: e.target.value })} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="icon" variant="outline" disabled={index === 0 || busy === stage.id} onClick={() => move(stage, -1)}><ArrowUp size={15} /></Button>
                  <Button size="icon" variant="outline" disabled={index === visible.length - 1 || busy === stage.id} onClick={() => move(stage, 1)}><ArrowDown size={15} /></Button>
                  <Button size="sm" variant={stage.is_won ? 'default' : 'outline'} onClick={() => patchLocal(stage.id, { is_won: !stage.is_won, is_lost: stage.is_won ? stage.is_lost : false })} className="gap-1"><CheckCircle2 size={14} /> Ganho</Button>
                  <Button size="sm" variant={stage.is_lost ? 'default' : 'outline'} onClick={() => patchLocal(stage.id, { is_lost: !stage.is_lost, is_won: stage.is_lost ? stage.is_won : false })} className="gap-1"><XCircle size={14} /> Perdido</Button>
                  <Button size="sm" onClick={() => saveStage(stage)} disabled={busy === stage.id} className="gap-1"><Save size={14} /> Guardar</Button>
                  <Button size="icon" variant="outline" onClick={() => archive(stage)} disabled={busy === stage.id}><Archive size={15} /></Button>
                </div>
              </div>
            </div>
          ))}

          {visible.length === 0 && <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Sem etapas ativas neste segmento.</div>}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-brand/40 p-4">
          <h3 className="mb-3 text-sm font-semibold">Nova etapa</h3>
          <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
            <div className="space-y-1.5"><Label>Nome</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex.: Aguardar documentação" /></div>
            <div className="space-y-1.5"><Label>Cor</Label><div className="flex gap-2"><input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-10 w-12 rounded border border-input bg-background p-1" /><Input value={newColor} onChange={(e) => setNewColor(e.target.value)} /></div></div>
            <Button onClick={addStage} disabled={busy === 'new'} className="gap-2"><Plus size={15} /> Adicionar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
