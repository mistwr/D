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
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const parceiro_id = isAdmin
    ? (req.nextUrl.searchParams.get('parceiro_id') ?? user.id)
    : user.id

  const { data, error } = await service
    .from('comissoes_operadora')
    .select('*')
    .eq('parceiro_id', parceiro_id)
    .order('servico')
    .order('operadora')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comissoes: data })
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const body = await req.json()
  const { parceiro_id, servico, operadora, plano, valor_comissao, modelo, num_mensalidades, valor_mensal, percentagem } = body

  if (!parceiro_id || !servico || !operadora) {
    return NextResponse.json({ error: 'Preencha todos os campos obrigatorios: parceiro, servico e operadora' }, { status: 400 })
  }

  const { data, error } = await service
    .from('comissoes_operadora')
    .upsert({
      parceiro_id,
      servico,
      operadora,
      plano: plano || '',
      modelo: modelo || 'fixo',
      valor_comissao: parseFloat(valor_comissao) || 0,
      num_mensalidades: parseFloat(num_mensalidades) || 0,
      valor_mensal: parseFloat(valor_mensal) || 0,
      percentagem: parseFloat(percentagem) || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'parceiro_id,servico,operadora,plano' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comissao: data?.[0] ?? null })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const body = await req.json()
  const { parceiro_id, servico, operadora, plano } = body

  const { error } = await service
    .from('comissoes_operadora')
    .delete()
    .eq('parceiro_id', parceiro_id)
    .eq('servico', servico)
    .eq('operadora', operadora)
    .eq('plano', plano || '')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
