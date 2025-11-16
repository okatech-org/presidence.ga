import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, transcript, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await req.json();
    console.log('Received request:', { sessionId, transcript, voiceId });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Sauvegarder le message utilisateur
    const { error: userMsgError } = await supabaseClient
      .from('conversation_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: transcript,
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
    }

    // Récupérer l'historique de conversation
    const { data: messages } = await supabaseClient
      .from('conversation_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const conversationHistory = messages || [];

    // Appeler OpenAI pour la réponse
    const startTime = Date.now();
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es iAsted, l'assistant vocal intelligent de la Présidence du Gabon. Tu aides avec professionnalisme et courtoisie. Réponds de manière concise et claire.`
          },
          ...conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const openaiData = await openaiResponse.json();
    const responseText = openaiData.choices[0].message.content;
    const latency = Date.now() - startTime;

    console.log('OpenAI response:', { responseText, latency });

    // Sauvegarder la réponse de l'assistant
    const { error: assistantMsgError } = await supabaseClient
      .from('conversation_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: responseText,
        tokens: openaiData.usage?.total_tokens,
        latency_ms: latency,
      });

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
    }

    // Générer l'audio avec ElevenLabs
    console.log('Generating audio with ElevenLabs...');
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: responseText,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('ElevenLabs error:', errorText);
      throw new Error(`ElevenLabs API error: ${errorText}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log('Audio generated successfully');

    return new Response(
      JSON.stringify({
        text: responseText,
        audio: audioBase64,
        latency,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-with-iasted:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
