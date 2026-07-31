'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2, Pencil, KeyRound, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { ROLE_LABELS } from '@/lib/constants'
import type { Profile, UserRole } from '@/lib/supabase/types'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { createUser, updateUser, resetUserPassword, toggleUserActive } from '@/app/crm/utilizadores/actions'

type UserRow = Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email' | 'role' | 'unit_id' | 'phone' | 'is_active' | 'created_at'>

const ROLE_BADGE: Record<UserRole, string> = {
  superadmin: 'bg-slate-900 text-white',
  admin: 'bg-red-100 text-red-800',
  ceo: 'bg-purple-100 text-purple-800',
  direcao: 'bg-indigo-100 text-indigo-700',
  operadora: 'bg-blue-100 text-blue-700',
  especialista: 'bg-teal-100 text-teal-700',
  unidade: 'bg-amber-100 text-amber-700',
  franquia: 'bg-orange-100 text-orange-700',
  parceiro: 'bg-gray-100 text-gray-700',
}

interface Props {
  users: UserRow[]
  units: { id: string; name: string }[]
  callerRole: UserRole
}

// Roles the current caller is allowed to assign.
function assignableRoles(callerRole: UserRole): UserRole[] {
  const all: UserRole[] = ['admin', 'ceo', 'direcao', 'operadora', 'especialista', 'unidade', 'franquia', 'parceiro']
  const privileged = callerRole === 'superadmin' || callerRole === 'admin'
  return privileged ? all : all.filter((r) => r !== 'admin')
}

export function UtilizadoresPanel({ users, units, callerRole }: Props) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [pwUser, setPwUser] = useState<UserRow | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const unitName = (id: string | null) => units.find((u) => u.id === id)?.name ?? '—'

  const filtered = users.filter((u) => {
    const matchesQuery = query.trim() === '' ||
      `${u.first_name} ${u.last_name} ${u.email ?? ''}`.toLowerCase().includes(query.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesQuery && matchesRole
  })

  function handleToggleActive(u: UserRow) {
    startTransition(async () => {
      const res = await toggleUserActive({ id: u.id, is_active: !u.is_active })
      if (!res.ok) { toast.error(res.error); return }
      toast.success(u.is_active ? 'Utilizador desativado' : 'Utilizador ativado')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Procurar por nome ou email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | UserRole)}>
          <SelectTrigger className="w-full sm:w-48">
            <span className="truncate">{roleFilter === 'all' ? 'Todos os cargos' : ROLE_LABELS[roleFilter]}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cargos</SelectItem>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)} className="bg-brand hover:bg-brand-dark text-white gap-2 sm:ml-auto" size="sm">
          <Plus size={16} /> Novo Utilizador
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary">
                {['Nome', 'Email', 'Cargo', 'Unidade', 'Ativo', 'Desde', ''].map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum utilizador encontrado.</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{u.first_name} {u.last_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1', ROLE_BADGE[u.role])}>
                      {u.role === 'superadmin' && <ShieldCheck size={11} />}
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{unitName(u.unit_id)}</td>
                  <td className="px-4 py-3">
                    <Switch checked={u.is_active} onCheckedChange={() => handleToggleActive(u)} disabled={isPending} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => setEditUser(u)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Redefinir password" onClick={() => setPwUser(u)}>
                        <KeyRound size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} units={units} callerRole={callerRole} onDone={() => router.refresh()} />
      {editUser && (
        <EditUserDialog user={editUser} units={units} callerRole={callerRole} onClose={() => setEditUser(null)} onDone={() => router.refresh()} />
      )}
      {pwUser && (
        <ResetPasswordDialog user={pwUser} onClose={() => setPwUser(null)} />
      )}
    </div>
  )
}

function RoleSelect({ value, onChange, callerRole }: { value: UserRole; onChange: (r: UserRole) => void; callerRole: UserRole }) {
  const roles = assignableRoles(callerRole)
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as UserRole)}>
      <SelectTrigger><span className="truncate">{ROLE_LABELS[value]}</span></SelectTrigger>
      <SelectContent>
        {roles.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function UnitSelect({ value, onChange, units }: { value: string; onChange: (v: string) => void; units: { id: string; name: string }[] }) {
  return (
    <Select value={value || 'none'} onValueChange={(v) => onChange(!v || v === 'none' ? '' : v)}>
      <SelectTrigger>
        <span className="truncate">{value ? (units.find((u) => u.id === value)?.name ?? 'Sem unidade') : 'Sem unidade'}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sem unidade</SelectItem>
        {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function CreateUserDialog({ open, onOpenChange, units, callerRole, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; units: { id: string; name: string }[]; callerRole: UserRole; onDone: () => void
}) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', phone: '',
    role: 'operadora' as UserRole, unit_id: '',
  })
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await createUser({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
        role: form.role,
        unit_id: form.unit_id || null,
      })
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Utilizador criado com sucesso')
      onOpenChange(false)
      setForm({ first_name: '', last_name: '', email: '', password: '', phone: '', role: 'operadora', unit_id: '' })
      onDone()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Utilizador</DialogTitle>
          <DialogDescription>Cria uma conta de acesso ao CRM com cargo e unidade.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Primeiro Nome *</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Apelido *</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password inicial" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+351 9XX XXX XXX" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <RoleSelect value={form.role} onChange={(r) => setForm({ ...form, role: r })} callerRole={callerRole} />
            </div>
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <UnitSelect value={form.unit_id} onChange={(v) => setForm({ ...form, unit_id: v })} units={units} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="flex-1 bg-brand hover:bg-brand-dark text-white">
              {isPending && <Loader2 size={14} className="animate-spin mr-1" />}
              Criar Utilizador
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({ user, units, callerRole, onClose, onDone }: {
  user: UserRow; units: { id: string; name: string }[]; callerRole: UserRole; onClose: () => void; onDone: () => void
}) {
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone ?? '',
    role: user.role,
    unit_id: user.unit_id ?? '',
    is_active: user.is_active,
  })
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateUser({
        id: user.id,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || null,
        role: form.role,
        unit_id: form.unit_id || null,
        is_active: form.is_active,
      })
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Utilizador atualizado')
      onClose()
      onDone()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Utilizador</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
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
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <RoleSelect value={form.role} onChange={(r) => setForm({ ...form, role: r })} callerRole={callerRole} />
            </div>
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <UnitSelect value={form.unit_id} onChange={(v) => setForm({ ...form, unit_id: v })} units={units} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Conta ativa</p>
              <p className="text-xs text-muted-foreground">Se desativada, o utilizador não consegue operar.</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="flex-1 bg-brand hover:bg-brand-dark text-white">
              {isPending && <Loader2 size={14} className="animate-spin mr-1" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await resetUserPassword({ id: user.id, password })
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Password redefinida')
      onClose()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Redefinir Password</DialogTitle>
          <DialogDescription>{user.first_name} {user.last_name} — {user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nova Password</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova password" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="flex-1 bg-brand hover:bg-brand-dark text-white">
              {isPending && <Loader2 size={14} className="animate-spin mr-1" />}
              Redefinir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
