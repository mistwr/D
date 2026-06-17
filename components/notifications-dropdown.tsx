'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, ShoppingCart, User, AlertTriangle, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import { createClient } from '@supabase/supabase-js'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

interface NotificationsDropdownProps {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'nova_venda': return <ShoppingCart size={16} className="text-emerald-500" />
    case 'novo_parceiro': return <User size={16} className="text-blue-500" />
    case 'chargeback': return <AlertTriangle size={16} className="text-red-500" />
    default: return <Bell size={16} className="text-slate-500" />
  }
}

export function NotificationsDropdown({ authFetch }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef<any>(null)

  const fetchNotifications = async () => {
    try {
      const res = await authFetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    const setupRealtime = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) return
        
        const supabase = createClient(supabaseUrl, supabaseKey)
        supabaseRef.current = supabase
        
        const userRes = await authFetch('/api/auth/me')
        if (!userRes.ok) return
        
        const userData = await userRes.json()
        const userId = userData.user?.id
        
        if (!userId) return
        
        const subscription = supabase
          .channel(`notifications:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              const newNotification: Notification = {
                id: payload.new.id,
                type: payload.new.type,
                title: payload.new.title,
                message: payload.new.message,
                read: payload.new.read || false,
                created_at: payload.new.created_at,
              }
              
              setNotifications(prev => [newNotification, ...prev])
              setUnreadCount(prev => prev + 1)
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              if (payload.new.read) {
                setUnreadCount(prev => Math.max(0, prev - 1))
              }
              setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? { ...n, read: payload.new.read } : n)
              )
            }
          )
          .subscribe()
      } catch (error) {
        console.error('Error setting up realtime:', error)
      }
    }
    
    setupRealtime()
    
    const pollInterval = setInterval(fetchNotifications, 60000)
    
    return () => {
      clearInterval(pollInterval)
      if (supabaseRef.current) {
        supabaseRef.current.removeAllChannels()
      }
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await authFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await authFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)} 
        className="relative p-2 rounded-full transition-colors hover:bg-slate-100"
        aria-label="Notificacoes"
      >
        <Bell size={20} style={{ color: '#64748b' }} />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-0 -right-0 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-md" />
            <span className="absolute -bottom-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[11px] font-bold text-white px-1 shadow-md" style={{ background: '#ef4444' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[400px] overflow-hidden rounded-xl shadow-xl border border-slate-200 bg-white z-50">
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Notificacoes</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
              >
                <CheckCheck size={14} />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[320px]">
            {loading ? (
              <div className="p-4 text-center text-slate-500 text-sm">A carregar...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-slate-500 text-sm">Sem notificacoes</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notification.read ? 'bg-sky-50/50' : ''}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: pt })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function NotificationsDropdownMobile({ authFetch }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef<any>(null)

  const fetchNotifications = async () => {
    try {
      const res = await authFetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    const setupRealtime = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) return
        
        const supabase = createClient(supabaseUrl, supabaseKey)
        supabaseRef.current = supabase
        
        const userRes = await authFetch('/api/auth/me')
        if (!userRes.ok) return
        
        const userData = await userRes.json()
        const userId = userData.user?.id
        
        if (!userId) return
        
        const subscription = supabase
          .channel(`notifications:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              const newNotification: Notification = {
                id: payload.new.id,
                type: payload.new.type,
                title: payload.new.title,
                message: payload.new.message,
                read: payload.new.read || false,
                created_at: payload.new.created_at,
              }
              
              setNotifications(prev => [newNotification, ...prev])
              setUnreadCount(prev => prev + 1)
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              if (payload.new.read) {
                setUnreadCount(prev => Math.max(0, prev - 1))
              }
              setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? { ...n, read: payload.new.read } : n)
              )
            }
          )
          .subscribe()
      } catch (error) {
        console.error('Error setting up realtime:', error)
      }
    }
    
    setupRealtime()
    
    const pollInterval = setInterval(fetchNotifications, 60000)
    
    return () => {
      clearInterval(pollInterval)
      if (supabaseRef.current) {
        supabaseRef.current.removeAllChannels()
      }
    }
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await authFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await authFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-lg" 
        style={{ background: 'rgba(255,255,255,0.1)' }} 
        aria-label="Notificacoes"
      >
        <Bell size={18} className="text-white" />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white shadow-md" />
            <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-bold text-white px-0.5 shadow-md" style={{ background: '#ef4444' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-white">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 safe-area-top" style={{ background: '#0f172a' }}>
            <h2 className="text-lg font-semibold text-white">Notificacoes</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-sky-400 font-medium"
                >
                  Marcar todas lidas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100vh-60px)]">
            {loading ? (
              <div className="p-8 text-center text-slate-500">A carregar...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">Sem notificacoes</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-4 border-b border-slate-100 active:bg-slate-50 ${!notification.read ? 'bg-sky-50/50' : ''}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: pt })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}
