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
    console.log(`💰 Limite de coût: ${config.max_cost_limit || 10}$`);
    console.log(`🤖 Modèles IA: ${config.ai_providers || ['gpt']}`);

    // Simulation du coût estimé (dans un cas réel, cela dépendrait du volume de données)
    const estimatedCost = (sources?.length || 0) * 0.5; // 0.5$ par source

    if (config.max_cost_limit && estimatedCost > config.max_cost_limit) {
      console.error(`❌ Coût estimé (${estimatedCost}$) dépasse la limite (${config.max_cost_limit}$)`);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Coût estimé (${estimatedCost}$) dépasse la limite (${config.max_cost_limit}$)`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pour chaque source, on va simuler la collecte
    // Dans une vraie implémentation, vous appelleriez des APIs ou des scrapers externes
    const results = [];

    for (const source of sources || []) {
      try {
        // Simuler la collecte (à remplacer par de vraies API calls)
        console.log(`🔍 Collecte depuis: ${source.name}`);

        // Exemple de données simulées
        // Génération de contenu réaliste pour la démo
        const generateMockContent = (sourceName: string) => {
          const topics = [
            "Le Président de la Transition a inauguré aujourd'hui le nouveau centre hospitalier de Libreville, marquant une avancée majeure pour la santé publique.",
            "Réunion stratégique au Palais du Bord de Mer : les ministres discutent des nouvelles réformes économiques pour 2026.",
            "La jeunesse gabonaise se mobilise pour l'entrepreneuriat numérique lors du forum 'Gabon Digital' ce week-end.",
            "Mise au point du Ministère de l'Économie sur les rumeurs d'augmentation du prix du carburant : 'Aucune hausse n'est prévue'.",
            "Le Gabon renforce sa coopération bilatérale avec les partenaires internationaux pour la protection de la biodiversité.",
            "Succès de la campagne de vaccination nationale : plus de 80% de la population cible atteinte dans l'Estuaire.",
            "Les travaux de réhabilitation de la route nationale 1 avancent selon le calendrier prévu, annonce le Ministre des Travaux Publics.",
            "Alerte météo : de fortes pluies sont attendues sur la côte dans les prochaines 48 heures. Prudence recommandée.",
            "Le secteur minier enregistre une croissance de 5% au dernier trimestre, portée par l'exportation de manganèse.",
            "Culture : Le festival des arts et traditions du Gabon ouvrira ses portes le mois prochain à Port-Gentil."
          ];
          const randomTopic = topics[Math.floor(Math.random() * topics.length)];

          if (sourceName.toLowerCase().includes('twitter') || sourceName.toLowerCase().includes('x')) {
            return `${randomTopic} #Gabon #Transition #Politique`;
          } else if (sourceName.toLowerCase().includes('facebook')) {
            return `[COMMUNIQUÉ] ${randomTopic} \n\nRetrouvez plus de détails sur notre page officielle. N'hésitez pas à partager et commenter.`;
          } else {
            return `FLASH INFO - ${randomTopic} (Source: ${sourceName})`;
          }
        };

        const mockItems = [
          {
            content: generateMockContent(source.name),
            author: source.name,
            source_id: source.id,
            published_at: new Date().toISOString(),
            external_id: `${source.id}-${Date.now()}`,
            ai_provider: config.ai_providers ? config.ai_providers[0] : 'gpt'
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
