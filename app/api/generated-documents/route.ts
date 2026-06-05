import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Função para substituir placeholders
function replacePlaceholders(template: string, data: Record<string, any>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder, 'g'), String(value || ''))
  }
  return result
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const body = await req.json()
  const { sale_id, document_type, document_html, operator, status } = body

  console.log('[v0] POST /api/generated-documents - sale_id:', sale_id, 'document_type:', document_type, 'has_html:', !!document_html)

  if (!sale_id || !document_type) {
    return NextResponse.json({ error: 'sale_id e document_type obrigatórios' }, { status: 400 })
  }

  try {
    // Buscar venda
    const { data: sale, error: saleError } = await service.from('vendas').select('*').eq('id', sale_id).single()
    if (saleError || !sale) {
      console.log('[v0] Venda não encontrada:', saleError)
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    // Verificar permissões (admin vê tudo, parceiro apenas suas vendas)
    const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
    
    if (!isAdmin && sale.user_id !== user.id) {
      console.log('[v0] Sem permissão - sale.user_id:', sale.user_id, 'user.id:', user.id)
      return NextResponse.json({ error: 'Sem permissão para gerar documento desta venda' }, { status: 403 })
    }

    let htmlContent = document_html
    
    // Se o HTML já foi pré-preenchido (vindo do formulário), usar diretamente
    if (!htmlContent) {
      console.log('[v0] Buscando template para operadora:', operator)
      // Buscar template para a operadora
      const { data: template } = await service.from('document_templates')
        .select('*')
        .eq('operator_name', operator || sale.operator)
        .eq('template_type', document_type)
        .single()

      if (!template) {
        console.log('[v0] Template não encontrado para:', operator)
        return NextResponse.json({ 
          error: `Template ${document_type} para operadora ${operator || sale.operator} não existe` 
        }, { status: 404 })
      }

      // Preparar dados para substituição
      const clientName = sale.client_name || 'Cliente'
      const vendorName = sale.vendor_name || 'Vendedor'
      
      const data = {
        nome_cliente: clientName,
        nif: sale.client_nif || '',
        morada: sale.client_address || '',
        telefone: sale.client_phone || '',
        email: sale.client_email || '',
        operadora: sale.operator || '',
        servico: sale.plano || '',
        data_venda: new Date(sale.created_at).toLocaleDateString('pt-PT'),
        vendedor: vendorName,
        parceiro: sale.parceiro_name || '',
      }

      // Substituir placeholders
      htmlContent = replacePlaceholders(template.template_content, data)
      console.log('[v0] Template preenchido com dados da venda')
    }

    // Criar documento
    console.log('[v0] Inserindo documento na BD...')
    const { data: generatedDoc, error: insertError } = await service.from('generated_documents').insert({
      sale_id,
      document_type,
      document_html: htmlContent,
      status: status || 'finalized',
      created_by: user.id
    }).select().single()

    if (insertError) {
      console.log('[v0] Erro ao inserir documento:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log('[v0] Documento guardado com sucesso! ID:', generatedDoc.id)
    return NextResponse.json(generatedDoc)
  } catch (error) {
    console.log('[v0] Erro na API generated-documents:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const { searchParams } = new URL(req.url)
  const saleId = searchParams.get('sale_id')

  if (!saleId) {
    return NextResponse.json({ error: 'sale_id obrigatório' }, { status: 400 })
  }

  // Buscar venda para verificar permissões
  const { data: sale } = await service.from('vendas').select('*').eq('id', saleId).single()
  if (!sale) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })

  // Verificar permissões
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
  
  if (!isAdmin && sale.created_by !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Buscar documentos da venda
  const { data: documents, error } = await service.from('generated_documents')
    .select('*')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: documents || [] })
}

export async function PUT(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const body = await req.json()
  const { id, document_html, status } = body

  if (!id) {
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  }

  // Buscar documento existente para verificar permissões
  const { data: existingDoc } = await service.from('generated_documents').select('sale_id, created_by').eq('id', id).single()
  if (!existingDoc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })

  // Verificar permissões
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
  
  if (!isAdmin && existingDoc.created_by !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Atualizar documento
  const { data: updated, error } = await service.from('generated_documents')
    .update({
      document_html: document_html || undefined,
      status: status || 'draft',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updated)
}
