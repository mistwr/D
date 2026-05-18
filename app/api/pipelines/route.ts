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
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data, error } = await service.from('pipelines').select('*, pipeline_estados(*)').order('ordem', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { estados, ...pipeline } = body
  
  const { data: newPipeline, error } = await service.from('pipelines').insert(pipeline).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  if (estados && estados.length > 0) {
    const estadosWithPipeline = estados.map((e: any, i: number) => ({ ...e, pipeline_id: newPipeline.id, ordem: i }))
    await service.from('pipeline_estados').insert(estadosWithPipeline)
  }
  
  return NextResponse.json(newPipeline)
}

export async function PUT(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { id, estados, ...rest } = body
  
  const { data, error } = await service.from('pipelines').update(rest).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  if (estados) {
    await service.from('pipeline_estados').delete().eq('pipeline_id', id)
    if (estados.length > 0) {
      const estadosWithPipeline = estados.map((e: any, i: number) => ({ 
        nome: e.nome, cor: e.cor, is_final: e.is_final, pipeline_id: id, ordem: i 
      }))
      await service.from('pipeline_estados').insert(estadosWithPipeline)
    }
  }
  
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })
  const { error } = await service.from('pipelines').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
