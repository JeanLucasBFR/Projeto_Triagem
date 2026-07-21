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
    const { nome, dataNasc, sintomas, tipo } = await req.json()

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
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Você é um enfermeiro especialista no Protocolo de Manchester. Analise os sintomas do paciente e retorne APENAS uma das seguintes palavras para a cor da pulseira correspondente: Vermelho, Laranja, Amarelo, Verde ou Azul. Não escreva mais nada, apenas a cor com a primeira letra maiúscula."
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
    let corGravidade = "Verde" 
    
    if (groqData.choices && groqData.choices.length > 0) {
        corGravidade = groqData.choices[0].message.content.trim()
    }

    // 3. Enviar os dados processados para o Webhook do Make.com
    const makeWebhookUrl = 'https://hook.us2.make.com/kz8n4sulmws4bxitvfwpm3ey5mqhvsag' // <-- Cole sua URL do Make aqui
    
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
        gravidade: corGravidade
      })
    })

    if (!makeResponse.ok) {
      throw new Error('Erro ao enviar dados para o Make.com')
    }

    // 4. Retornar o sucesso para o front-end
    return new Response(
      JSON.stringify({ success: true, gravidade: corGravidade }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})