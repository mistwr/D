type Notification = {id:string;read:boolean}
export class NotificationTracker {
  private userId:string|null=null
  private seen=new Set<string>()
  observe(userId:string,notifications:Notification[]) {
    if(this.userId!==userId) {
      this.userId=userId
      this.seen=new Set(notifications.map(n=>n.id))
      return false
    }
    const arrived=notifications.some(n=>!n.read&&!this.seen.has(n.id))
    notifications.forEach(n=>this.seen.add(n.id))
    return arrived
  }
}

export function playNotificationTone(context:AudioContext) {
  if(context.state!=='running')return false
  const start=context.currentTime+0.02
  ;[880,1174.66,1567.98].forEach((frequency,index)=>{
    const oscillator=context.createOscillator()
    const gain=context.createGain()
    const at=start+index*0.17
    oscillator.type='sine'
    oscillator.frequency.setValueAtTime(frequency,at)
    gain.gain.setValueAtTime(0.0001,at)
    gain.gain.exponentialRampToValueAtTime(0.22,at+0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001,at+0.25)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()}
    oscillator.start(at)
    oscillator.stop(at+0.27)
  })
  return true
}
