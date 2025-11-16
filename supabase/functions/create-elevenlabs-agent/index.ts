import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      agentName = 'iAsted',
      presidentVoiceId = '9BWtsMINqrJLrRacOk9x',
      ministerVoiceId = 'EXAVITQu4vr4xnSDxMaL',
      defaultVoiceId = 'Xb7hH8MSUJpSbSDYk0k2'
    } = await req.json();

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    // Créer un agent avec une configuration de base
    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/agents/create',
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: agentName,
          conversation_config: {
            agent: {
              prompt: {
                prompt: "Vous êtes iAsted, l'assistant intelligent de la République Gabonaise. Répondez de manière professionnelle et concise.",
              },
              first_message: "Bonjour, iAsted à votre service. Comment puis-je vous aider?",
              language: "fr",
            },
            tts: {
              voice_id: defaultVoiceId,
              model_id: "eleven_turbo_v2_5",
            },
            asr: {
              quality: "high",
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`Failed to create agent: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        agentId: data.agent_id,
        agentName: data.name,
        presidentVoiceId,
        ministerVoiceId,
        defaultVoiceId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-elevenlabs-agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
