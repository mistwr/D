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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Buscar template para obter o file_name
    const { data: template, error: fetchError } = await service
      .from('pdf_templates')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Deletar arquivo do storage
    if (template.file_name) {
      await service.storage
        .from('pdf-templates')
        .remove([template.file_name])
    }

    // Deletar template da BD (cascata apaga field_mappings e generated_pdfs)
    const { error: deleteError } = await service
      .from('pdf_templates')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.log('[v0] Erro ao deletar template:', deleteError)
      return NextResponse.json({ error: 'Erro ao deletar template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log('[v0] Erro na API DELETE:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
