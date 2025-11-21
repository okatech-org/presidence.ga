import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { messages, systemPrompt } = await req.json();
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

        if (!LOVABLE_API_KEY) {
            throw new Error('LOVABLE_API_KEY non configurée');
        }

        console.log('[chat-completion] Processing request with', messages.length, 'messages');

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                    { role: 'system', content: systemPrompt || "Vous êtes un assistant utile." },
                    ...messages
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[chat-completion] Error from Lovable:', response.status, errorText);
            throw new Error(`Error from AI provider: ${response.status}`);
        }

        const data = await response.json();
        console.log('[chat-completion] Success');

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[chat-completion] Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
