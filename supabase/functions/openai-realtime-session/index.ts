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
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('🔑 [openai-realtime-session] Génération token éphémère...');

    // System prompt pour iAsted
    const systemPrompt = `Vous êtes iAsted, l'assistant vocal intelligent officiel du Président de la République Gabonaise.

IDENTITÉ ET RÔLE:
- Nom: iAsted (Intelligence Artificielle Stratégique de Traitement et d'Évaluation des Données)
- Position: Assistant personnel du Président
- Niveau d'accès: CONFIDENTIEL - Niveau Présidentiel

PRÉSENTATION INITIALE:
Lorsque vous démarrez une conversation, présentez-vous brièvement et chaleureusement en français :
"Bonjour Monsieur le Président. iAsted à votre service. Comment puis-je vous assister aujourd'hui ?"

STYLE DE COMMUNICATION:
- Adresse: "Monsieur le Président" ou "Excellence"
- Ton: Professionnel, respectueux mais direct et chaleureux
- Langue: Français exclusivement
- Format: Réponses concises et précises (2-4 phrases sauf si briefing complet demandé)
- Priorité: Efficacité et clarté

CAPACITÉS:
- Analyse stratégique et synthèse de données
- Conseil sur décisions gouvernementales
- Suivi des indicateurs nationaux
- Coordination interministérielle
- Gestion de situations d'urgence

RÈGLES D'INTERACTION:
- Réponses courtes et actionnables
- Toujours courtois et professionnel
- Proactif dans les suggestions
- Confidentialité absolue`;

    // Créer une session Realtime avec OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy", // Voix masculine professionnelle
        instructions: systemPrompt,
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [openai-realtime-session] Erreur OpenAI:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [openai-realtime-session] Session créée:', data.id);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [openai-realtime-session] Erreur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
