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
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isSuperAdmin = profile?.is_superadmin === true
  const isAdmin = profile?.role === 'admin'
  const isAdminVIP = isAdmin && !isSuperAdmin
  const sp = req.nextUrl.searchParams

  // Obter IDs dos parceiros que este admin pode ver
  let allowedParceiroIds: string[] = []
  if (isAdminVIP) {
    // Admin VIP só vê parceiros que ele criou
    const { data: meusParceiros } = await service.from('profiles').select('id').eq('created_by', user.id)
    allowedParceiroIds = meusParceiros?.map(p => p.id) || []
  }

  // Listar parceiros
  if (sp.get('parceiros') === '1' && isAdmin) {
    let query = service.from('profiles').select('id, full_name, company_name').eq('role', 'parceiro')
    
    // Admin VIP só vê parceiros que criou
    if (isAdminVIP) {
      query = query.eq('created_by', user.id)
    }
    
    const { data } = await query.order('full_name')
    const { data: authUsers } = await service.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    authUsers?.users?.forEach(u => { emailMap[u.id] = u.email ?? '' })
    const parceiros = (data ?? []).map(p => ({ ...p, email: emailMap[p.id] ?? '' }))
    return NextResponse.json({ parceiros })
  }

  // Métricas
  if (sp.get('metrics') === '1') {
    let query = service.from('vendas').select('amount, status, service_type')
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    } else if (isAdminVIP && allowedParceiroIds.length > 0) {
      // Admin VIP só vê métricas dos seus parceiros
      query = query.in('user_id', allowedParceiroIds)
    } else if (isAdminVIP && allowedParceiroIds.length === 0) {
      // Admin VIP sem parceiros - retorna zeros
      return NextResponse.json({ total: 0, count: 0, pendentes: 0, pagas: 0 })
    }
    const { data: vendas } = await query
    const total = vendas?.reduce((s, v) => s + (v.amount || 0), 0) ?? 0
    const count = vendas?.length ?? 0
    const pendentes = vendas?.filter(v => v.status === 'pendente').length ?? 0
    const pagas = vendas?.filter(v => v.status === 'pago').length ?? 0
    return NextResponse.json({ total, count, pendentes, pagas })
  }

  // Venda por id
  const vendaId = sp.get('id')
  if (vendaId) {
    const { data: venda } = await service.from('vendas').select('*').eq('id', vendaId).single()
    if (!venda) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
    // Verificar permissão
    if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    if (isAdminVIP && !allowedParceiroIds.includes(venda.user_id)) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    
    const { data: parceiro } = await service.from('profiles').select('full_name').eq('id', venda.user_id).single()
    return NextResponse.json({ venda, parceiro })
  }

  // Todas as vendas
  let query = service.from('vendas').select('*').order('created_at', { ascending: false })
  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  } else if (isAdminVIP && allowedParceiroIds.length > 0) {
    query = query.in('user_id', allowedParceiroIds)
  } else if (isAdminVIP && allowedParceiroIds.length === 0) {
    return NextResponse.json({ vendas: [] })
  }
  const { data: vendas, error: vendasError } = await query
  if (vendasError) return NextResponse.json({ error: vendasError.message }, { status: 500 })

  let profileMap: Record<string, string> = {}
  if (isAdmin && vendas && vendas.length > 0) {
    const userIds = [...new Set(vendas.map((v: any) => v.user_id))]
    const { data: profiles } = await service.from('profiles').select('id, full_name').in('id', userIds)
    profiles?.forEach((p: any) => { profileMap[p.id] = p.full_name })
  }
  const enriched = (vendas ?? []).map((v: any) => ({
    ...v,
    parceiro_name: profileMap[v.user_id] ?? 'Desconhecido',
  }))
  return NextResponse.json({ vendas: enriched })
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const body = await req.json()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: venda, error } = await service.from('vendas').insert({
    user_id: isAdmin && body.user_id ? body.user_id : user.id,
    client_name: body.client_name || '',
    client_email: body.client_email || null,
    client_phone: body.client_phone || '',
    client_nif: body.client_nif || null,
    client_cc: body.client_cc || null,
    client_iban: body.client_iban || null,
    client_address: body.client_address || null,
    client_birthdate: body.client_birthdate || null,
    amount: parseFloat(body.amount) || 0,
    currency: body.currency || 'EUR',
    description: body.description || '',
    contract_type: body.contract_type || '',
    service_type: body.service_type || 'telecom',
    operator: body.operator || '',
    plano: body.plano || '',
    status: 'pendente',
    notes: body.notes || '',
    is_dual: body.is_dual || false,
    energia_tipo: body.energia_tipo || null,
    energia_tipo_processo: body.energia_tipo_processo || null,
    cpe: body.cpe || null,
    cui: body.cui || null,
    cpes: body.cpes || [],
    cuis: body.cuis || [],
    potencia: body.potencia || null,
    escalao: body.escalao || null,
    gas_escalao: body.gas_escalao || null,
    telco_numeros: body.telco_numeros || [],
    telco_fixo: body.telco_fixo || null,
    telco_fixo_cvp: body.telco_fixo_cvp || null,
    meses_fidelizacao: body.meses_fidelizacao || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  // Criar notificação para todos os admins quando um parceiro regista uma venda
  if (!isAdmin && venda) {
    const { data: parceiro } = await service.from('profiles').select('full_name').eq('id', user.id).single()
    const parceiroName = parceiro?.full_name || 'Parceiro'
    
    // Buscar todos os admins para notificar
    const { data: admins } = await service.from('profiles').select('id').eq('role', 'admin')
    
    if (admins && admins.length > 0) {
      // Inserir notificações na tabela 'notifications'
      const notificacoesPayload = admins.map(admin => ({
        user_id: admin.id,
        type: 'nova_venda',
        title: 'Nova Venda Registada',
        message: `${parceiroName} registou uma nova venda de ${body.service_type === 'energia' ? 'Energia' : body.service_type === 'gas' ? 'Gás' : 'Telecomunicações'} - ${body.client_name}`,
        read: false,
        created_at: new Date().toISOString()
      }))
      await service.from('notifications').insert(notificacoesPayload)
    }
  }
  
  return NextResponse.json({ venda })
}

export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isSuperAdmin = profile?.is_superadmin === true
  const isAdmin = profile?.role === 'admin'
  const isAdminVIP = isAdmin && !isSuperAdmin
  
  if (!isAdmin) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  // Admin VIP só pode apagar vendas dos seus parceiros
  if (isAdminVIP) {
    const { data: venda } = await service.from('vendas').select('user_id').eq('id', id).single()
    if (venda) {
      const { data: parceiro } = await service.from('profiles').select('created_by').eq('id', venda.user_id).single()
      if (parceiro?.created_by !== user.id) {
        return NextResponse.json({ error: 'Sem permissao para apagar esta venda' }, { status: 403 })
      }
    }
  }

  const { data: docs } = await service.from('documentos').select('id, file_path').eq('venda_id', id)
  if (docs && docs.length > 0) {
    const paths = docs.map((d: any) => d.file_path).filter(Boolean)
    if (paths.length > 0) await service.storage.from('documentos').remove(paths)
    await service.from('documentos').delete().eq('venda_id', id)
  }

  const { error } = await service.from('vendas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { id, status, ...rest } = await req.json()
  const { data: profile } = await service.from('profiles').select('role, is_superadmin').eq('id', user.id).single()
  const isSuperAdmin = profile?.is_superadmin === true
  const isAdmin = profile?.role === 'admin'
  const isAdminVIP = isAdmin && !isSuperAdmin

  const { data: venda } = await service.from('vendas').select('user_id').eq('id', id).single()
  if (!venda) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
  
  // Verificar permissões
  if (!isAdmin && venda.user_id !== user.id) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  
  // Admin VIP só pode editar vendas dos seus parceiros
  if (isAdminVIP) {
    const { data: parceiro } = await service.from('profiles').select('created_by').eq('id', venda.user_id).single()
    if (parceiro?.created_by !== user.id) {
      return NextResponse.json({ error: 'Sem permissao para editar esta venda' }, { status: 403 })
    }
  }

  const updates: any = { updated_at: new Date().toISOString() }
  if (status) {
    updates.status = status
    // Quando o admin coloca em_ativacao, memorizar a data e hora automaticamente
    if (status === 'em_ativacao') {
      updates.ativacao_at = new Date().toISOString()
    }
  }
  Object.assign(updates, rest)

  const { data: updated, error: updateError } = await service.from('vendas').update(updates).eq('id', id).select().single()
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Notificar o parceiro quando o status muda
  if (status && venda) {
    const STATUS_LABELS: Record<string, string> = {
      em_revisao: 'Em Revisão',
      em_ativacao: 'Em Ativação',
      ativa: 'Ativa',
      pago: 'Pago',
      cancelado: 'Cancelado',
      rejeitado: 'Rejeitado',
    }
    const statusLabel = STATUS_LABELS[status] || status
    // Buscar o user_id do dono da venda para notificar
    const { data: vendaOwner } = await service.from('vendas').select('user_id, client_name').eq('id', id).single()
    if (vendaOwner && vendaOwner.user_id !== user.id) {
      await service.from('notifications').insert({
        user_id: vendaOwner.user_id,
        type: 'status_venda',
        title: 'Estado da Venda Actualizado',
        message: `A venda de ${vendaOwner.client_name} passou para "${statusLabel}"`,
        read: false,
        created_at: new Date().toISOString()
      })
    }
  }

  return NextResponse.json({ ok: true, venda: updated })
}
