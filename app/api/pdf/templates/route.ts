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

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const service = svc()
    
    // Verificar se é admin
    const { data: profile } = await service
      .from('profiles')
      .select('role, is_superadmin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
    if (!isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const operator = formData.get('operator') as string
    const documentType = formData.get('documentType') as string

    if (!file || !name || !operator || !documentType) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    // Upload para storage (usar bucket 'documentos' que já existe)
    const fileName = `pdf_templates/${operator}/${documentType}/${Date.now()}.pdf`
    const buffer = await file.arrayBuffer()

    console.log('[v0] Upload PDF template:', fileName)

    const { data: uploadData, error: uploadError } = await service.storage
      .from('documentos')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.log('[v0] Erro no upload:', uploadError)
      return NextResponse.json({ error: `Erro ao fazer upload: ${uploadError.message}` }, { status: 500 })
    }

    // Gerar signed URL
    const { data: { signedUrl } } = await service.storage
      .from('documentos')
      .createSignedUrl(fileName, 86400 * 30) // 30 dias

    // Guardar na BD
    const { data: template, error: insertError } = await service
      .from('pdf_templates')
      .insert({
        name,
        operator,
        document_type: documentType,
        file_url: signedUrl,
        file_name: fileName,
        has_form_fields: false,
        active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.log('[v0] Erro ao guardar template:', insertError)
      return NextResponse.json({ error: 'Erro ao guardar template' }, { status: 500 })
    }

    console.log('[v0] Template criado com sucesso! ID:', template.id)
    return NextResponse.json(template)
  } catch (error) {
    console.log('[v0] Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const service = svc()
    const { searchParams } = new URL(req.url)
    const operator = searchParams.get('operator')
    const documentType = searchParams.get('documentType')

    let query = service.from('pdf_templates').select('*').eq('active', true)

    if (operator) query = query.eq('operator', operator)
    if (documentType) query = query.eq('document_type', documentType)

    const { data: templates, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.log('[v0] Erro na API GET templates:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
