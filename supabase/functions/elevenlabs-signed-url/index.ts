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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch agent ID from database
    const { data: configData, error: configError } = await supabase
      .from('iasted_config')
      .select('agent_id')
      .single();

    if (configError || !configData?.agent_id) {
      console.error('❌ [elevenlabs-signed-url] No agent configured:', configError);
      throw new Error('No ElevenLabs agent configured. Please create an agent first.');
    }

    const targetAgentId = configData.agent_id;
    console.log('✅ [elevenlabs-signed-url] Using agent:', targetAgentId);

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${targetAgentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`Failed to get signed URL: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ [elevenlabs-signed-url] Signed URL généré avec succès');

    return new Response(
      JSON.stringify({ signedUrl: data.signed_url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in elevenlabs-signed-url:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        hint: 'Please configure a valid ElevenLabs agent ID in Settings. Create an agent at elevenlabs.io/app/conversational-ai'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
