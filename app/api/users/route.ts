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
  
  // Verificar se e admin
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  // Buscar todos os utilizadores com os seus perfis
  const { data, error } = await service
    .from('profiles')
    .select('id, full_name, email, role, company_name, phone, cargo_id, responsavel_id, unidade_id, created_at')
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data || [] })
}

export async function PUT(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Verificar se e admin
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 })

  // Filtrar apenas campos validos para update
  const allowedFields = ['cargo_id', 'responsavel_id', 'unidade_id', 'role']
  const filteredUpdates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in updates) {
      filteredUpdates[key] = updates[key] || null
    }
  }

  const { data, error } = await service
    .from('profiles')
    .update(filteredUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
