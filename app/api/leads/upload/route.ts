import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface LeadRow {
  nome?: string
  email?: string
  telefone?: string
  morada?: string
  cidade?: string
  codigo_postal?: string
  nif?: string
  empresa?: string
  servico?: string
  operadora?: string
  notas?: string
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = svc()
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return NextResponse.json({ error: 'Ficheiro obrigatório' }, { status: 400 })
  }

  const fileType = file.type
  const fileName = file.name
  let leads: LeadRow[] = []
  let parsedSuccessfully = false

  try {
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    if (fileType.includes('spreadsheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Processar Excel
      const workbook = XLSX.read(uint8Array)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      leads = XLSX.utils.sheet_to_json<LeadRow>(sheet)
      parsedSuccessfully = true
    } else if (fileType.includes('csv') || fileName.endsWith('.csv')) {
      // Processar CSV
      const text = new TextDecoder().decode(uint8Array)
      const result = Papa.parse<LeadRow>(text, { header: true, skipEmptyLines: true })
      leads = result.data.filter(row => row.nome || row.email)
      parsedSuccessfully = true
    }

    if (!parsedSuccessfully || leads.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum lead encontrado no ficheiro' },
        { status: 400 }
      )
    }

    // Criar registo de upload
    const { data: uploadRecord } = await service
      .from('lead_uploads')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_type: fileName.endsWith('.xlsx') ? 'excel' : fileName.endsWith('.csv') ? 'csv' : 'pdf',
        total_rows: leads.length,
        success_rows: 0,
        error_rows: 0,
        upload_status: 'processing',
        uploaded_by: user.id
      })
      .select()
      .single()

    // Inserir leads
    let successCount = 0
    let errorCount = 0
    const insertedLeads = []

    for (const lead of leads) {
      try {
        if (!lead.nome) {
          errorCount++
          continue
        }

        const { data: inserted } = await service
          .from('leads')
          .insert({
            user_id: user.id,
            nome: lead.nome || '',
            email: lead.email || null,
            telefone: lead.telefone || null,
            morada: lead.morada || null,
            cidade: lead.cidade || null,
            codigo_postal: lead.codigo_postal || null,
            nif: lead.nif || null,
            empresa: lead.empresa || null,
            servico: lead.servico || null,
            operadora: lead.operadora || null,
            notas: lead.notas || null,
            uploaded_by: user.id
          })
          .select()
          .single()

        if (inserted) {
          successCount++
          insertedLeads.push(inserted)
        }
      } catch (e) {
        errorCount++
        console.log('[v0] Error inserting lead:', e)
      }
    }

    // Atualizar registo de upload
    if (uploadRecord) {
      await service
        .from('lead_uploads')
        .update({
          success_rows: successCount,
          error_rows: errorCount,
          upload_status: errorCount === 0 ? 'completed' : 'completed'
        })
        .eq('id', uploadRecord.id)
    }

    return NextResponse.json({
      success: true,
      uploadId: uploadRecord?.id,
      totalRows: leads.length,
      successRows: successCount,
      errorRows: errorCount,
      leads: insertedLeads
    })
  } catch (error) {
    console.log('[v0] Error processing file:', error)
    return NextResponse.json(
      { error: 'Erro ao processar ficheiro' },
      { status: 500 }
    )
  }
}
