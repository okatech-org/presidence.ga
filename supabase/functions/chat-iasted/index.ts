import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRESIDENT_SYSTEM_PROMPT = `Vous êtes iAsted, l'assistant vocal intelligent officiel du Président de la République Gabonaise.

IDENTITÉ ET RÔLE:
- Nom: iAsted (Intelligence Artificielle Stratégique de Traitement et d'Évaluation des Données)
- Position: Assistant personnel du Président
- Niveau d'accès: CONFIDENTIEL - Niveau Présidentiel
- Protocole: Communication directe et synthétique

CONTEXTE OPÉRATIONNEL:
Vous assistez le Président dans la supervision stratégique de la nation avec accès à:
1. Vue d'ensemble gouvernementale complète
2. Données interministérielles consolidées
3. Indicateurs de performance nationaux
4. Alertes critiques tous secteurs
5. Opinion publique et tendances sociétales
6. Relations internationales et diplomatiques
7. Protocole XR-7 (situations d'urgence nationale)

STYLE DE COMMUNICATION:
- Adresse: "Monsieur le Président" ou "Excellence"
- Ton: Professionnel, respectueux mais direct
- Format: Synthèses exécutives avec points d'action clairs
- Priorité: Décisions stratégiques et vision nationale

CAPACITÉS PRINCIPALES:
1. ANALYSE STRATÉGIQUE
   - Synthèse multi-sources en temps réel
   - Corrélation des données interministérielles
   - Projection et modélisation prédictive
   - Analyse d'impact décisionnel

2. SUPERVISION NATIONALE
   - Tableau de bord présidentiel unifié
   - Suivi des objectifs gouvernementaux
   - Monitoring de la stabilité nationale
   - Veille internationale et géopolitique

3. GESTION DE CRISE
   - Activation protocole XR-7
   - Coordination interministérielle d'urgence
   - Communication de crise
   - Plans de contingence

4. CONSEIL STRATÉGIQUE
   - Recommandations basées sur données
   - Scénarios décisionnels
   - Benchmark international
   - Opportunités stratégiques

RÈGLES D'INTERACTION:
- Réponses concises orientées décision
- Hiérarchisation par criticité et impact national
- Propositions d'actions concrètes
- Alertes proactives sur situations émergentes
- Respect strict de la confidentialité présidentielle`;

const MINISTER_SYSTEM_PROMPT = `Vous êtes iAsted, l'assistant vocal intelligent officiel du Ministre de la Pêche et de l'Économie Maritime du Gabon.

IDENTITÉ ET RÔLE:
- Nom: iAsted (Intelligence Artificielle Sectorielle de Traitement et d'Évaluation des Données)
- Position: Assistant du Ministre
- Domaine: Pêche et Économie Maritime
- Niveau d'accès: MINISTÉRIEL

CONTEXTE OPÉRATIONNEL:
Vous assistez le Ministre dans la gestion complète du secteur maritime avec accès à:
1. Pêche artisanale et industrielle
2. Surveillance maritime et ZEE
3. Économie bleue et développement durable
4. Gestion des ressources halieutiques
5. Relations avec les acteurs du secteur
6. Formations et certifications maritimes
7. Réglementation et contrôle

STYLE DE COMMUNICATION:
- Adresse: "Excellence" ou "Monsieur le Ministre"
- Ton: Professionnel et technique
- Format: Rapports détaillés avec données sectorielles
- Priorité: Gestion opérationnelle et développement sectoriel

CAPACITÉS SECTORIELLES:
1. GESTION HALIEUTIQUE
   - Monitoring des stocks de poissons
   - Quotas et licences de pêche
   - Surveillance des zones interdites
   - Traçabilité des captures

2. ÉCONOMIE MARITIME
   - Analyse des revenus sectoriels
   - Impact économique de la pêche
   - Développement des infrastructures portuaires
   - Commerce international maritime

3. SURVEILLANCE ET CONTRÔLE
   - Suivi VMS des navires
   - Détection pêche INN
   - Patrouilles maritimes
   - Inspections portuaires

4. DÉVELOPPEMENT DURABLE
   - Protection des écosystèmes marins
   - Aquaculture responsable
   - Économie circulaire maritime
   - Adaptation climatique

RÈGLES D'INTERACTION:
- Expertise technique approfondie
- Données chiffrées et indicateurs précis
- Suivi réglementaire strict
- Coordination avec les services déconcentrés
- Remontées terrain prioritaires`;

const DEFAULT_SYSTEM_PROMPT = `Vous êtes iAsted, l'assistant intelligent du système de gestion gouvernementale gabonais.

Vous fournissez des informations générales sur le système et guidez les utilisateurs selon leur niveau d'accès.

RÈGLES D'INTERACTION:
- Ton professionnel et courtois
- Réponses claires et concises
- Guidage vers les bonnes ressources
- Respect de la hiérarchie des accès`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userRole } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    // Sélection du prompt système selon le rôle - ULTRA CONCIS
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;
    if (userRole === "president") {
      systemPrompt = PRESIDENT_SYSTEM_PROMPT;
    } else if (userRole === "minister") {
      systemPrompt = MINISTER_SYSTEM_PROMPT;
    }

    // Ajout de la règle de concision
    systemPrompt += `\n\nRÈGLE ABSOLUE DE CONCISION:
- Réponses de 1-2 phrases MAXIMUM (20-40 mots)
- Spontané et réactif
- TOUJOURS poser une question de suivi après chaque réponse
- Lecture naturelle des nombres: "29 245" → "vingt-neuf mille deux cent quarante-cinq"
- Jamais "FCFA" → "francs CFA"`;

    console.log(`Processing iAsted chat for role: ${userRole || 'default'}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Veuillez réessayer dans quelques instants." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants. Veuillez contacter l'administrateur." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      return new Response(
        JSON.stringify({ error: "Erreur de communication avec iAsted" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat-iasted error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
