import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Démarrage de la collecte d\'intelligence...');

    // Récupérer la configuration
    const { data: config, error: configError } = await supabase
      .from('intelligence_scraping_config')
      .select('*')
      .single();

    if (configError) {
      console.error('Erreur configuration:', configError);
      throw configError;
    }

    if (!config.enabled) {
      console.log('⏸️  Système désactivé');
      return new Response(
        JSON.stringify({ message: 'Système désactivé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les sources actives
    const { data: sources, error: sourcesError } = await supabase
      .from('intelligence_sources')
      .select('*')
      .eq('status', 'active');

    if (sourcesError) throw sourcesError;

    console.log(`📡 ${sources?.length || 0} sources actives trouvées`);

    // Pour chaque source, on va simuler la collecte
    // Dans une vraie implémentation, vous appelleriez des APIs ou des scrapers externes
    const results = [];
    
    for (const source of sources || []) {
      try {
        // Simuler la collecte (à remplacer par de vraies API calls)
        console.log(`🔍 Collecte depuis: ${source.name}`);
        
        // Exemple de données simulées
        const mockItems = [
          {
            content: `Information collectée depuis ${source.name} - ${new Date().toISOString()}`,
            author: source.name,
            source_id: source.id,
            published_at: new Date().toISOString(),
            external_id: `${source.id}-${Date.now()}`
          }
        ];

        // Insérer dans intelligence_items (le trigger se chargera de l'analyse)
        const { data: inserted, error: insertError } = await supabase
          .from('intelligence_items')
          .insert(mockItems)
          .select();

        if (insertError) {
          console.error(`Erreur insertion ${source.name}:`, insertError);
          results.push({ source: source.name, status: 'error', error: insertError.message });
        } else {
          console.log(`✅ ${inserted?.length || 0} items insérés depuis ${source.name}`);
          results.push({ source: source.name, status: 'success', count: inserted?.length || 0 });
        }

        // Mettre à jour last_crawled_at
        await supabase
          .from('intelligence_sources')
          .update({ last_crawled_at: new Date().toISOString() })
          .eq('id', source.id);

      } catch (error: any) {
        console.error(`Erreur source ${source.name}:`, error);
        results.push({ source: source.name, status: 'error', error: error.message });
      }
    }

    // Mettre à jour la configuration avec la prochaine exécution
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + config.frequency_hours);

    await supabase
      .from('intelligence_scraping_config')
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRun.toISOString()
      })
      .eq('id', config.id);

    console.log('✨ Collecte terminée');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Collecte terminée',
        results,
        next_run: nextRun.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
