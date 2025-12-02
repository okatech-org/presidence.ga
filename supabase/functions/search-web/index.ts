import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

        console.log(`Searching web for: ${query}`);

        // SIMULATED SEARCH RESULTS (Replace with Tavily/Serper API call later)
        // const apiKey = Deno.env.get("TAVILY_API_KEY");
        // const response = await fetch("https://api.tavily.com/search", ...);

        // Mock response based on query keywords to make it feel real
        let results = [];
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes("pib") || lowerQuery.includes("économie")) {
            results = [
                {
                    title: "Perspectives économiques du Gabon 2024-2025",
                    url: "https://www.banquemondiale.org/fr/country/gabon/overview",
                    content: "La croissance du PIB du Gabon devrait se stabiliser autour de 3.0% en 2025, soutenue par le secteur hors pétrole. Les réformes structurelles en cours visent à diversifier l'économie.",
                    published_date: "2024-11-15"
                },
                {
                    title: "Indicateurs économiques Gabon - FMI",
                    url: "https://www.imf.org/en/Countries/GAB",
                    content: "Le FMI projette une inflation maîtrisée à 2.5% pour l'année à venir. Les investissements dans les infrastructures devraient stimuler la demande intérieure.",
                    published_date: "2024-10-20"
                }
            ];
        } else if (lowerQuery.includes("climat") || lowerQuery.includes("environnement")) {
            results = [
                {
                    title: "Le Gabon et les crédits carbone",
                    url: "https://www.jeuneafrique.com/gabon-climat",
                    content: "Le Gabon continue de jouer un rôle leader dans la préservation du bassin du Congo. Le pays a émis 90 millions de tonnes de crédits carbone validés par la CCNUCC.",
                    published_date: "2024-09-10"
                }
            ];
        } else {
            // Generic fallback
            results = [
                {
                    title: `Résultats de recherche pour : ${query}`,
                    url: "https://www.google.com/search?q=" + encodeURIComponent(query),
                    content: `Voici les informations trouvées concernant "${query}". Le sujet est actuellement discuté dans plusieurs sources d'actualités et rapports récents.`,
                    published_date: new Date().toISOString().split('T')[0]
                }
            ];
        }

        return new Response(JSON.stringify({
            success: true,
            results: results,
            source: "simulated_web_search"
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error searching web:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
