import { createClient } from '@/lib/supabase/server'
import { streamText, convertToModelMessages, UIMessage } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  // Tentar obter sessao - nao e obrigatorio
  let isAdmin = false
  let nome = 'utilizador'
  let empresa = ''
  let contextData = ''

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, company_name')
        .eq('id', user.id)
        .single()

      isAdmin = profile?.role === 'admin'
      nome = profile?.full_name ?? 'utilizador'
      empresa = profile?.company_name ?? ''

      if (isAdmin) {
        const [vendas, parceiros, comissoes] = await Promise.all([
          supabase.from('vendas').select('status, commission_value').limit(200),
          supabase.from('profiles').select('id').eq('role', 'parceiro'),
          supabase.from('comissoes_operadora').select('servico, operadora, valor_comissao, modelo').limit(200),
        ])
        const totalVendas = vendas.data?.length ?? 0
        const totalComissoes = vendas.data?.reduce((s, v) => s + (parseFloat(v.commission_value) || 0), 0) ?? 0
        contextData = `
Dados actuais do sistema:
- Total de vendas registadas: ${totalVendas}
- Total de comissoes acumuladas: €${totalComissoes.toFixed(2)}
- Parceiros activos: ${parceiros.data?.length ?? 0}
- Tabelas de comissoes configuradas: ${comissoes.data?.length ?? 0}
`
      }
    }
  } catch {
    // continua sem dados de sessao
  }

  const systemPrompt = isAdmin
    ? `És a Sofia, assistente interna da plataforma Soluções Diferentes. Fala sempre em português de Portugal, de forma profissional e simpática. O utilizador é o administrador chamado ${nome}.

${contextData}

Podes ajudar o admin a:
- Analisar dados de vendas, comissões e parceiros
- Gerir publicações e campanhas da plataforma
- Interpretar métricas e tendências
- Responder dúvidas sobre configurações do sistema
- Sugerir ações com base nos dados disponíveis

Sê concisa e directa. Nunca inventes dados que não tens disponíveis.`
    : `És a Sofia, assistente virtual da plataforma Soluções Diferentes. Fala sempre em português de Portugal, de forma simpática e prestável. ${nome !== 'utilizador' ? `O parceiro é ${nome}${empresa ? ` da empresa ${empresa}` : ''}.` : ''}

Podes ajudar com:
- Como registar uma venda no sistema
- Como consultar comissões e pagamentos
- Como usar o simulador de comissões
- Como ver e participar em campanhas activas
- Como publicar e partilhar conteúdo
- Dúvidas gerais sobre o funcionamento da plataforma

Se não souberes algo específico ou relacionado com dados privados, sugere que o parceiro contacte o administrador.`

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 600,
  })

  return result.toUIMessageStreamResponse()
}
