import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { PDFDocument, rgb } from 'pdf-lib'
import { fetch as fetchPdf } from 'pdf-lib'

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
    const body = await req.json()
    const { sale_id, template_id, document_type } = body

    console.log('[v0] POST /api/pdf/fill - sale_id:', sale_id, 'template_id:', template_id)

    // Buscar venda
    const { data: sale, error: saleError } = await service
      .from('vendas')
      .select('*')
      .eq('id', sale_id)
      .single()

    if (saleError || !sale) {
      console.log('[v0] Venda não encontrada:', saleError)
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    // Verificar permissões
    const { data: profile } = await service
      .from('profiles')
      .select('role, is_superadmin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
    if (!isAdmin && sale.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Buscar template
    const { data: template, error: templateError } = await service
      .from('pdf_templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (templateError || !template || !template.active) {
      console.log('[v0] Template não encontrado ou inativo:', templateError)
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Buscar field mappings
    const { data: mappings, error: mappingError } = await service
      .from('pdf_field_mappings')
      .select('*')
      .eq('template_id', template_id)

    if (mappingError) {
      console.log('[v0] Erro ao buscar mappings:', mappingError)
      return NextResponse.json({ error: 'Erro ao carregar field mappings' }, { status: 500 })
    }

    // Preparar dados da venda
    const saleData = {
      nome_cliente: sale.client_name || '',
      nif: sale.client_nif || '',
      email: sale.client_email || '',
      telefone: sale.client_phone || '',
      morada: sale.client_address || '',
      operadora: sale.operator || '',
      pacote: sale.plano || '',
      data_venda: sale.created_at ? new Date(sale.created_at).toLocaleDateString('pt-PT') : '',
      vendedor: user.email || '',
    }

    // Carregar PDF do template
    console.log('[v0] Carregando PDF do URL:', template.file_url)
    const pdfBytes = await fetch(template.file_url).then(r => r.arrayBuffer())
    const pdfDoc = await PDFDocument.load(pdfBytes)

    console.log('[v0] PDF carregado. Total de páginas:', pdfDoc.getPageCount())

    // Se tem form fields, usar esses
    if (template.has_form_fields) {
      const form = pdfDoc.getForm()
      const fields = form.getFields()

      console.log('[v0] Formulário com', fields.length, 'campos encontrados')

      for (const field of fields) {
        const fieldName = field.getName()
        const mapping = mappings?.find(m => m.pdf_field_name === fieldName)
        const fieldValue = mapping ? saleData[mapping.field_name as keyof typeof saleData] : ''

        if (fieldValue) {
          try {
            const fieldType = field.constructor.name
            if (fieldType === 'PDFTextField') {
              (field as any).setText(String(fieldValue))
            }
          } catch (e) {
            console.log('[v0] Erro ao preencher campo', fieldName, ':', e)
          }
        }
      }
    } else {
      // Modo manual com posições X/Y
      console.log('[v0] Modo manual - preenchendo com posições X/Y')
      
      for (const mapping of mappings || []) {
        if (!mapping.manual_x || !mapping.manual_y) continue

        const fieldValue = saleData[mapping.field_name as keyof typeof saleData]
        if (!fieldValue) continue

        const pages = pdfDoc.getPages()
        const pageIndex = Math.min(mapping.manual_page || 0, pages.length - 1)
        const page = pages[pageIndex]

        try {
          page.drawText(String(fieldValue), {
            x: mapping.manual_x,
            y: page.getHeight() - mapping.manual_y,
            size: mapping.manual_font_size || 12,
            color: rgb(0, 0, 0),
          })
        } catch (e) {
          console.log('[v0] Erro ao desenhar texto no PDF:', e)
        }
      }
    }

    // Guardar PDF preenchido
    const filledPdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(filledPdfBytes)

    // Upload para Supabase Storage
    const fileName = `FA_${sale.operator}_${sale.client_nif}_${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await service.storage
      .from('vendas-pdfs')
      .upload(`${sale_id}/${fileName}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.log('[v0] Erro ao upload PDF:', uploadError)
      return NextResponse.json({ error: 'Erro ao guardar PDF' }, { status: 500 })
    }

    // Gerar signed URL
    const { data: { signedUrl } } = await service.storage
      .from('vendas-pdfs')
      .createSignedUrl(`${sale_id}/${fileName}`, 3600)

    // Guardar registro em generated_pdfs
    const { data: generatedPdf, error: insertError } = await service
      .from('generated_pdfs')
      .insert({
        sale_id,
        template_id,
        partner_id: sale.user_id,
        document_type: template.document_type,
        file_url: signedUrl,
        file_name: fileName,
        generated_data: saleData,
        status: 'generated',
      })
      .select()
      .single()

    if (insertError) {
      console.log('[v0] Erro ao guardar generated_pdf:', insertError)
      return NextResponse.json({ error: 'Erro ao registar PDF' }, { status: 500 })
    }

    console.log('[v0] PDF gerado com sucesso! ID:', generatedPdf.id)
    return NextResponse.json({
      success: true,
      pdf: generatedPdf,
      downloadUrl: signedUrl,
    })
  } catch (error) {
    console.log('[v0] Erro na API fill:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
