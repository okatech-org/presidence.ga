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

    const startTime = Date.now();
    let itemId: string | null = null;

    try {
        const { record } = await req.json();

        if (!record || !record.content) {
            throw new Error("No content to process");
        }

        itemId = record.id;
        console.log(`[START] Processing intelligence item: ${itemId}`);

        // Log start in database
        await supabase
            .from("intelligence_processing_logs")
            .update({ status: "processing" })
            .eq("item_id", itemId);

        // 1. Analyze with Gemini (Summary, Category, Sentiment)
        console.log(`[${itemId}] Starting Gemini analysis...`);
        const analysis = await analyzeWithGemini(record.content);
        console.log(`[${itemId}] Gemini analysis complete:`, {
            category: analysis.category,
            sentiment: analysis.sentiment,
            entities_count: analysis.entities?.length || 0
        });

        // 2. Generate Embedding (using OpenAI for 1536 dimensions compatibility)
        console.log(`[${itemId}] Starting OpenAI embedding generation...`);
        const embedding = await generateEmbedding(record.content);
        console.log(`[${itemId}] Embedding generated (dimension: ${embedding.length})`);

        // 3. Update the record
        console.log(`[${itemId}] Updating database...`);
        const { error: updateError } = await supabase
            .from("intelligence_items")
            .update({
                summary: analysis.summary,
                category: analysis.category,
                sentiment: analysis.sentiment,
                entities: analysis.entities,
                embedding: embedding,
                updated_at: new Date().toISOString(),
            })
            .eq("id", itemId);

        if (updateError) throw updateError;

        // 4. Log success
        const processingTime = Date.now() - startTime;
        await supabase
            .from("intelligence_processing_logs")
            .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                processing_time_ms: processingTime
            })
            .eq("item_id", itemId);

        console.log(`[SUCCESS] Item ${itemId} processed in ${processingTime}ms`);

        return new Response(JSON.stringify({ 
            success: true, 
            analysis,
            processing_time_ms: processingTime
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`[ERROR] Processing intelligence item ${itemId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        
        // Log error in database
        if (itemId) {
            await supabase
                .from("intelligence_processing_logs")
                .update({
                    status: "error",
                    error_message: errorMessage,
                    completed_at: new Date().toISOString(),
                    processing_time_ms: processingTime
                })
                .eq("item_id", itemId);
        }

        return new Response(JSON.stringify({ 
            error: errorMessage,
            item_id: itemId,
            processing_time_ms: processingTime
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

async function analyzeWithGemini(text: string) {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

    const prompt = `
Analyse le texte suivant provenant d'une source de veille stratégique pour la Présidence du Gabon.

Texte: "${text.substring(0, 2000)}"

Tâche:
1. Résume le contenu en 2-3 phrases maximum (français). Focus sur l'essentiel.
2. Catégorise parmi: 'securite', 'economie', 'social', 'politique', 'rumeur', 'autre'.
3. Détermine le sentiment dominant: 'positif', 'negatif', 'neutre', 'colere', 'peur', 'joie'.
4. Extrait les entités nommées importantes (Personnes, Lieux, Organisations, Événements).

Réponds UNIQUEMENT au format JSON strict (pas de markdown):
{
  "summary": "résumé concis",
  "category": "categorie",
  "sentiment": "sentiment",
  "entities": ["entité1", "entité2"]
}
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Gemini API error:", error);
            throw new Error(`Gemini API failed: ${response.status} - ${error}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error("Invalid Gemini API response structure");
        }

        const resultText = data.candidates[0].content.parts[0].text;

        // Clean up JSON markdown if present
        const jsonStr = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(jsonStr);

        // Validate required fields
        if (!parsed.summary || !parsed.category || !parsed.sentiment) {
            throw new Error("Missing required fields in Gemini response");
        }

        return parsed;
    } catch (error) {
        console.error("Error in analyzeWithGemini:", error);
        throw error;
    }
}

async function generateEmbedding(text: string) {
    // Using OpenAI for 1536 dimensions (standard for pgvector setups usually)
    // If using Gemini embeddings, dimension is 768, need to update SQL table definition
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");

    try {
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

        if (!response.ok) {
            const error = await response.text();
            console.error("OpenAI API error:", error);
            throw new Error(`OpenAI API failed: ${response.status} - ${error}`);
        }

        const data = await response.json();
        
        if (!data.data || !data.data[0]?.embedding) {
            throw new Error("Invalid OpenAI embedding response structure");
        }

        return data.data[0].embedding;
    } catch (error) {
        console.error("Error in generateEmbedding:", error);
        throw error;
    }
}
