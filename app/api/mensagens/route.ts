import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/get-auth-user'
import { createClient } from '@supabase/supabase-js'

const svc = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Obter mensagem aleatoria do dia
export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  
  // Buscar todas as mensagens ativas
  const { data: mensagens, error } = await service
    .from('mensagens_motivacionais')
    .select('*')
    .eq('ativa', true)

  if (error || !mensagens || mensagens.length === 0) {
    return NextResponse.json({ 
      mensagem: {
        mensagem: 'Bem-vindo! Hoje e um otimo dia para fazer a diferenca.',
        autor: 'Solucoes Diferentes'
      }
    })
  }

  // Selecionar mensagem baseada no dia (consistente durante o dia)
  const today = new Date().toISOString().split('T')[0]
  const seed = today.split('-').reduce((acc, n) => acc + parseInt(n), 0)
  const index = seed % mensagens.length

  return NextResponse.json({ mensagem: mensagens[index] })
}

// POST: Adicionar nova mensagem (apenas admin)
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const { mensagem, autor } = await req.json()
  if (!mensagem) return NextResponse.json({ error: 'Mensagem obrigatoria' }, { status: 400 })

  const { data, error } = await service.from('mensagens_motivacionais').insert({
    mensagem,
    autor: autor || 'Desconhecido',
    ativa: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mensagem: data })
}

// DELETE: Remover mensagem (apenas admin)
export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const { error } = await service.from('mensagens_motivacionais').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
