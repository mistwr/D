import { createClient } from '@/lib/supabase/server'
import { streamText, convertToModelMessages, UIMessage } from 'ai'

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

  let contextData = ''
  if (isAdmin) {
    const [vendas, parceiros, comissoes] = await Promise.all([
      supabase.from('vendas').select('status, commission_value').limit(200),
      supabase.from('profiles').select('id').eq('role', 'parceiro'),
      supabase.from('comissoes_operadora').select('servico, operadora, valor_comissao, modelo').limit(200),
    ])
    const totalVendas = vendas.data?.length ?? 0
    const totalComissoes = vendas.data?.reduce((s, v) => s + (parseFloat(v.commission_value) || 0), 0) ?? 0
    contextData = `
Dados do sistema:
- Total de vendas: ${totalVendas}
- Total de comissoes acumuladas: €${totalComissoes.toFixed(2)}
- Parceiros registados: ${parceiros.data?.length ?? 0}
- Comissoes configuradas: ${comissoes.data?.length ?? 0}
`
  }

  const systemPrompt = isAdmin
    ? `Es a Sofia, assistente interna da plataforma Solucoes Diferentes. Fala em portugues de Portugal, de forma profissional e simpática. O utilizador e o administrador: ${nome}. ${contextData} Analisa dados, responde sobre comissoes, parceiros, vendas e campanhas. Nunca inventes dados que nao tens.`
    : `Es a Sofia, assistente virtual da plataforma Solucoes Diferentes. Fala em portugues de Portugal, de forma simpática. O parceiro e: ${nome}${empresa ? ` da empresa ${empresa}` : ''}. Ajuda com duvidas sobre registar vendas, consultar comissoes, simulador, campanhas e publicacoes. Se nao souberes algo especifico, sugere que contacte o administrador.`

  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 500,
  })

  return result.toUIMessageStreamResponse()
}
