'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatCurrency, fullName } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { Segment } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'
import { GripVertical, ChevronRight } from 'lucide-react'

interface PipelineStage {
  id: string
  name: string
  position: number
  color: string
  is_won: boolean
  is_lost: boolean
  segment: string
}

interface KanbanDeal {
  id: string
  title: string
  stage: string | null
  stage_id?: string | null
  value: number | null
  commission_value: number | null
  created_at: string
  clients?: { name: string } | null
  profiles?: { first_name: string; last_name: string } | null
}

interface Props {
  stages: PipelineStage[]
  deals: KanbanDeal[]
  segment: Segment
}

export function KanbanBoard({ stages, deals: initialDeals }: Props) {
  const [deals, setDeals] = useState(initialDeals)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  function belongsToStage(deal: KanbanDeal, stage: PipelineStage) {
    if (deal.stage_id) return deal.stage_id === stage.id
    if (deal.stage === stage.name) return true
    return stage.id === stages[0]?.id && !stages.some((s) => s.name === deal.stage)
  }

  function getDealsByStage(stage: PipelineStage) {
    return deals.filter((deal) => belongsToStage(deal, stage))
  }

  async function moveDeal(dealId: string, stage: PipelineStage) {
    const previous = deals
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stage: stage.name, stage_id: stage.id } : d))

    const { error } = await (supabase.from('deals') as any)
      .update({ stage: stage.name, stage_id: stage.id, updated_at: new Date().toISOString() })
      .eq('id', dealId)

    if (error) {
      setDeals(previous)
      toast.error('Erro ao mover negócio')
      return
    }
    startTransition(() => router.refresh())
  }

  function handleDragStart(e: React.DragEvent, dealId: string) {
    setDraggingId(dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e: React.DragEvent, stage: PipelineStage) {
    e.preventDefault()
    if (draggingId) moveDeal(draggingId, stage)
    setDraggingId(null)
    setOverStage(null)
  }

  const totalValue = deals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)

  return (
    <div className="min-w-0 flex-1 overflow-hidden">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{formatCurrency(totalValue)}</span>
        <span>valor total no funil</span>
      </div>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:thin]" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage)
          const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)
          const isOver = overStage === stage.id

          return (
            <div
              key={stage.id}
              className={cn(
                'flex w-[82vw] max-w-[300px] shrink-0 snap-start flex-col rounded-xl border transition-colors sm:w-72',
                stage.is_won ? 'border-green-200 bg-green-50/40' : stage.is_lost ? 'border-gray-200 bg-gray-50/40' : 'border-border bg-secondary/40',
                isOver && 'border-brand bg-brand-light/30',
              )}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverStage(stage.id) }}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="truncate text-xs font-semibold text-foreground">{stage.name}</span>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">{stageDeals.length}</span>
              </div>

              {stageValue > 0 && <div className="border-b border-border/50 px-3 py-1.5 text-xs text-muted-foreground">{formatCurrency(stageValue)}</div>}

              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {stageDeals.length === 0 && <div className={cn('rounded-lg border-2 border-dashed p-4 text-center text-xs text-muted-foreground', isOver ? 'border-brand text-brand' : 'border-border')}>{isOver ? 'Largar aqui' : 'Sem negócios'}</div>}

                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onDragEnd={() => { setDraggingId(null); setOverStage(null) }}
                    className={cn('kanban-card group', draggingId === deal.id && 'scale-95 opacity-40')}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical size={12} className="mt-0.5 hidden shrink-0 cursor-grab text-muted-foreground/40 sm:block" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold leading-tight text-foreground">{deal.title}</p>
                        {deal.clients && <p className="mt-0.5 truncate text-xs text-muted-foreground">{deal.clients.name}</p>}
                        {deal.value != null && <p className="mt-1 text-xs font-medium text-brand">{formatCurrency(deal.value)}</p>}
                        {deal.profiles && <p className="mt-0.5 truncate text-xs text-muted-foreground/70">{fullName(deal.profiles)}</p>}

                        <select
                          value={deal.stage_id ?? stage.id}
                          onChange={(e) => {
                            const target = stages.find((s) => s.id === e.target.value)
                            if (target) moveDeal(deal.id, target)
                          }}
                          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-2 text-xs sm:hidden"
                          aria-label="Mover negócio para etapa"
                        >
                          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <a href={`/crm/negocios/${deal.id}`} className="rounded p-1 text-muted-foreground opacity-70 sm:opacity-0 sm:group-hover:opacity-100"><ChevronRight size={14} /></a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
