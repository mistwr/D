import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

async function verifyAdmin(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-access-token')?.value
  if (!token) return null
  
  const supabase = getAdminClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') return null
  return user
}

// GET - Listar templates
export async function GET(req: NextRequest) {
  const supabase = getAdminClient()
  const { searchParams } = new URL(req.url)
  const operadora = searchParams.get('operadora')
  const servico = searchParams.get('servico')
  const tipo = searchParams.get('tipo')
  
  let query = supabase
    .from('pdf_templates')
    .select('*')
    .eq('ativo', true)
    .order('created_at', { ascending: false })
  
  if (operadora) query = query.eq('operadora', operadora)
  if (servico) query = query.eq('servico', servico)
  if (tipo) query = query.eq('tipo', tipo)
  
  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

// POST - Criar template (admin only)
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  
  const body = await req.json()
  const supabase = getAdminClient()
  
  const { data, error } = await supabase
    .from('pdf_templates')
    .insert({
      nome: body.nome,
      tipo: body.tipo,
      operadora: body.operadora || null,
      servico: body.servico || null,
      file_path: body.file_path,
      file_name: body.file_name,
      campos_mapeados: body.campos_mapeados || {},
    })
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

// PATCH - Actualizar template
export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  
  const body = await req.json()
  const { id, ...updates } = body
  
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })
  
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('pdf_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

// DELETE - Desactivar template
export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })
  
  const supabase = getAdminClient()
  const { error } = await supabase
    .from('pdf_templates')
    .update({ ativo: false })
    .eq('id', id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
