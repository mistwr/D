import { NextResponse } from 'next/server'
import { streamText, convertToModelMessages, UIMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const maxDuration = 30

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, full_name, company_name').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { messages }: { messages: UIMessage[] } = await req.json()

  const db = svc()
  let contextData = ''

  if (isAdmin) {
    // Admin: dados globais — vendas, parceiros, comissoes
    const [{ data: vendas }, { data: parceiros }, { data: contratos }] = await Promise.all([
      db.from('vendas').select('id, status, amount, operator, service_type, created_at').order('created_at', { ascending: false }).limit(50),
      db.from('profiles').select('id, full_name, company_name, email').eq('role', 'parceiro').limit(100),
      db.from('contratos').select('id, status, amount, parceiro_name, created_at').order('created_at', { ascending: false }).limit(30),
    ])

    const totalVendas = (vendas ?? []).reduce((s, v) => s + (v.amount || 0), 0)
    const vendasPorStatus = (vendas ?? []).reduce((acc: Record<string, number>, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1; return acc
    }, {})
    const vendasPorOperadora = (vendas ?? []).reduce((acc: Record<string, number>, v) => {
      if (v.operator) acc[v.operator] = (acc[v.operator] || 0) + 1; return acc
    }, {})

    contextData = `
DADOS DO SISTEMA (admin):
- Total de parceiros: ${(parceiros ?? []).length}
- Parceiros: ${(parceiros ?? []).map(p => `${p.full_name} (${p.company_name || 'sem empresa'})`).join(', ')}
- Total de vendas: ${(vendas ?? []).length} | Valor total: €${totalVendas.toFixed(2)}
- Vendas por estado: ${Object.entries(vendasPorStatus).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Vendas por operadora: ${Object.entries(vendasPorOperadora).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Contratos recentes: ${(contratos ?? []).length} | Valor: €${(contratos ?? []).reduce((s, c) => s + (c.amount || 0), 0).toFixed(2)}
- Vendas recentes (ultimas 10): ${(vendas ?? []).slice(0, 10).map(v => `[${v.status}] €${v.amount || 0} - ${v.operator || 'N/A'} ${v.service_type || ''}`).join(' | ')}
`
  } else {
    // Parceiro: apenas os seus próprios dados
    const [{ data: vendas }, { data: comissoes }, { data: contratos }, { data: campanhas }] = await Promise.all([
      db.from('vendas').select('id, status, amount, operator, service_type, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      db.from('comissoes_operadora').select('servico, operadora, plano, modelo, valor_comissao, num_mensalidades, valor_mensal, percentagem').eq('parceiro_id', user.id),
      db.from('contratos').select('id, status, amount, created_at').eq('parceiro_id', user.id).order('created_at', { ascending: false }).limit(10),
      db.from('campanhas').select('title, operator, service_type, description, status').eq('status', 'ativa').limit(10),
    ])

    const totalVendas = (vendas ?? []).reduce((s, v) => s + (v.amount || 0), 0)

    contextData = `
DADOS DO PARCEIRO (${profile?.full_name || 'Parceiro'}):
- As minhas vendas: ${(vendas ?? []).length} vendas | Total: €${totalVendas.toFixed(2)}
- Vendas por estado: ${JSON.stringify((vendas ?? []).reduce((acc: Record<string, number>, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc }, {}))}
- Os meus contratos: ${(contratos ?? []).length}
- Campanhas activas disponiveis: ${(campanhas ?? []).map(c => `${c.title} (${c.operator} - ${c.service_type})`).join(', ') || 'Nenhuma'}
- As minhas comissoes definidas:
${(comissoes ?? []).map(c => {
  if (c.modelo === 'mensalidade') return `  ${c.servico} > ${c.operadora} ${c.plano || ''}: ${c.num_mensalidades} mensalidades de €${c.valor_mensal}/contrato`
  if (c.modelo === 'percentagem') return `  ${c.servico} > ${c.operadora} ${c.plano || ''}: ${c.percentagem}%`
  return `  ${c.servico} > ${c.operadora} ${c.plano || ''}: €${c.valor_comissao} fixo`
}).join('\n') || '  Nenhuma comissao definida ainda'}
`
  }

  const systemPrompt = isAdmin
    ? `Somos uma empresa portuguesa chamada Solucoes Diferentes. Trabalhas como assistente de analise de dados para o administrador da plataforma CRM.
Ajudas a analisar vendas, parceiros, contratos e comissoes. Responde sempre em portugues europeu, de forma concisa e directa.
Podes fazer calculos, comparacoes e analises com os dados fornecidos. Nao inventes dados que nao estejam no contexto.

${contextData}`
    : `Somos uma empresa portuguesa chamada Solucoes Diferentes. Trabalhas como assistente de apoio para o parceiro comercial ${profile?.full_name || ''}.
Respondes a duvidas sobre: comissoes, vendas, campanhas, como registar vendas, estados dos contratos, e funcionamento da plataforma.
Usa os dados reais do parceiro quando relevante. Responde sempre em portugues europeu, de forma amigavel e clara.
Nao partilhes informacoes de outros parceiros. Sao dados confidenciais.

${contextData}`

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 500,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}
