'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatRelative } from '@/lib/format'
import type { Notification, NotificationType } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { Bell, CheckCheck, Users, GitBranch, DollarSign, RefreshCw, FileText, Settings, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  lead: Users,
  task: CheckSquare,
  deal: GitBranch,
  commission: DollarSign,
  renewal: RefreshCw,
  document: FileText,
  system: Settings,
}

const TYPE_COLORS: Record<NotificationType, string> = {
  lead: 'bg-blue-50 text-blue-600',
  task: 'bg-amber-50 text-amber-600',
  deal: 'bg-teal-50 text-teal-600',
  commission: 'bg-green-50 text-green-600',
  renewal: 'bg-orange-50 text-orange-600',
  document: 'bg-violet-50 text-violet-600',
  system: 'bg-gray-100 text-gray-600',
}

export function NotificacoesPanel({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  const unread = items.filter((n) => !n.is_read)

  async function markAsRead(id: string) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('id', id)
  }

  async function markAllRead() {
    const ids = unread.map((n) => n.id)
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('notifications') as any).update({ is_read: true }).in('id', ids)
    toast.success('Todas as notificações marcadas como lidas')
    startTransition(() => router.refresh())
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          {unread.length > 0 ? `${unread.length} não lida${unread.length !== 1 ? 's' : ''}` : 'Tudo lido'}
        </p>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5 text-xs">
            <CheckCheck size={14} /> Marcar tudo como lido
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
            <Bell size={32} className="text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Sem notificações</p>
            <p className="text-xs text-muted-foreground mt-1">Está tudo em dia</p>
          </div>
        ) : (
          items.map((notif) => {
            const Icon = TYPE_ICONS[notif.type] ?? Bell
            const iconStyle = TYPE_COLORS[notif.type] ?? 'bg-gray-100 text-gray-600'

            return (
              <div
                key={notif.id}
                className={cn(
                  'flex items-start gap-3 p-4 bg-card border rounded-xl transition-colors',
                  !notif.is_read ? 'border-brand/30 bg-brand-light/5' : 'border-border',
                )}
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconStyle)}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm', !notif.is_read ? 'font-semibold' : 'font-medium')}>{notif.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{formatRelative(notif.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {notif.link && (
                      <Link href={notif.link} className="text-xs text-brand hover:underline">
                        Ver detalhes
                      </Link>
                    )}
                    {!notif.is_read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Marcar como lido
                      </button>
                    )}
                  </div>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
