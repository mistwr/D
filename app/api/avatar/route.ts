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

// Avatares predefinidos
const PRESET_AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
  '/avatars/avatar-7.png',
  '/avatars/avatar-8.png',
]

// GET - obter avatar atual e lista de predefinidos
export async function GET(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const { data: profile } = await service
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ 
    avatar_url: profile?.avatar_url ?? null,
    preset_avatars: PRESET_AVATARS
  })
}

// POST - upload de foto ou escolher avatar predefinido
export async function POST(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()
  const contentType = req.headers.get('content-type') || ''

  let avatarUrl: string | null = null

  if (contentType.includes('multipart/form-data')) {
    // Upload de ficheiro
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Ficheiro obrigatorio' }, { status: 400 })
    }

    // Validar tipo de ficheiro
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 })
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem muito grande (max 2MB)' }, { status: 400 })
    }

    // Gerar nome único
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `avatars/${user.id}-${Date.now()}.${ext}`

    // Fazer upload
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await service.storage
      .from('avatars')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      // Se o bucket não existir, criar
      if (uploadError.message.includes('Bucket not found')) {
        await service.storage.createBucket('avatars', { public: true })
        // Tentar novamente
        const { error: retryError } = await service.storage
          .from('avatars')
          .upload(fileName, arrayBuffer, {
            contentType: file.type,
            upsert: true
          })
        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
      }
    }

    // Obter URL pública
    const { data: publicUrl } = service.storage.from('avatars').getPublicUrl(fileName)
    avatarUrl = publicUrl.publicUrl

  } else {
    // JSON - escolher avatar predefinido
    const { avatar_url } = await req.json()
    
    if (!avatar_url) {
      return NextResponse.json({ error: 'avatar_url obrigatorio' }, { status: 400 })
    }

    // Validar se é um avatar predefinido válido
    if (!PRESET_AVATARS.includes(avatar_url) && !avatar_url.startsWith('http')) {
      return NextResponse.json({ error: 'Avatar invalido' }, { status: 400 })
    }

    avatarUrl = avatar_url
  }

  // Atualizar perfil
  const { error: updateError } = await service
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: avatarUrl })
}

// DELETE - remover avatar
export async function DELETE(req: NextRequest) {
  const { user } = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const service = svc()

  await service
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
