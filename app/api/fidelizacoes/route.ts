import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET(req:NextRequest) {
  let db = await createClient()
  const token = req.headers.get('authorization')?.replace(/^Bearer /i,'').trim()
  if (token) {
    const {createClient: createTokenClient} = await import('@supabase/supabase-js')
    db = createTokenClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false}}) as typeof db
  }
  const {data:{user}} = await db.auth.getUser()
  if (!user) return NextResponse.json({error:'Não autorizado'},{status:401})
  const {data:profile} = await db.from('profiles').select('role').eq('id',user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({error:'Apenas administradores'},{status:403})
  const {data,error} = await db.from('vendas').select('id,client_name,operator,service_type,status,data_fidelizacao,meses_fidelizacao,data_fidelizacao_telecom,data_contacto_energia,estado_fidelizacao').not('status','in','(cancelado,rejeitado)').order('created_at',{ascending:false}).limit(1000)
  if (error) return NextResponse.json({error:'Não foi possível carregar os contratos.'},{status:500})
  return NextResponse.json({vendas:data||[]},{headers:{'Cache-Control':'private, no-store'}})
}
