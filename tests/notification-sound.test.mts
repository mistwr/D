import assert from 'node:assert/strict'
import {test} from 'node:test'
import { NotificationTracker, playNotificationTone } from '../lib/utils/notification-sound.ts'
test('initial load is silent, newly unread IDs ring even when total count stays the same',()=>{
  const tracker=new NotificationTracker()
  assert.equal(tracker.observe('a',[{id:'old',read:false}]),false)
  assert.equal(tracker.observe('a',[{id:'new',read:false}]),true)
  assert.equal(tracker.observe('a',[{id:'new',read:false}]),false)
  assert.equal(tracker.observe('a',[{id:'read',read:true}]),false)
  assert.equal(tracker.observe('b',[{id:'other',read:false}]),false)
})
test('tone refuses a suspended context and schedules audible notes only while running',()=>{
  const starts:number[]=[],stops:number[]=[],volumes:number[]=[]
  const ctx={state:'suspended',currentTime:3,destination:{},createOscillator:()=>({type:'sine',frequency:{setValueAtTime(){}},connect(){},start(t:number){starts.push(t)},stop(t:number){stops.push(t)},onended:null,disconnect(){}}),createGain:()=>({gain:{setValueAtTime(v:number){volumes.push(v)},exponentialRampToValueAtTime(v:number){volumes.push(v)}},connect(){},disconnect(){}})}
  assert.equal(playNotificationTone(ctx as unknown as AudioContext),false)
  assert.equal(starts.length,0)
  ctx.state='running'
  assert.equal(playNotificationTone(ctx as unknown as AudioContext),true)
  assert.equal(starts.length,3)
  assert.ok(volumes.some(v=>v>0.1))
  assert.ok(stops.every((end,i)=>end>starts[i]))
})
