import {createClient} from '@supabase/supabase-js'
// The caller verifies the token first. Data queries keep that user's RLS context.
export function createScopedBearerClient(url:string,publicKey:string,token:string,fetcher?:typeof fetch) {
  return createClient(url,publicKey,{global:{headers:{Authorization:'Bearer '+token},...(fetcher?{fetch:fetcher}:{})},auth:{persistSession:false,autoRefreshToken:false}})
}
