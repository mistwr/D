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
import { SEGMENT_LABELS, LEAD_ORIGIN_LABELS } from '@/lib/constants'
import type { Segment, LeadOrigin } from '@/lib/supabase/types'

type FormValues = {
  name: string
  email?: string
  phone?: string
  segment: Segment
  origin: LeadOrigin
  assigned_to?: string
}

interface Profile { id: string; first_name: string; last_name: string }

export function NewLeadButton({ profiles }: { profiles: Profile[] }) {
  const [open, setOpen] = useState(false)
  const [segment, setSegment] = useState<Segment>('energia')
  const [origin, setOrigin] = useState<LeadOrigin>('manual')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: { origin: 'manual', segment: 'energia' },
  })

  async function onSubmit(data: FormValues) {
    if (!data.name || data.name.trim().length < 2) {
      setError('name', { message: 'Nome obrigatório (mín. 2 caracteres)' })
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('leads') as any).insert({
      name: data.name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      segment,
      origin,
      assigned_to: assignedTo || null,
      status: 'nova',
      rgpd_consent: false,
    })
    if (error) {
      toast.error('Erro ao criar lead')
      return
    }
    toast.success('Lead criada com sucesso')
    setOpen(false)
    reset()
    setSegment('energia')
    setOrigin('manual')
    setAssignedTo('')
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-brand hover:bg-brand-dark text-white gap-2">
        <Plus size={16} /> Nova Lead
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome *</Label>
                <Input placeholder="Nome completo" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="email@exemplo.pt" {...register('email')} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input placeholder="+351 9XX XXX XXX" {...register('phone')} />
              </div>
              <div className="space-y-1.5">
                <Label>Segmento *</Label>
                <Select defaultValue="energia" onValueChange={(v) => v && setSegment(v as Segment)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEGMENT_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Origem *</Label>
                <Select defaultValue="manual" onValueChange={(v) => v && setOrigin(v as LeadOrigin)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAD_ORIGIN_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {profiles.length > 0 && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Responsável</Label>
                  <Select onValueChange={(v: string | null) => { if (v) setAssignedTo(v) }}>
                    <SelectTrigger><SelectValue placeholder="Selecionar responsável" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-brand hover:bg-brand-dark text-white">
                {isSubmitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                Criar Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
