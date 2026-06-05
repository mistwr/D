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
  const templateType = searchParams.get('type') || 'FA'

  try {
    // 1. Procurar primeiro em document_templates customizados
    let query = service.from('document_templates').select('*')

    if (operator) {
      query = query.eq('operator_name', operator)
    }

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    const { data: templates, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    // Se encontrou template customizado, retornar
    if (templates && templates.length > 0) {
      return NextResponse.json({ template: templates[0] })
    }

    // 2. Se não encontrou, procurar em materiais (Formulários de Adesão)
    if (operator && templateType === 'FA') {
      // Procurar categoria de FA para a operadora
      const categoryName = `FA ${operator}`.toUpperCase()
      
      const { data: materiais_cats } = await service
        .from('materiais_categorias')
        .select('id, title')
        .eq('tipo', 'fa')
        .ilike('title', `%${operator}%`)
        .limit(1)

      if (materiais_cats && materiais_cats.length > 0) {
        const catId = materiais_cats[0].id
        
        // Buscar PDFs dessa categoria
        const { data: ficheiros } = await service
          .from('materiais_ficheiros')
          .select('id, file_name, file_path, signed_url')
          .eq('categoria_id', catId)
          .in('file_type', ['pdf', 'application/pdf'])
          .limit(1)

        if (ficheiros && ficheiros.length > 0) {
          const file = ficheiros[0]
          
          // Gerar signed URL se não tiver
          let fileUrl = file.signed_url
          if (!fileUrl && file.file_path) {
            const { data: { signedURL } } = await service.storage
              .from('materiais')
              .createSignedUrl(file.file_path, 3600)
            fileUrl = signedURL
          }

          return NextResponse.json({ 
            template: {
              id: file.id,
              operator_name: operator,
              template_type: 'FA',
              template_name: file.file_name,
              file_url: fileUrl,
              source: 'materiais'
            }
          })
        }
      }
    }

    // Se nada encontrou, retornar null
    return NextResponse.json({ template: null })
  } catch (error) {
    console.log('[v0] Error fetching template:', error)
    return NextResponse.json({ error: 'Erro ao buscar template' }, { status: 500 })
  }
}
