'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { User, Camera, Check, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

const AVATAR_OPTIONS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
  '/avatars/avatar-7.png',
  '/avatars/avatar-8.png',
]

// Generate initials avatars with different colors
const COLORS = [
  '#0ea5e9', '#8b5cf6', '#ec4899', '#f97316', 
  '#10b981', '#6366f1', '#ef4444', '#14b8a6'
]

export default function PerfilPage() {
  const { user, loading, authFetch } = useAuth()
  const [profile, setProfile] = useState<{
    full_name: string
    email: string
    phone: string
    company_name: string
    avatar_url: string | null
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const res = await authFetch('/api/avatar')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setSelectedAvatar(data.profile?.avatar_url)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleSaveAvatar = async (avatarUrl: string | null) => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await authFetch('/api/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl })
      })
      
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null)
        setSelectedAvatar(avatarUrl)
        setShowAvatarPicker(false)
        setMessage({ type: 'success', text: 'Avatar atualizado com sucesso!' })
        // Refresh the page to update navbar
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage({ type: 'error', text: 'Erro ao atualizar avatar' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar avatar' })
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor selecione uma imagem' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter menos de 2MB' })
      return
    }

    setUploadingImage(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await authFetch('/api/avatar', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(prev => prev ? { ...prev, avatar_url: data.avatar_url } : null)
        setSelectedAvatar(data.avatar_url)
        setShowAvatarPicker(false)
        setMessage({ type: 'success', text: 'Foto carregada com sucesso!' })
        setTimeout(() => window.location.reload(), 1000)
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Erro ao carregar foto' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar foto' })
    } finally {
      setUploadingImage(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <Sidebar user={user} />
      <Navbar user={user ? { ...user, avatar_url: profile?.avatar_url || undefined } : null} />
      
      <main className="pt-20 md:pt-20 md:pl-64 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <h1 className="text-2xl font-bold text-slate-800 mb-6">Meu Perfil</h1>

          {/* Message */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Avatar Section */}
            <div className="p-6 border-b border-slate-100 flex flex-col items-center">
              <div className="relative">
                <div 
                  className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}
                  onClick={() => setShowAvatarPicker(true)}
                >
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-3xl">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg hover:bg-sky-600 transition-colors"
                >
                  <Camera size={16} />
                </button>
              </div>
              <p className="mt-3 text-lg font-semibold text-slate-800">{profile?.full_name || user?.full_name}</p>
              <p className="text-sm text-slate-500">{profile?.email || user?.email}</p>
            </div>

            {/* Profile Details */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Nome Completo</label>
                <p className="mt-1 text-slate-800">{profile?.full_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Email</label>
                <p className="mt-1 text-slate-800">{profile?.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Telefone</label>
                <p className="mt-1 text-slate-800">{profile?.phone || '-'}</p>
              </div>
              {profile?.company_name && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Empresa</label>
                  <p className="mt-1 text-slate-800">{profile.company_name}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-500">Tipo de Conta</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    user?.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-sky-100 text-sky-700'
                  }`}>
                    {user?.role === 'admin' ? 'Administrador' : 'Parceiro'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Escolher Avatar</h3>
              <button onClick={() => setShowAvatarPicker(false)} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Upload Custom Photo */}
            <div className="p-4 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-3">Carregar Foto</p>
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors">
                {uploadingImage ? (
                  <Loader2 size={20} className="animate-spin text-sky-500" />
                ) : (
                  <>
                    <Camera size={20} className="text-slate-400" />
                    <span className="text-sm text-slate-500">Clique para carregar uma foto</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
              <p className="text-xs text-slate-400 mt-2">PNG, JPG ate 2MB</p>
            </div>

            {/* Predefined Avatars */}
            <div className="p-4 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-3">Ou escolher um avatar</p>
              <div className="grid grid-cols-4 gap-3">
                {COLORS.map((color, i) => (
                  <button
                    key={`color-${i}`}
                    onClick={() => setSelectedAvatar(`color:${color}`)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all ${
                      selectedAvatar === `color:${color}` ? 'ring-2 ring-sky-500 ring-offset-2' : ''
                    }`}
                    style={{ background: color }}
                  >
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </button>
                ))}
              </div>
            </div>

            {/* Remove Avatar Option */}
            <div className="p-4 border-b border-slate-100">
              <button
                onClick={() => setSelectedAvatar(null)}
                className={`w-full p-3 text-sm font-medium rounded-lg transition-colors ${
                  selectedAvatar === null 
                    ? 'bg-slate-100 text-slate-800' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Usar Avatar Padrao (Inicial do Nome)
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 flex gap-3">
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveAvatar(selectedAvatar)}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    A guardar...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
