'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface Props {
  clients: { id: string; name: string }[]
}

export function NewCrossSellButton({ clients }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ client_id: '', segment: 'energia' as Segment, potential_value: '' })
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id) { toast.error('Selecione um cliente'); return }
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('cross_sells') as any).insert({
      client_id: form.client_id,
      segment: form.segment,
      status: 'aberto',
      potential_value: form.potential_value ? parseFloat(form.potential_value) : null,
    })
    setLoading(false)
    if (error) { toast.error('Erro ao criar oportunidade'); return }
    toast.success('Oportunidade de cross-sell criada')
    setOpen(false)
    setForm({ client_id: '', segment: 'energia', potential_value: '' })
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-brand hover:bg-brand-dark text-white gap-2" size="sm">
        <Plus size={16} /> Nova Oportunidade
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Oportunidade Cross-sell</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select onValueChange={(v: string | null) => { if (v) setForm((f) => ({ ...f, client_id: v })) }}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Novo Segmento</Label>
                <Select defaultValue="energia" onValueChange={(v) => setForm({ ...form, segment: v as Segment })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEGMENT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor Potencial (€)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.potential_value} onChange={(e) => setForm({ ...form, potential_value: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-brand hover:bg-brand-dark text-white">
                {loading && <Loader2 size={14} className="animate-spin mr-1" />}
                Criar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
