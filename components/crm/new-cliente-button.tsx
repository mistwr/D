'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function NewClienteButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', nif: '', city: '', rgpd_consent: false,
  })
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('O nome é obrigatório'); return }
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('clients') as any).insert({
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      nif: form.nif || null,
      city: form.city || null,
      rgpd_consent: form.rgpd_consent,
      rgpd_consent_date: form.rgpd_consent ? new Date().toISOString() : null,
    })
    setLoading(false)
    if (error) { toast.error('Erro ao criar cliente'); return }
    toast.success('Cliente criado com sucesso')
    setOpen(false)
    setForm({ name: '', email: '', phone: '', nif: '', city: '', rgpd_consent: false })
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus size={16} /> Novo Cliente
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="client-name">Nome *</Label>
              <Input id="client-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="client-phone">Telefone</Label>
                <Input id="client-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+351 900 000 000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-nif">NIF</Label>
                <Input id="client-nif" value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} placeholder="000 000 000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-email">Email</Label>
              <Input id="client-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-city">Cidade</Label>
              <Input id="client-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Lisboa, Porto, Barcelos..." />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="client-rgpd"
                checked={form.rgpd_consent}
                onCheckedChange={(v) => setForm({ ...form, rgpd_consent: !!v })}
              />
              <Label htmlFor="client-rgpd" className="text-sm font-normal cursor-pointer">
                Consentimento RGPD dado
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'A criar...' : 'Criar Cliente'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
