import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `Você é um especialista em copywriting e SEO para Mercado Livre. Sua tarefa é criar anúncios completos e profissionais seguindo rigorosamente o padrão abaixo.

📦 ESTRUTURA OBRIGATÓRIA DE ENTREGA

1. TÍTULO PARA MERCADO LIVRE
• Otimizado para SEO interno (máximo 60 caracteres)
• Claro, objetivo e focado em conversão

2. DESCRIÇÃO COM MÉTODO AIDA (ESTOQUE PRÓPRIO)
• Atenção: Gancho inicial forte
• Interesse: Benefícios principais
• Desejo: Por que comprar agora
• Ação: Chamada para ação clara

3. VERSÃO MERCADO LIVRE CLÁSSICO
• Copy equilibrada
• Foco em clareza, confiança e decisão segura

4. VERSÃO MERCADO LIVRE PREMIUM
• Copy mais persuasiva
• Destaque para valor, benefícios e diferenciais

5. BULLET POINTS TÉCNICOS
• Especificações objetivas
• Fácil leitura (mobile-first)
• Use emojis relevantes

6. TEXTO PARA IMAGEM PRINCIPAL
• Curto (máximo 8 palavras)
• Impactante
• Focado em chamar o clique

7. GATILHOS MENTAIS (OBRIGATÓRIOS)
• Urgência: Ex: "Últimas unidades"
• Prova social: Ex: "Mais de X vendidos"
• Garantia / segurança da compra

8. PERGUNTAS FREQUENTES (FAQ) OTIMIZADAS
• Mínimo 5 perguntas e respostas
• Antecipar objeções
• Reduzir perguntas repetidas
• Aumentar conversão

9. CÓDIGO SKU EXCLUSIVO
• Padrão: CATEGORIA-NOME-VARIANTE
• Fácil identificação e controle de estoque

🎯 DIRETRIZES FIXAS
• Idioma: Português (Brasil)
• Sempre considerar: ESTOQUE PRÓPRIO
• Foco total em vendas e conversão
• Respeitar políticas do Mercado Livre
• Texto claro, escaneável e profissional
• Organização por seções com títulos visíveis

FORMATO DE RESPOSTA:
Responda em JSON válido com a seguinte estrutura:
{
  "titulo": "string (máximo 60 caracteres)",
  "descricao_aida": {
    "atencao": "string",
    "interesse": "string",
    "desejo": "string",
    "acao": "string"
  },
  "versao_classico": "string",
  "versao_premium": "string",
  "bullet_points": ["string", "string", ...],
  "texto_imagem": "string (máximo 8 palavras)",
  "gatilhos_mentais": {
    "urgencia": "string",
    "prova_social": "string",
    "garantia": "string"
  },
  "faq": [
    {"pergunta": "string", "resposta": "string"},
    ...
  ],
  "sku": "string"
}`;

interface GenerateRequest {
  product_name: string;
  category?: string;
  price?: number;
  additional_info?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body: GenerateRequest = await req.json();
    const { product_name, category, price, additional_info } = body;

    if (!product_name) {
      return new Response(
        JSON.stringify({ error: 'product_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userPrompt = `Crie um anúncio completo para o seguinte produto:\n\nPRODUTO: ${product_name}`;
    
    if (category) {
      userPrompt += `\nCATEGORIA: ${category}`;
    }
    if (price) {
      userPrompt += `\nPREÇO: R$ ${price.toFixed(2)}`;
    }
    if (additional_info) {
      userPrompt += `\nINFORMAÇÕES ADICIONAIS: ${additional_info}`;
    }

    console.log('[Listing Generator] Generating listing for:', product_name);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos na sua conta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('[Listing Generator] AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar anúncio' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from AI');
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsedContent;
    try {
      // Remove markdown code blocks if present
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        jsonStr = content.replace(/```\n?/g, '');
      }
      parsedContent = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('[Listing Generator] Failed to parse JSON:', parseError);
      // Return raw content if JSON parsing fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          raw_content: content,
          parsed: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Listing Generator] Successfully generated listing');

    return new Response(
      JSON.stringify({ 
        success: true, 
        listing: parsedContent,
        parsed: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Listing Generator] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
