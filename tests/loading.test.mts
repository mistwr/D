import {test} from 'node:test'
import assert from 'node:assert/strict'
import {withTimeout,readJSON,loadWithState} from '../lib/utils/request.ts'
test('stalled requests are bounded instead of leaving loading forever',async()=>{
  await assert.rejects(withTimeout(new Promise(()=>{}),15),/demorou/)
})
test('failed sales request clears spinner and reports error',async()=>{
  let done=false,error=''
  await loadWithState(()=>Promise.reject(new Error('rede indisponível')),{success(){throw new Error('unexpected success')},failure(e){error=e},finished(){done=true}})
  assert.equal(done,true);assert.equal(error,'rede indisponível')
})
test('primary data renders without waiting for stalled optional panels',async()=>{
  let shown=false,finished=false
  void loadWithState(()=>new Promise(()=>{}),{success(){},failure(){},finished(){}})
  await loadWithState(()=>Promise.resolve(['venda']),{success(data){shown=data.length===1},failure(){},finished(){finished=true}})
  assert.equal(shown,true);assert.equal(finished,true)
})
test('expired sessions and backend failures are surfaced instead of showing empty sales',async()=>{
  await assert.rejects(readJSON(new Response(JSON.stringify({error:'Sessão expirada'}),{status:401,headers:{'Content-Type':'application/json'}})),/Sessão expirada/)
  await assert.rejects(readJSON(new Response('<html>login</html>',{headers:{'Content-Type':'text/html'}})),/sessão/i)
  assert.deepEqual(await readJSON(new Response('{"vendas":[]}',{headers:{'Content-Type':'application/json'}})),{vendas:[]})
})
