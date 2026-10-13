'use client'
import {createClient} from '@/lib/supabase/client'
import {withTimeout} from '@/lib/utils/request'
export async function authFetch(url:string,options:RequestInit={}) {
  const {data:{session},error}=await withTimeout(createClient().auth.getSession(),8000)
  if(error)throw error
  const headers=new Headers(options.headers)
  if(session?.access_token)headers.set('Authorization','Bearer '+session.access_token)
  const controller=new AbortController()
  const abort=()=>controller.abort(options.signal?.reason)
  if(options.signal?.aborted)abort()
  else options.signal?.addEventListener('abort',abort,{once:true})
  const isRead=!options.method||options.method.toUpperCase()==='GET'
  const limit=isRead?18000:options.body instanceof FormData?90000:60000
  const timer=setTimeout(()=>controller.abort(new Error('A ligação demorou demasiado. Tenta novamente.')),limit)
  try {return await fetch(url,{...options,credentials:'include',headers,signal:controller.signal})}
  finally {clearTimeout(timer);options.signal?.removeEventListener('abort',abort)}
}
