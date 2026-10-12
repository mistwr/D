'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, ExternalLink } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/hooks/use-auth'

type Contract = {id:string;client_name:string;operator:string;service_type:string;data_fidelizacao:string|null;meses_fidelizacao:number|null;data_fidelizacao_telecom:string|null;data_contacto_energia:string|null;estado_fidelizacao:string|null}
function endDate(v:Contract) {
  if (!v.data_fidelizacao || !v.meses_fidelizacao) return null
  const d = new Date(v.data_fidelizacao+'T12:00:00Z'), day = d.getUTCDate()
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth()+v.meses_fidelizacao)
  d.setUTCDate(Math.min(day,new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()))
  return d.toISOString().slice(0,10)
}
export default function FidelizacoesPage() {
  const {user, authFetch} = useAuth('admin')
  const [rows,setRows] = useState<Contract[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[filter,setFilter]=useState('todas')
  useEffect(()=>{if(!user)return; authFetch('/api/fidelizacoes').then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);setRows(d.vendas||[])}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[user])
  const today = new Date().toISOString().slice(0,10)
  const contracts = rows.filter(v=>v.data_fidelizacao || v.data_fidelizacao_telecom || v.data_contacto_energia)
  const state = (v:Contract) => {
    const end=endDate(v)
    if(end && end<today)return 'expirada'
    const contact=v.service_type==='telecom'?v.data_fidelizacao_telecom:v.data_contacto_energia
    if(contact && contact<=today)return 'a_contactar'
    return 'ativa'
  }
  const labels:Record<string,string>={todas:'Todas',ativa:'Ativas',a_contactar:'A contactar',expirada:'Expiradas'}
  const date=(v:string|null)=>v?new Date(v+'T12:00:00').toLocaleDateString('pt-PT'):'—'
  return <div className="min-h-screen bg-slate-50"><Navbar user={user}/><Sidebar userRole="admin" isSuperAdmin={user?.is_superadmin}/><main className="space-y-6 p-4 pt-20 md:ml-64 md:p-6 md:pt-20">
    <h1 className="flex items-center gap-2 text-2xl font-bold"><Calendar/> Fidelizações</h1>
    <p className="text-sm text-slate-500">Contratos e oportunidades de renovação do CRM.</p>
    <a className="inline-flex items-center gap-2 rounded-lg bg-blue-600 p-3 text-white" href="https://sd-dialer-2p.vercel.app/fidelizacoes" target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Ver fidelizações registadas no SD Dialer</a>
    <p className="text-sm text-slate-500">Os registos do SD Dialer são consultados na respetiva conta e empresa.</p>
    <div className="flex flex-wrap gap-2">{Object.entries(labels).map(([key,label])=><button className={'rounded-lg border p-3 '+(key===filter?'bg-blue-100':'bg-white')} key={key} onClick={()=>setFilter(key)}>{label} · {key==='todas'?contracts.length:contracts.filter(v=>state(v)===key).length}</button>)}</div>
    {error && <p role="alert" className="text-red-700">{error}</p>}{loading && <p>A carregar…</p>}
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr>{['Cliente','Operadora','Início','Duração','Fim','Contacto previsto','Estado'].map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{contracts.filter(v=>filter==='todas'||state(v)===filter).map(v=><tr key={v.id} className="border-t"><td className="p-3"><Link href="/admin/vendas">{v.client_name}</Link></td><td>{v.operator}</td><td>{date(v.data_fidelizacao)}</td><td>{v.meses_fidelizacao?`${v.meses_fidelizacao} meses`:'—'}</td><td>{date(endDate(v))}</td><td>{date(v.service_type==='telecom'?v.data_fidelizacao_telecom:v.data_contacto_energia)}</td><td>{labels[state(v)]}</td></tr>)}</tbody></table>{!loading&&!contracts.length&&!error&&<p className="p-4">Sem fidelizações registadas.</p>}</div>
  </main></div>
}
