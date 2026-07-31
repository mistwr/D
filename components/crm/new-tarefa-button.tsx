'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { TASK_PRIORITY_LABELS } from '@/lib/constants'
import type { TaskPriority } from '@/lib/supabase/types'

type FormValues = {
  title: string
  description?: string
  due_date?: string
}

interface Props {
  profiles: { id: string; first_name: string; last_name: string }[]
}

export function NewTarefaButton({ profiles }: Props) {
  const [open, setOpen] = useState(false)
  const [priority, setPriority] = useState<TaskPriority>('media')
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
    const { error } = await (supabase.from('tasks') as any).insert({
      title: data.title.trim(),
      description: data.description || null,
      priority,
      assigned_to: assignedTo || null,
      due_date: data.due_date || null,
      status: 'pendente',
    })
    if (error) { toast.error('Erro ao criar tarefa'); return }
    toast.success('Tarefa criada')
    setOpen(false)
    reset()
    setPriority('media')
    setAssignedTo('')
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-brand hover:bg-brand-dark text-white gap-2" size="sm">
        <Plus size={16} /> Nova Tarefa
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Descreva a tarefa..." {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea placeholder="Detalhes adicionais..." rows={3} {...register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select defaultValue="media" onValueChange={(v) => v && setPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prazo</Label>
                <Input type="date" {...register('due_date')} />
              </div>
            </div>
            {profiles.length > 0 && (
              <div className="space-y-1.5">
                <Label>Atribuir a</Label>
                <Select onValueChange={(v: string | null) => { if (v) setAssignedTo(v) }}>
                  <SelectTrigger><SelectValue placeholder="Selecionar utilizador" /></SelectTrigger>
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
                Criar Tarefa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
