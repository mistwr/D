// Endpoint exclusivo para o admin criar parceiros
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  // Verificar que é o admin a fazer o pedido
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas o admin pode criar parceiros' }, { status: 403 })
  }

  const { email, password, full_name, company_name, phone } = await req.json()

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Email, password e nome são obrigatórios' }, { status: 400 })
  }

  // Usar service role para criar o utilizador sem precisar de confirmação de email
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verificar se existe utilizador com este email (incluindo soft-deleted)
  // Se existir em estado deleted, apagar definitivamente para libertar o email
  const { data: existingUsers } = await serviceClient.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(
    u => u.email?.toLowerCase() === email.toLowerCase().trim()
  )
  if (existingUser) {
    // Se o utilizador foi eliminado (soft-delete), fazer hard-delete para libertar o email
    if (existingUser.deleted_at || !existingUser.email) {
      await serviceClient.auth.admin.deleteUser(existingUser.id)
    } else {
      // Utilizador activo com este email — devolver erro
      return NextResponse.json({ error: 'Email já registado por um utilizador activo' }, { status: 409 })
    }
  }

  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
      role: 'parceiro',
      company_name: company_name ?? '',
      phone: phone ?? '',
    }
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return NextResponse.json({ error: 'Email já registado. Se este parceiro foi apagado recentemente, aguarde alguns segundos e tente novamente.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Garantir profile (trigger devia criar, mas por segurança)
  await serviceClient.from('profiles').upsert({
    id: data.user.id,
    full_name,
    role: 'parceiro',
    company_name: company_name ?? '',
    phone: phone ?? '',
  }, { onConflict: 'id' })

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name,
      role: 'parceiro',
      company_name: company_name ?? '',
    }
  })
}
