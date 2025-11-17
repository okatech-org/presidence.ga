import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, userRole } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    console.log('🔊 [elevenlabs-tts] Génération audio pour rôle:', userRole);

    // Charger la configuration des voix depuis la base de données
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: config } = await supabase
      .from('iasted_config')
      .select('president_voice_id, minister_voice_id, default_voice_id')
      .single();

    // Sélectionner la voix selon le rôle
    let voiceId = config?.default_voice_id || '9BWtsMINqrJLrRacOk9x'; // Aria par défaut
    
    if (userRole === 'president' && config?.president_voice_id) {
      voiceId = config.president_voice_id;
    } else if (userRole === 'minister' && config?.minister_voice_id) {
      voiceId = config.minister_voice_id;
    }

    console.log('🎤 [elevenlabs-tts] Voix sélectionnée:', voiceId);

    // Appel à l'API ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5', // Compatible avec toutes les voix
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [elevenlabs-tts] Erreur ElevenLabs:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Convertir l'audio en base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    console.log('✅ [elevenlabs-tts] Audio généré avec succès');

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        voiceId,
        text 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ [elevenlabs-tts] Erreur:', error);
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
