import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Configuration
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY"); // Optional if using OpenAI embeddings
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
        const { record } = await req.json();

        if (!record || !record.content) {
            throw new Error("No content to process");
        }

        console.log(`Processing intelligence item: ${record.id}`);

        // 1. Analyze with Gemini (Summary, Category, Sentiment)
        const analysis = await analyzeWithGemini(record.content);

        // 2. Generate Embedding (using OpenAI for 1536 dimensions compatibility, or Gemini)
        // We'll use OpenAI here for the 1536 dim vector we defined in SQL, but could be adapted
        const embedding = await generateEmbedding(record.content);

        // 3. Update the record
        const { error } = await supabase
            .from("intelligence_items")
            .update({
                summary: analysis.summary,
                category: analysis.category,
                sentiment: analysis.sentiment,
                entities: analysis.entities,
                embedding: embedding,
                updated_at: new Date().toISOString(),
            })
            .eq("id", record.id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, analysis }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error processing intelligence:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

async function analyzeWithGemini(text: string) {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

    const prompt = `
    Analyse le texte suivant provenant d'une source de veille (WhatsApp, Web, etc.) pour la Présidence du Gabon.
    
    Texte: "${text.substring(0, 2000)}"
    
    Tâche:
    1. Résume le contenu en 2 phrases maximum (français).
    2. Catégorise parmi: 'securite', 'economie', 'social', 'politique', 'rumeur', 'autre'.
    3. Détermine le sentiment: 'positif', 'negatif', 'neutre', 'colere', 'peur', 'joie'.
    4. Extrait les entités nommées (Personnes, Lieux, Organisations).

    Réponds UNIQUEMENT au format JSON:
    {
      "summary": "...",
      "category": "...",
      "sentiment": "...",
      "entities": ["..."]
    }
  `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;

    // Clean up JSON markdown if present
    const jsonStr = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
}

async function generateEmbedding(text: string) {
    // Using OpenAI for 1536 dimensions (standard for pgvector setups usually)
    // If using Gemini embeddings, dimension is 768, need to update SQL table definition
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");

    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text.substring(0, 8000) // Truncate if too long
        })
    });

    const data = await response.json();
    return data.data[0].embedding;
}
