import { supabaseAdmin } from './supabase'
import type { User } from './store'

// Users
export async function getUserByEmail(email: string): Promise<User | null> {
  console.log('[v0] supabaseStore: getUserByEmail -', email)
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('email', email).single()
  console.log('[v0] supabaseStore: getUserByEmail result - error:', error?.code, 'data:', !!data)
  if (error || !data) return null
  return data as User
}

export async function getUserById(id: string): Promise<User | null> {
  console.log('[v0] supabaseStore: getUserById -', id)
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', id).single()
  console.log('[v0] supabaseStore: getUserById result - error:', error?.code, 'data:', !!data)
  if (error || !data) return null
  return data as User
}

export async function createUser(data: Omit<User, 'id' | 'created_at'>): Promise<User | null> {
  console.log('[v0] supabaseStore: createUser -', data.email)
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert([{ ...data, id: crypto.randomUUID() }])
    .select()
    .single()
  console.log('[v0] supabaseStore: createUser result - error:', error?.code, 'user:', !!user)
  if (error) {
    console.error('[v0] Error creating user:', error.message)
    return null
  }
  return user as User
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabaseAdmin.from('users').select('*')
  if (error) return []
  return (data || []) as User[]
}

// Comissões por Operadora
export async function getComissoesPorOperadora(adminId: string) {
  const { data, error } = await supabaseAdmin
    .from('comissoes_por_operadora')
    .select('*')
    .eq('admin_id', adminId)
  if (error) return []
  return data || []
}

export async function getComissaoPorOperadora(operadora: string, servicoType: string) {
  const { data, error } = await supabaseAdmin
    .from('comissoes_por_operadora')
    .select('*')
    .eq('operadora', operadora)
    .eq('servico_type', servicoType)
    .single()
  if (error) return null
  return data
}

export async function importComissoesExcel(adminId: string, linhas: any[]) {
  const registos = linhas.map(linha => ({
    operadora: linha.operadora || linha['Operadora'],
    servico_type: linha.servico_type || linha['Serviço'] || 'telecom',
    percentual: parseFloat(linha.percentual || linha['% Comissão'] || 0),
    valor_fixo: parseFloat(linha.valor_fixo || linha['Valor Fixo'] || 0),
    admin_id: adminId,
  }))

  const { error } = await supabaseAdmin
    .from('comissoes_por_operadora')
    .upsert(registos, { onConflict: 'operadora,servico_type' })

  if (error) {
    console.error('[v0] Error importing comissoes:', error)
    return 0
  }
  return registos.length
}

// Contratos
export async function createContrato(data: any) {
  const { data: contrato, error } = await supabaseAdmin
    .from('contratos')
    .insert([{ ...data, id: crypto.randomUUID() }])
    .select()
    .single()
  if (error) {
    console.error('[v0] Error creating contrato:', error)
    return null
  }
  return contrato
}

export async function getContratoById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('contratos')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getContratosByUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('contratos')
    .select('*')
    .eq('user_id', userId)
  if (error) return []
  return data || []
}

export async function getAllContratos() {
  const { data, error } = await supabaseAdmin.from('contratos').select('*')
  if (error) return []
  return data || []
}

export async function updateContrato(id: string, updates: any) {
  const { data, error } = await supabaseAdmin
    .from('contratos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.error('[v0] Error updating contrato:', error)
    return null
  }
  return data
}

// Assinaturas
export async function addAssinatura(contratoId: string, tipo: string, dados: any) {
  const { data, error } = await supabaseAdmin
    .from('contrato_assinaturas')
    .insert([{ ...dados, contrato_id: contratoId, tipo, id: crypto.randomUUID() }])
    .select()
    .single()
  if (error) {
    console.error('[v0] Error adding assinatura:', error)
    return null
  }
  return data
}

export async function getAssinaturasContrato(contratoId: string) {
  const { data, error } = await supabaseAdmin
    .from('contrato_assinaturas')
    .select('*')
    .eq('contrato_id', contratoId)
  if (error) return []
  return data || []
}

