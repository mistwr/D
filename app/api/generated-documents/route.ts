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
  const { sale_id, document_type } = body

  if (!sale_id || !document_type) {
    return NextResponse.json({ error: 'sale_id e document_type obrigatórios' }, { status: 400 })
  }

  // Buscar venda
  const { data: sale } = await service.from('vendas').select('*').eq('id', sale_id).single()
  if (!sale) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })

  // Verificar permissões (admin vê tudo, parceiro apenas suas vendas)
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.is_superadmin
  
  if (!isAdmin && sale.created_by !== user.id) {
    return NextResponse.json({ error: 'Sem permissão para gerar documento desta venda' }, { status: 403 })
  }

  // Buscar template para a operadora
  const { data: template } = await service.from('document_templates')
    .select('*')
    .eq('operator_name', sale.operadora)
    .eq('template_type', document_type)
    .single()

  if (!template) {
    return NextResponse.json({ 
      error: `Template ${document_type} para operadora ${sale.operadora} não existe` 
    }, { status: 404 })
  }

  // Preparar dados para substituição
  const clientName = sale.cliente_nome || 'Cliente'
  const vendorName = sale.vendedor_nome || 'Vendedor'
  
  const data = {
    nome_cliente: clientName,
    nif: sale.nif || '',
    morada: sale.morada || '',
    telefone: sale.telefone || '',
    email: sale.email || '',
    operadora: sale.operadora || '',
    servico: sale.servico || '',
    data_venda: new Date(sale.created_at).toLocaleDateString('pt-PT'),
    vendedor: vendorName,
    parceiro: sale.parceiro_nome || '',
  }

  // Substituir placeholders
  const htmlContent = replacePlaceholders(template.template_content, data)

  // Criar documento
  const { data: generatedDoc, error: insertError } = await service.from('generated_documents').insert({
    sale_id,
    template_id: template.id,
    document_type,
    document_html: htmlContent,
    status: 'draft',
    created_by: user.id
  }).select().single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(generatedDoc)
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
