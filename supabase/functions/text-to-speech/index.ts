import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, userRole } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    // Déterminer la voix selon le rôle ou utiliser une voix par défaut
    let selectedVoiceId = voiceId;
    if (!selectedVoiceId) {
      if (userRole === 'president') {
        selectedVoiceId = '9BWtsMINqrJLrRacOk9x'; // Aria
      } else if (userRole === 'minister') {
        selectedVoiceId = 'EXAVITQu4vr4xnSDxMaL'; // Sarah
      } else {
        // Voix iAsted Pro par défaut (voix personnalisée professionnelle)
        selectedVoiceId = 'AWbzS1CRVezWHfMSsL69';
      }
    }

    console.log('🎙️ [text-to-speech] Génération avec voix:', selectedVoiceId);
    console.log('📝 [text-to-speech] Texte:', text.substring(0, 100) + '...');
    console.log('👤 [text-to-speech] Rôle utilisateur:', userRole);
    console.log('🎤 [text-to-speech] VoiceId reçu:', voiceId);
    console.log('✅ [text-to-speech] VoiceId final sélectionné:', selectedVoiceId);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`Failed to generate speech: ${response.status}`);
    }

    // Récupérer l'audio complet
    const audioBuffer = await response.arrayBuffer();
    console.log('✅ [text-to-speech] Audio reçu, taille:', audioBuffer.byteLength, 'bytes');

    // Convertir en base64 en traitant par chunks pour éviter le dépassement de pile
    const audioArray = new Uint8Array(audioBuffer);
    const chunkSize = 8192;
    let binaryString = '';

    for (let i = 0; i < audioArray.length; i += chunkSize) {
      const chunk = audioArray.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }

    const base64Audio = btoa(binaryString);
    console.log('✅ [text-to-speech] Audio encodé en base64, longueur:', base64Audio.length);

    // Retourner le JSON avec audioContent
    return new Response(
      JSON.stringify({
        audioContent: base64Audio,
        voiceId: selectedVoiceId,
        text: text
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in text-to-speech:', error);
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
