import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET - Obter documento para assinatura
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })
  }
  
  const supabase = getAdminClient()
  
  const { data: pdfGerado, error } = await supabase
    .from('pdf_gerados')
    .select(`
      *,
      vendas (
        client_name,
        client_email
      ),
      pdf_templates (
        nome
      )
    `)
    .eq('id', id)
    .single()
  
  if (error || !pdfGerado) {
    return NextResponse.json({ error: 'Documento nao encontrado' }, { status: 404 })
  }
  
  // Gerar URL assinada para o PDF
  const { data: signedUrl } = await supabase.storage
    .from('documentos')
    .createSignedUrl(pdfGerado.file_path, 3600) // 1 hora
  
  return NextResponse.json({
    document: {
      id: pdfGerado.id,
      venda_id: pdfGerado.venda_id,
      template_name: pdfGerado.pdf_templates?.nome || 'Documento',
      client_name: pdfGerado.vendas?.client_name || 'Cliente',
      file_url: signedUrl?.signedUrl || null,
      signed: !!pdfGerado.assinatura_path,
    }
  })
}

// POST - Guardar assinatura
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { document_id, signature } = body
  
  if (!document_id || !signature) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }
  
  const supabase = getAdminClient()
  const headersList = await headers()
  const clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  
  // Converter base64 para buffer
  const base64Data = signature.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  
  // Upload da assinatura
  const signaturePath = `assinaturas/${document_id}_${Date.now()}.png`
  const { error: uploadError } = await supabase.storage
    .from('documentos')
    .upload(signaturePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    })
  
  if (uploadError) {
    return NextResponse.json({ error: 'Erro ao guardar assinatura' }, { status: 500 })
  }
  
  // Actualizar documento com assinatura
  const { error: updateError } = await supabase
    .from('pdf_gerados')
    .update({
      assinatura_path: signaturePath,
      assinatura_data: new Date().toISOString(),
      assinatura_ip: clientIp,
    })
    .eq('id', document_id)
  
  if (updateError) {
    return NextResponse.json({ error: 'Erro ao actualizar documento' }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
