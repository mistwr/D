'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatCurrency, fullName } from '@/lib/format'
import { DEAL_STAGE_LABELS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { DealStage, Segment } from '@/lib/supabase/types'
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
  stage: string
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

export function KanbanBoard({ stages, deals: initialDeals, segment }: Props) {
  const [deals, setDeals] = useState(initialDeals)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  function getDealsByStage(stageName: string) {
    return deals.filter((d) => d.stage === stageName || (stageName === stages[0]?.name && !stages.find(s => s.name === d.stage)))
  }

  // Map stage names to deal_stage enum values for Supabase
  const stageNameToEnum: Record<string, DealStage> = {
    'Nova Lead': 'nova_lead', 'Contactar': 'contactar', 'Contactado': 'contactado',
    'Documentacao Solicitada': 'documentacao_solicitada', 'Documentacao Recebida': 'documentacao_recebida',
    'Em Analise': 'em_analise', 'Proposta': 'proposta', 'Aguardar Cliente': 'aguardar_cliente',
    'Contrato Fechado': 'contrato_fechado', 'Aguardar Comissao': 'aguardar_comissao',
    'Comissao Recebida': 'comissao_recebida', 'Fechado': 'fechado', 'Perdido': 'perdido',
  }

  async function moveDeal(dealId: string, newStageName: string) {
    const newStageEnum = stageNameToEnum[newStageName]
    if (!newStageEnum) return

    // Optimistic update
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stage: newStageName } : d))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('deals') as any)
      .update({ stage: newStageEnum })
      .eq('id', dealId)

    if (error) {
      toast.error('Erro ao mover negócio')
      setDeals(initialDeals)
    } else {
      startTransition(() => router.refresh())
    }
  }

  function handleDragStart(e: React.DragEvent, dealId: string) {
    setDraggingId(dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, stageName: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverStage(stageName)
  }

  function handleDrop(e: React.DragEvent, stageName: string) {
    e.preventDefault()
    if (draggingId) moveDeal(draggingId, stageName)
    setDraggingId(null)
    setOverStage(null)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setOverStage(null)
  }

  const totalValue = deals.reduce((s, d) => s + (d.value ?? 0), 0)

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span className="font-medium text-foreground">{formatCurrency(totalValue)}</span>
        <span>valor total no funil</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.name)
          const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0)
          const isOver = overStage === stage.name

          return (
            <div
              key={stage.id}
              className={cn(
                'flex-shrink-0 w-64 flex flex-col rounded-xl border transition-colors',
                stage.is_won ? 'border-green-200 bg-green-50/40' :
                stage.is_lost ? 'border-gray-200 bg-gray-50/40' :
                'border-border bg-secondary/40',
                isOver && 'border-brand bg-brand-light/30',
              )}
              onDragOver={(e) => handleDragOver(e, stage.name)}
              onDrop={(e) => handleDrop(e, stage.name)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-semibold text-foreground truncate">{stage.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">
                    {stageDeals.length}
                  </span>
                </div>
              </div>

              {/* Value summary */}
              {stageValue > 0 && (
                <div className="px-3 py-1.5 border-b border-border/50">
                  <p className="text-xs text-muted-foreground">{formatCurrency(stageValue)}</p>
                </div>
              )}

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {stageDeals.length === 0 && (
                  <div className={cn(
                    'border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground transition-colors',
                    isOver ? 'border-brand text-brand' : 'border-border',
                  )}>
                    {isOver ? 'Largar aqui' : 'Sem negócios'}
                  </div>
                )}
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'kanban-card group',
                      draggingId === deal.id && 'opacity-40 scale-95',
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical size={12} className="text-muted-foreground/40 shrink-0 mt-0.5 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-tight truncate">{deal.title}</p>
                        {deal.clients && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{deal.clients.name}</p>
                        )}
                        {deal.value != null && (
                          <p className="text-xs font-medium text-brand mt-1">{formatCurrency(deal.value)}</p>
                        )}
                        {deal.profiles && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{fullName(deal.profiles)}</p>
                        )}
                      </div>
                      <a href={`/crm/negocios/${deal.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={12} className="text-muted-foreground" />
                      </a>
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
