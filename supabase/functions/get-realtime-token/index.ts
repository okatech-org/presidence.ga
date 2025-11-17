import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    console.log('🔑 [get-realtime-token] Demande de token éphémère...');

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: `Tu es iAsted, l'assistant stratégique du Président du Gabon. 

CONTEXTE:
- Tu as accès aux données nationales et aux analyses en temps réel
- Tu es configuré pour fournir des analyses stratégiques précises
- Tu comprends les enjeux de gouvernance et de sécurité nationale

STYLE DE RÉPONSE:
- Concis et professionnel en français
- Utilise un ton respectueux mais direct
- Priorise les informations critiques
- Structure tes réponses de manière claire

CAPACITÉS:
- Analyse de situations critiques
- Recommandations stratégiques
- Synthèse d'informations complexes
- Support décisionnel en temps réel`
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [get-realtime-token] Erreur OpenAI:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [get-realtime-token] Token créé avec succès');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ [get-realtime-token] Erreur:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
