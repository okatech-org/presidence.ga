import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Analyse de l'intention via Lovable AI avec extraction structurée
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Tu es un analyseur d'intentions pour l'assistant présidentiel iAsted. Analyse les messages pour déterminer :
1. L'intention principale (protocol_xr7, national_synthesis, ministerial_briefing, strategic_analysis, decision_support, query, command)
2. Le style de réponse optimal :
   - concis : Questions simples, commandes directes, confirmations (1-2 phrases max)
   - detaille : Demandes de données, statistiques, rapports (incluant chiffres et détails)
   - strategique : Analyses, décisions complexes, briefings approfondis (avec recommandations)
3. Si le mode continu doit être activé (crises, briefings prolongés, analyses multi-étapes)

Contexte : Assistant TOP SECRET du Président de la République, priorité absolue à la clarté et l'efficacité.`
          },
          {
            role: "user",
            content: `Historique récent:\n${conversationHistory.slice(-3).map((m: any) => `${m.role}: ${m.content}`).join('\n')}\n\nNouveau message: ${userMessage}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_intent",
              description: "Analyse l'intention et détermine le style de réponse optimal",
              parameters: {
                type: "object",
                properties: {
                  intent: {
                    type: "string",
                    enum: ["protocol_xr7", "national_synthesis", "ministerial_briefing", "strategic_analysis", "decision_support", "query", "command"],
                    description: "L'intention principale détectée"
                  },
                  responseStyle: {
                    type: "string",
                    enum: ["concis", "detaille", "strategique"],
                    description: "Le style de réponse optimal"
                  },
                  continuousMode: {
                    type: "boolean",
                    description: "Si le mode continu doit être activé"
                  },
                  reasoning: {
                    type: "string",
                    description: "Explication courte du choix"
                  }
                },
                required: ["intent", "responseStyle", "continuousMode", "reasoning"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_intent" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call received from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        intent: analysis.intent,
        responseStyle: analysis.responseStyle,
        continuousMode: analysis.continuousMode,
        reasoning: analysis.reasoning,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-intent:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        // Fallback safe defaults
        intent: "query",
        responseStyle: "strategique",
        continuousMode: false,
        reasoning: "Analyse par défaut suite à une erreur"
      }),
      {
        status: 200, // Return 200 with defaults instead of 500
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
