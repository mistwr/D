import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('permissoes').select('*, cargos(nome, nivel)').order('cargo_id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { cargo_id, permissao, valor } = body
  
  const { data, error } = await supabase.from('permissoes')
    .upsert({ cargo_id, permissao, valor }, { onConflict: 'cargo_id,permissao' })
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  
  // Actualizar multiplas permissoes de uma vez
  if (Array.isArray(body)) {
    const results = []
    for (const p of body) {
      const { data, error } = await supabase.from('permissoes')
        .upsert({ cargo_id: p.cargo_id, permissao: p.permissao, valor: p.valor }, { onConflict: 'cargo_id,permissao' })
        .select()
        .single()
      if (!error) results.push(data)
    }
    return NextResponse.json(results)
  }
  
  const { data, error } = await supabase.from('permissoes').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
