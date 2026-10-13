'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, ShoppingCart, User, AlertTriangle, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import useSWR from 'swr'
import {createClient} from '@/lib/supabase/client'
import {readJSON} from '@/lib/utils/request'
import {useNotificationSound} from '@/lib/hooks/useNotificationSound'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

type AuthFetch=(url:string,options?:RequestInit)=>Promise<Response>
interface NotificationsDropdownProps {state:ReturnType<typeof useCRMNotifications>}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'nova_venda': return <ShoppingCart size={16} className="text-emerald-500" />
    case 'novo_parceiro': return <User size={16} className="text-blue-500" />
    case 'chargeback': return <AlertTriangle size={16} className="text-red-500" />
    default: return <Bell size={16} className="text-slate-500" />
  }
}

export function useCRMNotifications(authFetch:AuthFetch,userId:string|null) {
  const {data,isLoading,error,mutate}=useSWR(userId?['crm-notifications',userId]:null,()=>authFetch('/api/notifications').then(readJSON),{refreshInterval:15000,dedupingInterval:3000})
  const {data:preferences,mutate:mutatePreferences}=useSWR(userId?['crm-notification-preferences',userId]:null,()=>authFetch('/api/preferences').then(readJSON))
  const notifications:Notification[]=data?.notifications||[]
  const unreadCount=data?.unread_count??data?.unreadCount??notifications.filter(n=>!n.read).length
  useEffect(()=>{
    if(!userId)return
    const supabase=createClient()
    const channel=supabase.channel('crm-notifications:'+userId).on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:'user_id=eq.'+userId},()=>{void mutate()}).subscribe()
    return ()=>{void supabase.removeChannel(channel)}
  },[userId,mutate])
  const sound=useNotificationSound(userId,notifications,data!==undefined)
  const [actionError,setActionError]=useState('')
  useEffect(()=>{if(preferences?.notificacoes_sonoras===false)sound.mute()},[preferences?.notificacoes_sonoras,sound.mute])
  async function changePreference(enabled:boolean) {
    setActionError('')
    if(enabled)void sound.testSound();else sound.mute()
    try {
      await authFetch('/api/preferences',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({notificacoes_sonoras:enabled})}).then(readJSON)
      await mutatePreferences({notificacoes_sonoras:enabled},false)
    }catch(e){setActionError(e instanceof Error?e.message:'Não foi possível guardar a preferência.')}
  }
  async function markAsRead(id:string) {
    try {
      await authFetch('/api/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}).then(readJSON)
      await mutate()
    }catch(e){setActionError(e instanceof Error?e.message:'Não foi possível atualizar.')}
  }
  async function markAllAsRead() {
    try {
      await authFetch('/api/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({mark_all:true})}).then(readJSON)
      await mutate()
    }catch(e){setActionError(e instanceof Error?e.message:'Não foi possível atualizar.')}
  }
  return {notifications,unreadCount,loading:isLoading,markAsRead,markAllAsRead,sound,changePreference,error:actionError||(error?'Não foi possível carregar as notificações.':'')}
}

function SoundControls({state}:{state:ReturnType<typeof useCRMNotifications>}) {
  return <div className="border-b bg-slate-50 p-3"><button type="button" className="rounded border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700" onClick={()=>void state.changePreference(true)}>{state.sound.enabled&&state.sound.ready?'Testar som':'Ativar som'}</button>{state.sound.enabled&&<button type="button" className="ml-3 text-xs text-slate-500" onClick={()=>void state.changePreference(false)}>Silenciar</button>}<p role="status" className="mt-2 text-xs text-slate-500">{state.sound.message||'Alertas sonoros com o CRM aberto.'}</p>{state.error&&<p role="alert" className="mt-2 text-xs text-red-700">{state.error}</p>}</div>
}

export function NotificationsDropdown({ state }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = state

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-full transition-colors hover:bg-slate-100" aria-label="Notificacoes">
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
              <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium">
                <CheckCheck size={14} />
                Marcar todas como lidas
              </button>
            )}
          </div>
          <SoundControls state={state}/>
          <div className="overflow-y-auto max-h-[320px]">
            {loading ? (
              <div className="p-4 text-center text-slate-500 text-sm">A carregar...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-slate-500 text-sm">Sem notificacoes</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-sky-50/50' : ''}`}
                  onClick={() => !n.read && markAsRead(n.id)}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!n.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
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

export function NotificationsDropdownMobile({ state }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = state

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }} aria-label="Notificacoes">
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
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-200" style={{ background: '#0f172a' }}>
            <h2 className="text-lg font-semibold text-white">Notificacoes</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-sky-400 font-medium">Marcar todas lidas</button>
              )}
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>
          <SoundControls state={state}/>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-slate-500">A carregar...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">Sem notificacoes</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  className={`p-4 border-b border-slate-100 active:bg-slate-50 ${!n.read ? 'bg-sky-50/50' : ''}`}
                  onClick={() => !n.read && markAsRead(n.id)}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!n.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pt })}
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
