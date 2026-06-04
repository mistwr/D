import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/supabase/get-auth-user'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se é admin
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
  if (!isAdmin) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const operator = searchParams.get('operator')
  const templateType = searchParams.get('type')

  let query = service.from('document_templates').select('*')
  
  if (operator) query = query.eq('operator_name', operator)
  if (templateType) query = query.eq('template_type', templateType)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data || [] })
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se é admin
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
  if (!isAdmin) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { operator_name, template_type, template_name, template_content, fields_mapping } = body

  if (!operator_name || !template_type || !template_name) {
    return NextResponse.json({ error: 'Campos obrigatórios: operator_name, template_type, template_name' }, { status: 400 })
  }

  const { data, error } = await service.from('document_templates').insert({
    operator_name,
    template_type,
    template_name,
    template_content: template_content || '',
    fields_mapping: fields_mapping || {},
    created_by: user.id
  }).select().single()

  if (error) {
    if (error.message.includes('duplicate')) {
      return NextResponse.json({ error: `Template ${template_type} para ${operator_name} já existe` }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se é admin
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
  if (!isAdmin) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { id, operator_name, template_type, template_name, template_content, fields_mapping } = body

  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { data, error } = await service.from('document_templates')
    .update({
      template_name,
      template_content: template_content || '',
      fields_mapping: fields_mapping || {},
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se é admin
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
  if (!isAdmin) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { error } = await service.from('document_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({ success: true })
}
