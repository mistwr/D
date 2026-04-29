import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const vendaId = sp.get('venda_id')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  // Documentos por venda
  if (vendaId) {
    const { data: venda } = await supabase.from('vendas').select('user_id').eq('id', vendaId).single()
    if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    // Documentos são geridos via storage externo - retornar lista vazia por agora
    return NextResponse.json({ documentos: [] })
  }

  return NextResponse.json({ documentos: [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { venda_id, file_name } = body

  if (!venda_id || !file_name) {
    return NextResponse.json({ error: 'Campos obrigatórios: venda_id, file_name' }, { status: 400 })
  }

  const { data: venda } = await supabase.from('vendas').select('user_id').eq('id', venda_id).single()
  if (!venda) return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'parceiro' && venda.user_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  return NextResponse.json({ documento: { id: crypto.randomUUID(), venda_id, file_name, created_at: new Date().toISOString() } })
}
