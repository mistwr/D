'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { SEGMENT_LABELS } from '@/lib/constants'
import type { Segment } from '@/lib/supabase/types'

type FormValues = {
  title: string
  value?: string
}

interface Props {
  clients: { id: string; name: string }[]
  profiles: { id: string; first_name: string; last_name: string }[]
  defaultSegment?: Segment
}

export function NewNegocioButton({ clients, profiles, defaultSegment = 'energia' }: Props) {
  const [open, setOpen] = useState(false)
  const [segment, setSegment] = useState<Segment>(defaultSegment)
  const [clientId, setClientId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, setError, formState: { errors, isSubmitting }, reset } = useForm<FormValues>()

  async function onSubmit(data: FormValues) {
    if (!data.title || data.title.trim().length < 2) {
      setError('title', { message: 'Título obrigatório (mín. 2 caracteres)' })
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('deals') as any).insert({
      title: data.title.trim(),
      segment,
      client_id: clientId || null,
      assigned_to: assignedTo || null,
      value: data.value ? parseFloat(data.value) : null,
      stage: 'nova_lead',
    })
    if (error) { toast.error('Erro ao criar negócio'); return }
    toast.success('Negócio criado com sucesso')
    setOpen(false)
    reset()
    setSegment(defaultSegment)
    setClientId('')
    setAssignedTo('')
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-brand hover:bg-brand-dark text-white gap-2" size="sm">
        <Plus size={16} /> Novo Negócio
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Negócio</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Energia Solar — João Silva" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Segmento *</Label>
                <Select defaultValue={defaultSegment} onValueChange={(v) => v && setSegment(v as Segment)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEGMENT_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor (€)</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register('value')} />
              </div>
            </div>
            {clients.length > 0 && (
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Select onValueChange={(v: string | null) => { if (v) setClientId(v) }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {profiles.length > 0 && (
              <div className="space-y-1.5">
                <Label>Responsável</Label>
                <Select onValueChange={(v: string | null) => { if (v) setAssignedTo(v) }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar responsável" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-brand hover:bg-brand-dark text-white">
                {isSubmitting && <Loader2 size={14} className="animate-spin mr-1" />}
                Criar Negócio
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
