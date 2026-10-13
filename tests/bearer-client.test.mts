import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createScopedBearerClient} from '../lib/supabase/bearer.ts'
test('verified bearer operations retain the user token rather than service-role privileges',async()=>{
  let authorization='',key=''
  const fetcher:typeof fetch=async(_url,options)=>{
    const headers=new Headers(options?.headers);authorization=headers.get('authorization')||'';key=headers.get('apikey')||''
    return new Response('[]',{status:200,headers:{'Content-Type':'application/json'}})
  }
  const client=createScopedBearerClient('https://example.supabase.co','public-key','user-token',fetcher)
  await client.from('profiles').select('id')
  assert.equal(authorization,'Bearer user-token');assert.equal(key,'public-key')
})
