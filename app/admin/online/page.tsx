'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { Circle, RefreshCw, Users, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import Image from 'next/image'

interface OnlineUser {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url: string | null
  last_seen: string
  is_online: boolean
}

export default function OnlinePage() {
  const { user, loading, authFetch } = useAuth('admin')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [allUsers, setAllUsers] = useState<OnlineUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const fetchOnlineUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await authFetch(`/api/presence?all=${showAll}`)
      if (res.ok) {
        const data = await res.json()
        if (showAll) {
          setAllUsers(data.users || [])
        } else {
          setOnlineUsers(data.users || [])
        }
      }
    } catch (error) {
      console.error('Error fetching online users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchOnlineUsers()
      const interval = setInterval(fetchOnlineUsers, 15000) // Refresh every 15s
      return () => clearInterval(interval)
    }
  }, [user, showAll])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  const displayUsers = showAll ? allUsers : onlineUsers
  const onlineCount = showAll ? allUsers.filter(u => u.is_online).length : onlineUsers.length

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <Sidebar user={user} />
      <Navbar user={user} />
      
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Utilizadores Online</h1>
              <p className="text-slate-500 mt-1">
                {onlineCount} utilizador{onlineCount !== 1 ? 'es' : ''} online agora
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAll(!showAll)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showAll 
                    ? 'bg-slate-200 text-slate-700' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {showAll ? 'Mostrar Apenas Online' : 'Mostrar Todos'}
              </button>
              <button
                onClick={fetchOnlineUsers}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                title="Atualizar"
              >
                <RefreshCw size={18} className={`text-slate-600 ${loadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Circle size={20} className="text-emerald-600 fill-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{onlineCount}</p>
                  <p className="text-sm text-slate-500">Online Agora</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                  <Users size={20} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{allUsers.length || displayUsers.length}</p>
                  <p className="text-sm text-slate-500">Total Registados</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">30s</p>
                  <p className="text-sm text-slate-500">Intervalo Heartbeat</p>
                </div>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                {showAll ? 'Todos os Utilizadores' : 'Utilizadores Online'}
              </h2>
            </div>
            
            {loadingUsers ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
                <p className="text-slate-500 mt-2">A carregar...</p>
              </div>
            ) : displayUsers.length === 0 ? (
              <div className="p-8 text-center">
                <Users size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Nenhum utilizador {showAll ? 'registado' : 'online'}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayUsers.map(u => (
                  <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center" style={{ background: u.avatar_url ? 'transparent' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
                        {u.avatar_url ? (
                          <Image src={u.avatar_url} alt={u.full_name} width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-semibold text-lg">
                            {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      {/* Online indicator */}
                      <span 
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          u.is_online ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 truncate">{u.full_name || 'Sem nome'}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          u.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-sky-100 text-sky-700'
                        }`}>
                          {u.role === 'admin' ? 'Admin' : 'Parceiro'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{u.email}</p>
                    </div>

                    {/* Status */}
                    <div className="text-right">
                      <p className={`text-sm font-medium ${u.is_online ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {u.is_online ? 'Online' : 'Offline'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {u.last_seen 
                          ? formatDistanceToNow(new Date(u.last_seen), { addSuffix: true, locale: pt })
                          : 'Nunca visto'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
