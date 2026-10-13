'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {NotificationTracker,playNotificationTone} from '@/lib/utils/notification-sound'

type Notification={id:string;read:boolean}
export function useNotificationSound(userId:string|null,notifications:Notification[],loaded:boolean) {
  const audio=useRef<AudioContext|null>(null)
  const tracker=useRef(new NotificationTracker())
  const enabledRef=useRef(true)
  const [enabled,setEnabled]=useState(true)
  const [ready,setReady]=useState(false)
  const [message,setMessage]=useState('')
  useEffect(()=>{
    let preference=true
    if(userId)try{preference=localStorage.getItem('crm-notification-sound:'+userId)!=='off'}catch{}
    enabledRef.current=preference
    setEnabled(preference);setReady(false);setMessage('')
    return ()=>{
      const previous=audio.current
      audio.current=null
      if(previous){previous.onstatechange=null;void previous.close().catch(()=>{})}
    }
  },[userId])
  const unlock=useCallback(async()=>{
    if(!userId)return false
    let context=audio.current
    if(!context||context.state==='closed') {
      const AudioConstructor=window.AudioContext||(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext
      if(!AudioConstructor)throw new Error('Este navegador não suporta o alerta sonoro.')
      context=new AudioConstructor()
      audio.current=context
      context.onstatechange=()=>setReady(context!.state==='running')
    }
    if(context.state!=='running')await context.resume()
    if(audio.current!==context)return false
    const running=context.state==='running'
    setReady(running)
    return running
  },[userId])
  useEffect(()=>{
    const activate=()=>{
      if(enabledRef.current)void unlock().catch(()=>setReady(false))
    }
    window.addEventListener('pointerdown',activate)
    window.addEventListener('keydown',activate)
    return ()=>{window.removeEventListener('pointerdown',activate);window.removeEventListener('keydown',activate)}
  },[unlock])
  useEffect(()=>{
    if(!userId||!loaded)return
    const arrived=tracker.current.observe(userId,notifications)
    if(arrived&&enabledRef.current&&audio.current) {
      if(!playNotificationTone(audio.current))setReady(false)
    }
  },[userId,notifications,loaded])
  const testSound=useCallback(async()=>{
    enabledRef.current=true;setEnabled(true);setMessage('')
    if(userId)try{localStorage.setItem('crm-notification-sound:'+userId,'on')}catch{}
    try {
      const running=await unlock()
      if(!running||!audio.current||!playNotificationTone(audio.current))throw new Error('Toca novamente em Ativar som para permitir a reprodução.')
      setMessage('Teste de som iniciado. Se não ouvires, verifica o volume multimédia do dispositivo.')
    }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível reproduzir o som.');setReady(false)}
  },[unlock,userId])
  const mute=useCallback(()=>{
    enabledRef.current=false;setEnabled(false);setMessage('Alertas sonoros silenciados neste dispositivo.')
    if(userId)try{localStorage.setItem('crm-notification-sound:'+userId,'off')}catch{}
  },[userId])
  return {enabled,ready,message,testSound,mute}
}
