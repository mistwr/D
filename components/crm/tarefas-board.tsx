'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate, fullName } from '@/lib/format'
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/constants'
import type { TaskStatus, TaskPriority } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PRIORITY_CONFIG: Record<TaskPriority, { icon: React.ElementType; color: string }> = {
  baixa: { icon: Circle, color: 'text-slate-400' },
  media: { icon: Clock, color: 'text-blue-500' },
  alta: { icon: AlertCircle, color: 'text-amber-500' },
  urgente: { icon: AlertCircle, color: 'text-red-500' },
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  em_progresso: { label: 'Em Progresso', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  concluida: { label: 'Concluída', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  cancelada: { label: 'Cancelada', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  completed_at: string | null
  created_at: string
  profiles?: { first_name: string; last_name: string } | null
}

export function TarefasBoard({ tasks }: { tasks: Task[] }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  const filtered = tasks.filter((t) => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
    return matchStatus && matchPriority
  })

  const pendentes = filtered.filter((t) => t.status === 'pendente')
  const emProgresso = filtered.filter((t) => t.status === 'em_progresso')
  const concluidas = filtered.filter((t) => t.status === 'concluida')
  const canceladas = filtered.filter((t) => t.status === 'cancelada')

  async function toggleComplete(task: Task) {
    const newStatus: TaskStatus = task.status === 'concluida' ? 'pendente' : 'concluida'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('tasks') as any)
      .update({ status: newStatus, completed_at: newStatus === 'concluida' ? new Date().toISOString() : null })
      .eq('id', task.id)
    if (error) { toast.error('Erro ao atualizar tarefa'); return }
    toast.success(newStatus === 'concluida' ? 'Tarefa concluída' : 'Tarefa reaberta')
    startTransition(() => router.refresh())
  }

  function TaskCard({ task }: { task: Task }) {
    const Pr = PRIORITY_CONFIG[task.priority as TaskPriority]
    const isDone = task.status === 'concluida'
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone

    return (
      <div className={cn(
        'group flex items-start gap-3 p-3 bg-card border rounded-lg transition-colors hover:border-brand/40',
        isDone && 'opacity-60',
        isOverdue && 'border-red-200 bg-red-50/30',
      )}>
        <button onClick={() => toggleComplete(task)} className="mt-0.5 shrink-0">
          {isDone
            ? <CheckCircle2 size={18} className="text-green-500" />
            : <Circle size={18} className="text-muted-foreground group-hover:text-brand transition-colors" />
          }
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', isDone && 'line-through text-muted-foreground')}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {Pr && (
              <div className="flex items-center gap-1">
                <Pr.icon size={11} className={Pr.color} />
                <span className="text-xs text-muted-foreground">{TASK_PRIORITY_LABELS[task.priority as TaskPriority]}</span>
              </div>
            )}
            {task.due_date && (
              <span className={cn('text-xs', isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                {isOverdue && '⚠ '}Prazo: {formatDate(task.due_date)}
              </span>
            )}
            {task.profiles && (
              <span className="text-xs text-muted-foreground">{fullName(task.profiles)}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  function Column({ title, tasks, color }: { title: string; tasks: Task[]; color: string }) {
    const [open, setOpen] = useState(true)
    return (
      <div className="space-y-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 w-full text-left"
        >
          <div className={cn('w-2 h-2 rounded-full', color)} />
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">{tasks.length}</span>
          <ChevronDown size={14} className={cn('ml-auto text-muted-foreground transition-transform', !open && '-rotate-90')} />
        </button>
        {open && (
          <div className="space-y-2 pl-4">
            {tasks.length === 0
              ? <p className="text-xs text-muted-foreground py-2">Sem tarefas</p>
              : tasks.map((t) => <TaskCard key={t.id} task={t} />)
            }
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground flex items-center">{filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-6">
        <Column title="Pendentes" tasks={pendentes} color="bg-yellow-400" />
        <Column title="Em Progresso" tasks={emProgresso} color="bg-blue-500" />
        <Column title="Concluídas" tasks={concluidas} color="bg-green-500" />
        {canceladas.length > 0 && <Column title="Canceladas" tasks={canceladas} color="bg-gray-400" />}
      </div>
    </div>
  )
}
