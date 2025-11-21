import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify JWT token is present
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's JWT to verify authentication
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ [create-elevenlabs-agent] Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 [create-elevenlabs-agent] User ${user.email} creating agent`);

    console.log('🔍 [create-elevenlabs-agent] Début de la requête');
    
    // Ne pas parser le body s'il est vide
    let bodyData = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        bodyData = JSON.parse(text);
      }
    } catch (e) {
      console.log('ℹ️ [create-elevenlabs-agent] Pas de body, utilisation valeurs par défaut');
    }
    
    const { 
      agentName = 'iAsted - Assistant Présidentiel',
      defaultVoiceId = 'EV6XgOdBELK29O2b4qyM' // iAsted Pro
    } = bodyData as any;

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('❌ [create-elevenlabs-agent] ELEVENLABS_API_KEY manquante');
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    console.log('🚀 [create-elevenlabs-agent] Création agent avec voix:', defaultVoiceId);

    // Créer un agent avec configuration complète pour iAsted Pro
    const agentConfig = {
      name: agentName,
      conversation_config: {
        agent: {
          prompt: {
            prompt: `Tu es iAsted, l'assistant vocal intelligent du Président de la République du Gabon.

Tu dois t'adresser au Président avec respect en utilisant "Excellence" ou "Monsieur le Président".

Tes missions principales:
- Fournir des analyses sur les signalements de corruption et les données du système
- Présenter les KPIs nationaux (taux de résolution, fonds récupérés, satisfaction publique)
- Alerter sur les situations critiques nécessitant une attention présidentielle
- Conseiller sur les décisions à prendre en fonction des données disponibles
- Répondre aux questions sur les performances des institutions

Tu dois être:
- Professionnel et respectueux
- Précis dans tes analyses avec des chiffres concrets
- Proactif pour alerter sur les urgences
- Capable d'expliquer clairement les situations complexes
- Concis mais complet dans tes réponses

N'hésite pas à poser des questions de clarification si nécessaire.`,
          },
          first_message: "Bonjour Excellence, je suis iAsted, votre assistant vocal intelligent. Comment puis-je vous être utile ?",
          language: "fr",
        },
        tts: {
          voice_id: defaultVoiceId,
          model_id: "eleven_turbo_v2_5",
          optimize_streaming_latency: 3,
          stability: 0.85,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
        asr: {
          quality: "high",
        },
      },
    };

    console.log('📦 [create-elevenlabs-agent] Configuration préparée');

    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/agents/create',
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentConfig),
      }
    );

    console.log('📡 [create-elevenlabs-agent] Statut réponse:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [create-elevenlabs-agent] Erreur ElevenLabs:', response.status, errorText);
      throw new Error(`Failed to create agent: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('📄 [create-elevenlabs-agent] Réponse reçue, longueur:', responseText.length);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ [create-elevenlabs-agent] Erreur parsing JSON:', e);
      console.error('📄 [create-elevenlabs-agent] Réponse brute:', responseText.substring(0, 200));
      throw new Error('Invalid JSON response from ElevenLabs');
    }

    const agentId = data.agent_id;
    console.log('✅ [create-elevenlabs-agent] Agent créé:', agentId);

    // Save agent_id to database using service role key for admin operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('💾 [create-elevenlabs-agent] Sauvegarde dans la base de données...');

    // Upsert into iasted_config (insert or update if exists)
    const { error: dbError } = await supabaseAdmin
      .from('iasted_config')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001', // Use fixed UUID to ensure single row
        agent_id: agentId,
        agent_name: agentName,
        default_voice_id: defaultVoiceId,
        president_voice_id: '9BWtsMINqrJLrRacOk9x', // Aria
        minister_voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah
      }, {
        onConflict: 'id'
      });

    if (dbError) {
      console.error('❌ [create-elevenlabs-agent] Erreur sauvegarde DB:', dbError);
      throw new Error(`Failed to save agent to database: ${dbError.message}`);
    }

    console.log('✅ [create-elevenlabs-agent] Agent sauvegardé dans la base');

    return new Response(
      JSON.stringify({
        agentId: agentId,
        agentName: agentName,
        voiceId: defaultVoiceId,
        message: 'Agent créé avec succès'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ [create-elevenlabs-agent] Erreur complète:', error);
    console.error('❌ [create-elevenlabs-agent] Stack:', error instanceof Error ? error.stack : 'N/A');
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
