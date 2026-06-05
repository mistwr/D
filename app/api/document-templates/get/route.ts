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

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const { searchParams } = new URL(req.url)
  const operator = searchParams.get('operator')
  const templateType = searchParams.get('type')

  try {
    let query = service.from('document_templates').select('*')

    if (operator) {
      query = query.eq('operator_name', operator)
    }

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    const { data: templates, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    // Retornar primeiro template encontrado
    const template = templates?.[0]
    return NextResponse.json({ template: template || null })
  } catch (error) {
    console.log('[v0] Error fetching template:', error)
    return NextResponse.json({ error: 'Erro ao buscar template' }, { status: 500 })
  }
}
