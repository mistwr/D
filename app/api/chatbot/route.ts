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

  const { messages } = await req.json()

  const apiKey = process.env.AI_GATEWAY_API_KEY ?? process.env.OPENAI_API_KEY ?? ''

  const gatewayRes = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      stream: true,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
    }),
    signal: req.signal,
  })

  if (!gatewayRes.ok) {
    const err = await gatewayRes.text()
    return Response.json({ error: err }, { status: 500 })
  }

  // Proxy the SSE stream directly to the client
  const stream = new ReadableStream({
    async start(controller) {
      const reader = gatewayRes.body!.getReader()
      const decoder = new TextDecoder()
      const encoder = new TextEncoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              continue
            }
            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', delta })}\n\n`))
              }
            } catch { /* skip malformed */ }
          }
        }
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
