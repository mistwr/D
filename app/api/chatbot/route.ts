import { convertToModelMessages, streamText, UIMessage, consumeStream } from 'ai'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Nao autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, company_name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  const nome = profile?.full_name ?? 'utilizador'
  const empresa = profile?.company_name ?? ''

  // Dados contextuais para o admin
  let contextData = ''
  if (isAdmin) {
    const [vendas, parceiros, comissoes] = await Promise.all([
      supabase.from('vendas').select('status, operator, service_type, commission_value').limit(200),
      supabase.from('profiles').select('full_name, company_name, role').eq('role', 'parceiro').limit(100),
      supabase.from('comissoes_operadora').select('servico, operadora, valor_comissao, modelo').limit(200),
    ])
    const totalVendas = vendas.data?.length ?? 0
    const vendasAtivas = vendas.data?.filter(v => v.status === 'ativa' || v.status === 'aprovada').length ?? 0
    const totalComissoes = vendas.data?.reduce((s, v) => s + (parseFloat(v.commission_value) || 0), 0) ?? 0
    contextData = `
Dados actuais do sistema:
- Total de vendas: ${totalVendas} (${vendasAtivas} activas/aprovadas)
- Total de comissoes acumuladas: €${totalComissoes.toFixed(2)}
- Parceiros registados: ${parceiros.data?.length ?? 0}
- Comissoes configuradas: ${comissoes.data?.length ?? 0}
`
  }

  const systemPrompt = isAdmin
    ? `Eres a Sofia, assistente de análise e suporte interno da plataforma Soluções Diferentes.
Fala sempre em português de Portugal, de forma profissional mas simpática.
O utilizador é o administrador do sistema: ${nome}.
${contextData}
Podes analisar dados, responder sobre comissões, parceiros, vendas, campanhas e ajudar a tomar decisões.
Quando te pedem análises, usa os dados acima para dar respostas concretas e úteis.
Nunca inventes dados que não tens. Se não souberes algo, diz honestamente.`
    : `Eres a Sofia, assistente virtual da plataforma Soluções Diferentes.
Fala sempre em português de Portugal, de forma simpática e prestável.
O parceiro que está a falar contigo é: ${nome}${empresa ? ` da empresa ${empresa}` : ''}.
Podes ajudar com dúvidas sobre:
- Como registar vendas na plataforma
- Como consultar comissões e contratos
- Como usar o simulador
- Como aceder a campanhas e publicações
- Dúvidas gerais sobre energia, gás, seguros e telecomunicações
- Processos e procedimentos da plataforma
Sê sempre prestável, claro e conciso. Se não souberes algo específico, sugere que o parceiro contacte o administrador.`

  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
    maxOutputTokens: 500,
  })

  return result.toUIMessageStreamResponse({ consumeSseStream: consumeStream })
}
