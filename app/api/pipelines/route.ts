import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('pipelines').select('*, pipeline_estados(*)').order('ordem', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { estados, ...pipeline } = body
  
  const { data: newPipeline, error } = await supabase.from('pipelines').insert(pipeline).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  if (estados && estados.length > 0) {
    const estadosWithPipeline = estados.map((e: any, i: number) => ({ ...e, pipeline_id: newPipeline.id, ordem: i }))
    await supabase.from('pipeline_estados').insert(estadosWithPipeline)
  }
  
  return NextResponse.json(newPipeline)
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { id, estados, ...rest } = body
  
  const { data, error } = await supabase.from('pipelines').update(rest).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  if (estados) {
    await supabase.from('pipeline_estados').delete().eq('pipeline_id', id)
    if (estados.length > 0) {
      const estadosWithPipeline = estados.map((e: any, i: number) => ({ 
        nome: e.nome, cor: e.cor, is_final: e.is_final, pipeline_id: id, ordem: i 
      }))
      await supabase.from('pipeline_estados').insert(estadosWithPipeline)
    }
  }
  
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })
  const { error } = await supabase.from('pipelines').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
