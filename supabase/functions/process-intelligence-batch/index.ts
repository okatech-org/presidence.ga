import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Find items without embeddings
        const { data: items, error } = await supabase
            .from("intelligence_items")
            .select("id, content, author, source_id, published_at")
            .is("embedding", null)
            .limit(50); // Process in batches of 50 to avoid timeouts

        if (error) throw error;

        console.log(`Found ${items?.length || 0} items to process`);

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ processed: 0, message: "No items to process" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. Trigger processing for each item
        // We can call the process-intelligence function for each, or just update them here.
        // Calling the function is better to reuse logic (Gemini analysis + Embedding).

        const functionUrl = `${SUPABASE_URL}/functions/v1/process-intelligence`;
        const results = [];

        for (const item of items) {
            try {
                const response = await fetch(functionUrl, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        record: item
                    }),
                });

                if (response.ok) {
                    results.push({ id: item.id, status: "success" });
                } else {
                    const text = await response.text();
                    console.error(`Failed to process item ${item.id}:`, text);
                    results.push({ id: item.id, status: "error", error: text });
                }
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                console.error(`Error processing item ${item.id}:`, err);
                results.push({ id: item.id, status: "error", error: errorMessage });
            }
        }

        return new Response(JSON.stringify({
            processed: results.filter(r => r.status === 'success').length,
            results
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Batch processing error:", error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
