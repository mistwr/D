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

  const service = svc()
  const body = await req.json()
  const { saleId } = body

  if (!saleId) {
    return NextResponse.json({ error: 'saleId obrigatório' }, { status: 400 })
  }

  try {
    // Buscar dados da venda
    const { data: sale, error: saleError } = await service
      .from('vendas')
      .select('*')
      .eq('id', saleId)
      .single()

    if (saleError || !sale) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    // Verificar se é telecom
    if (sale.service_type !== 'telecom') {
      return NextResponse.json({ error: 'PDF gerado apenas para vendas de telecom' }, { status: 400 })
    }

    // Buscar template da operadora
    const { data: template } = await service
      .from('document_templates')
      .select('*')
      .eq('operator_name', sale.operator)
      .eq('template_type', 'FA')
      .single()

    // Preparar dados para substituição de placeholders
    const placeholderData = {
      nome_cliente: sale.client_name || '',
      nif: sale.client_nif || '',
      morada: sale.client_address || '',
      telefone: sale.client_phone || '',
      email: sale.client_email || '',
      operadora: sale.operator || '',
      servico: sale.plano || '',
      data_venda: new Date(sale.created_at).toLocaleDateString('pt-PT'),
      vendedor: user.email || '',
      cc: sale.client_cc || '',
      iban: sale.client_iban || '',
      tipo_contrato: sale.contract_type || '',
      valor: sale.amount ? `€${sale.amount.toFixed(2)}` : '€0,00',
    }

    // Criar conteúdo HTML preenchido
    let htmlContent = template?.template_content || `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h1 style="color: #333; text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">FA - Folha de Adesão</h1>
        
        <div style="margin-top: 20px;">
          <h2 style="color: #0ea5e9; font-size: 16px; margin-bottom: 10px;">Dados do Cliente</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold; width: 30%;">Nome:</td>
              <td style="padding: 8px;">${placeholderData.nome_cliente}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">NIF:</td>
              <td style="padding: 8px;">${placeholderData.nif}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">Telefone:</td>
              <td style="padding: 8px;">${placeholderData.telefone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">Email:</td>
              <td style="padding: 8px;">${placeholderData.email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">Morada:</td>
              <td style="padding: 8px;">${placeholderData.morada}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 20px;">
          <h2 style="color: #0ea5e9; font-size: 16px; margin-bottom: 10px;">Dados do Contrato</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold; width: 30%;">Operadora:</td>
              <td style="padding: 8px;">${placeholderData.operadora}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">Serviço/Plano:</td>
              <td style="padding: 8px;">${placeholderData.servico}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">Tipo de Contrato:</td>
              <td style="padding: 8px;">${placeholderData.tipo_contrato}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">Data da Venda:</td>
              <td style="padding: 8px;">${placeholderData.data_venda}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">Valor:</td>
              <td style="padding: 8px; color: #059669; font-weight: bold;">${placeholderData.valor}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            Documento gerado automaticamente. Vendedor: <strong>${placeholderData.vendedor}</strong>
          </p>
        </div>
      </div>
    `

    // Substitui placeholders se houver template customizado
    if (template?.template_content) {
      Object.entries(placeholderData).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
        htmlContent = htmlContent.replace(placeholder, String(value))
      })
    }

    // Salvar documento gerado
    const { data: generatedDoc, error: docError } = await service
      .from('generated_documents')
      .insert({
        sale_id: saleId,
        template_id: template?.id || null,
        document_type: 'FA',
        document_html: htmlContent,
        status: 'draft',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (docError) {
      console.log('[v0] Error creating document:', docError)
      return NextResponse.json({ error: 'Erro ao criar documento' }, { status: 500 })
    }

    return NextResponse.json({ document: generatedDoc, htmlContent })
  } catch (error) {
    console.log('[v0] Error generating PDF:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
