import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { query } = await req.json();

        if (!query) {
            throw new Error("Query is required");
        }

        console.log(`Searching intelligence for: ${query}`);

        // 1. Generate Embedding for the query
        const embedding = await generateEmbedding(query);

        // 2. Call RPC to search by vector similarity
        const { data: results, error } = await supabase.rpc("query_intelligence", {
            query_embedding: embedding,
            match_threshold: 0.7, // Seuil de similarité (à ajuster)
            match_count: 5        // Nombre de résultats
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error searching intelligence:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

async function generateEmbedding(text: string) {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");

    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text.substring(0, 8000)
        })
    });

    const data = await response.json();
    return data.data[0].embedding;
}
