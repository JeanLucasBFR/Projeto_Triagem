import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configuração de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Receber os dados do front-end
    const { nome, dataNasc, sintomas, tipo, tempoTriagemSegundos } = await req.json()

    if (!sintomas || !dataNasc) {
      throw new Error('Preencha todos os campos obrigatórios.')
    }

    // 2. Consultar a API da Groq de forma segura
    const groqApiKey = Deno.env.get('GROQ_API_KEY') 
    
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: `Você é um enfermeiro chefe especialista no Protocolo de Manchester de triagem de urgência hospitalar.
            Sua função é classificar rigorosamente a gravidade com base estrita nos sintomas informados:
            - Vermelho - Emergência (Risco iminente de morte)
            - Laranja - Muito Urgente (Potencial risco de vida)
            - Amarelo - Urgente (Urgência moderada)
            - Verde - Pouco Urgente (Pouco urgente)
            - Azul - Não Urgente (Não urgente)

            Retorne APENAS o formato exato da categoria (Ex: "Vermelho - Emergência", "Verde - Pouco Urgente", etc.). Não escreva mais nada.`
          },
          {
            role: "user",
            content: `Sintomas do paciente: ${sintomas}`
          }
        ],
        temperature: 0.1
      })
    })

    const groqData = await groqResponse.json()
    
    if (!groqResponse.ok) {
      console.error("Detalhes do erro da Groq:", groqData)
      throw new Error(`Falha na API da IA: ${groqData.error?.message || 'Erro desconhecido'}`)
    }

    let corGravidade = "Verde" 
    
    if (groqData.choices && groqData.choices.length > 0) {
        corGravidade = groqData.choices[0].message.content.trim()
    } else {
        throw new Error("A IA não retornou nenhuma cor.")
    }

    // 3. Enviar os dados processados para o Webhook do Make.com
    const makeWebhookUrl = 'https://hook.us2.make.com/kz8n4sulmws4bxitvfwpm3ey5mqhvsag'
    
    const makeResponse = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: nome,
        dataNasc: dataNasc,
        sintomas: sintomas,
        tipo: tipo,
        gravidade: corGravidade,
        tempoTriagemSegundos: tempoTriagemSegundos
      })
    })

    if (!makeResponse.ok) {
      throw new Error('Erro ao enviar dados para o Make.com')
    }

    const makeData = await makeResponse.json()

    // 4. Retornar o sucesso para o front-end
    return new Response(
      JSON.stringify({ success: true, id: makeData.id, gravidade: corGravidade }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})