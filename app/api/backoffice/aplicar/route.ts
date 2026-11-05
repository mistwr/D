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

// Só estes estados podem vir da reconciliação (ativo / pendente / anulado).
const PERMITIDOS = new Set(['ativa', 'em_ativacao', 'cancelado'])
const LABEL: Record<string, string> = { ativa: 'Ativa', em_ativacao: 'Em Ativação', cancelado: 'Cancelado' }
const MAX = 2000

interface Atualizacao { id: string; status: string }

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })
  const isAdminVIP = profile?.is_superadmin !== true

  const body = await req.json().catch(() => null) as { updates?: Atualizacao[] } | null
  const updates = (body?.updates ?? []).filter((u) => u && typeof u.id === 'string' && PERMITIDOS.has(u.status))
  if (!updates.length) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
  if (updates.length > MAX) return NextResponse.json({ error: `Máximo ${MAX} vendas por vez` }, { status: 400 })

  const ids = [...new Set(updates.map((u) => u.id))]
  const vendas: { id: string; user_id: string; status: string; client_name: string; ativacao_at: string | null }[] = []
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await service.from('vendas').select('id, user_id, status, client_name, ativacao_at').in('id', ids.slice(i, i + 200))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    vendas.push(...(data ?? []))
  }
  const porId = new Map(vendas.map((v) => [v.id, v]))

  // Admin VIP só mexe nas vendas dos parceiros que criou.
  let permitidos: Set<string> | null = null
  if (isAdminVIP) {
    const { data: meus } = await service.from('profiles').select('id').eq('created_by', user.id)
    permitidos = new Set((meus ?? []).map((p) => p.id))
  }

  const agora = new Date().toISOString()
  let atualizadas = 0
  const ignoradas: { id: string; motivo: string }[] = []
  const notificacoes: Record<string, unknown>[] = []

  for (const u of updates) {
    const v = porId.get(u.id)
    if (!v) { ignoradas.push({ id: u.id, motivo: 'Venda não encontrada' }); continue }
    if (permitidos && !permitidos.has(v.user_id)) { ignoradas.push({ id: u.id, motivo: 'Sem permissão' }); continue }
    if (v.status === u.status) continue
    // Uma venda já paga não volta a "ativa".
    if (u.status === 'ativa' && v.status === 'pago') continue

    const patch: Record<string, unknown> = { status: u.status, updated_at: agora }
    if (u.status === 'em_ativacao' && !v.ativacao_at) patch.ativacao_at = agora

    const { error } = await service.from('vendas').update(patch).eq('id', v.id)
    if (error) { ignoradas.push({ id: u.id, motivo: error.message }); continue }
    atualizadas++
    if (v.user_id !== user.id) {
      notificacoes.push({
        user_id: v.user_id,
        type: 'status_venda',
        title: 'Estado da Venda Actualizado',
        message: `A venda de ${v.client_name} passou para "${LABEL[u.status]}" (reporte da operadora)`,
        read: false,
        created_at: agora,
      })
    }
  }

  for (let i = 0; i < notificacoes.length; i += 500) {
    await service.from('notifications').insert(notificacoes.slice(i, i + 500))
  }

  return NextResponse.json({ ok: true, atualizadas, ignoradas })
}
