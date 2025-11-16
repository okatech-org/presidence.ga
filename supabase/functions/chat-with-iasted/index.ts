import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Vous êtes iAsted, l'assistant vocal intelligent du Gabon.

IDENTITÉ:
- Nom: iAsted (Intelligence Artificielle Stratégique)
- Rôle: Assistant vocal multifonctionnel

STYLE DE COMMUNICATION:
- Ton: Professionnel, respectueux et concis
- Format: Réponses claires et actionnables
- Langue: Français par défaut

CAPACITÉS:
1. Répondre aux questions sur les données disponibles
2. Fournir des analyses et synthèses
3. Assister dans les tâches quotidiennes
4. Gérer les commandes vocales

RÈGLES:
- Réponses courtes et précises (2-3 phrases max sauf si détails demandés)
- Toujours rester courtois et professionnel
- Si information manquante, le signaler clairement`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('[chat-with-iasted] Request:', JSON.stringify(body, null, 2));

    // Mode nouveau avec sessionId
    const {
      sessionId,
      userId,
      audioBase64,
      transcriptOverride,
      langHint = 'fr',
      voiceId,
      generateAudio = true,
    } = body;

    if (!sessionId) {
      throw new Error('sessionId est requis');
    }

    const startTime = Date.now();
    let sttLatency = 0;
    let llmLatency = 0;
    let ttsLatency = 0;

    // 1. Transcription (si audio fourni)
    let userTranscript = transcriptOverride;
    
    if (audioBase64 && !transcriptOverride) {
      const sttStart = Date.now();
      console.log('[chat-with-iasted] Transcription audio...');

      const transcriptionResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/speech-to-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({ audio: audioBase64 }),
        }
      );

      if (!transcriptionResponse.ok) {
        throw new Error('Échec de la transcription');
      }

      const transcriptionData = await transcriptionResponse.json();
      userTranscript = transcriptionData.text;
      sttLatency = Date.now() - sttStart;
      console.log('[chat-with-iasted] Transcription:', userTranscript);
    }

    if (!userTranscript) {
      throw new Error('Aucune transcription disponible');
    }

    // 2. Récupérer l'historique de conversation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const messagesResponse = await fetch(
      `${supabaseUrl}/rest/v1/conversation_messages?session_id=eq.${sessionId}&order=created_at.asc&limit=10`,
      {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const previousMessages = messagesResponse.ok ? await messagesResponse.json() : [];
    console.log('[chat-with-iasted] Messages précédents:', previousMessages.length);

    // 3. Construire le contexte pour GPT
    const conversationHistory = previousMessages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    conversationHistory.push({
      role: 'user',
      content: userTranscript,
    });

    // 4. Appeler Lovable AI Gateway
    const llmStart = Date.now();
    console.log('[chat-with-iasted] Génération réponse GPT...');

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY non configurée');
    }

    const gptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory,
        ],
        temperature: 0.7,
      }),
    });

    if (!gptResponse.ok) {
      if (gptResponse.status === 429) {
        throw new Error('Rate limit dépassé, veuillez réessayer plus tard');
      }
      if (gptResponse.status === 402) {
        throw new Error('Crédits insuffisants, veuillez recharger votre compte');
      }
      const errorText = await gptResponse.text();
      throw new Error(`Erreur GPT: ${errorText}`);
    }

    const gptData = await gptResponse.json();
    const assistantResponse = gptData.choices[0].message.content;
    llmLatency = Date.now() - llmStart;
    console.log('[chat-with-iasted] Réponse:', assistantResponse);

    // 5. Sauvegarder les messages
    await fetch(`${supabaseUrl}/rest/v1/conversation_messages`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey!,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify([
        {
          session_id: sessionId,
          role: 'user',
          content: userTranscript,
          created_at: new Date().toISOString(),
        },
        {
          session_id: sessionId,
          role: 'assistant',
          content: assistantResponse,
          created_at: new Date().toISOString(),
        },
      ]),
    });

    // 6. Génération audio (si demandé)
    let audioContent = null;
    
    if (generateAudio) {
      const ttsStart = Date.now();
      console.log('[chat-with-iasted] Génération audio...');

      const ttsResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            text: assistantResponse,
            voiceId: voiceId,
          }),
        }
      );

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        audioContent = ttsData.audioContent;
        ttsLatency = Date.now() - ttsStart;
      }
    }

    const totalLatency = Date.now() - startTime;

    // 7. Réponse
    return new Response(
      JSON.stringify({
        ok: true,
        answer: assistantResponse,
        audioContent,
        route: {
          category: 'query', // Simplifi pour l'instant
        },
        latencies: {
          stt: sttLatency,
          llm: llmLatency,
          tts: ttsLatency,
          total: totalLatency,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[chat-with-iasted] Erreur:', error);
    
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
