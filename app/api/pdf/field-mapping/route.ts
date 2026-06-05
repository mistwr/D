import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - Listar mappings de um template
export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const { searchParams } = new URL(req.url)
  const templateId = searchParams.get('template_id')

  if (!templateId) {
    return NextResponse.json({ error: 'template_id obrigatório' }, { status: 400 })
  }

  const { data: mappings, error } = await service
    .from('pdf_field_mappings')
    .select('*')
    .eq('template_id', templateId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mappings })
}

// POST - Criar/atualizar mappings
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const body = await req.json()
  const { template_id, mappings } = body

  if (!template_id || !mappings || !Array.isArray(mappings)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  // Verificar se é admin
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Apenas admin pode criar mappings' }, { status: 403 })
  }

  // Deletar mappings existentes
  await service.from('pdf_field_mappings').delete().eq('template_id', template_id)

  // Inserir novos mappings
  const { data: result, error } = await service.from('pdf_field_mappings').insert(
    mappings.map((m: any) => ({
      template_id,
      field_name: m.field_name,
      pdf_field_name: m.pdf_field_name || null,
      manual_x: m.manual_x || null,
      manual_y: m.manual_y || null,
      manual_page: m.manual_page || 0,
      manual_font_size: m.manual_font_size || 12,
      manual_alignment: m.manual_alignment || 'left',
    }))
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, mappings: result })
}
