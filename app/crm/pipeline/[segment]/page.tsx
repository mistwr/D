import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/crm/page-header'
import { KanbanBoard } from '@/components/crm/kanban-board'
import { NewNegocioButton } from '@/components/crm/new-negocio-button'
import { SEGMENT_LABELS } from '@/lib/constants'
import type { Segment } from '@/lib/supabase/types'

const VALID_SEGMENTS: Segment[] = ['energia', 'telecom', 'credito', 'imobiliario', 'seguros']

export async function generateMetadata({ params }: { params: Promise<{ segment: string }> }): Promise<Metadata> {
  const { segment } = await params
  const label = SEGMENT_LABELS[segment as Segment] ?? segment
  return { title: `Pipeline ${label} — CRM PARCENDi` }
}

export default async function PipelinePage({ params }: { params: Promise<{ segment: string }> }) {
  const { segment } = await params

  if (!VALID_SEGMENTS.includes(segment as Segment)) notFound()

  const supabase = await createClient()

  const [stagesRes, dealsRes, clientsRes, profilesRes] = await Promise.all([
    supabase
      .from('pipeline_stages')
      .select('*')
      .eq('segment', segment)
      .eq('is_active', true)
      .order('position'),
    supabase
      .from('deals')
      .select(`
        id, title, stage, value, commission_value, created_at,
        clients!deals_client_id_fkey (name),
        profiles!deals_assigned_to_fkey (first_name, last_name)
      `)
      .eq('segment', segment)
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name').eq('is_active', true).limit(500),
    supabase.from('profiles').select('id, first_name, last_name').eq('is_active', true),
  ])

  const label = SEGMENT_LABELS[segment as Segment]

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <PageHeader
        title={`Pipeline — ${label}`}
        description={`${dealsRes.data?.length ?? 0} negócios no funil de ${label}`}
        action={
          <NewNegocioButton
            clients={clientsRes.data ?? []}
            profiles={profilesRes.data ?? []}
            defaultSegment={segment as Segment}
          />
        }
      />
      <KanbanBoard
        stages={stagesRes.data ?? []}
        deals={dealsRes.data ?? []}
        segment={segment as Segment}
      />
    </div>
  )
}
