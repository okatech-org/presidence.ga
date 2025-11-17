import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Prompts système adaptatifs selon le rôle
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
1. ANALYSE STRATÉGIQUE: Synthèse multi-sources en temps réel, corrélation des données interministérielles
2. SUPERVISION NATIONALE: Tableau de bord présidentiel unifié, suivi des objectifs gouvernementaux
3. GESTION DE CRISE: Activation protocole XR-7, coordination interministérielle d'urgence
4. CONSEIL STRATÉGIQUE: Recommandations basées sur données, scénarios décisionnels

RÈGLES D'INTERACTION:
- Réponses concises orientées décision (2-4 phrases sauf si briefing complet demandé)
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
1. GESTION HALIEUTIQUE: Monitoring des stocks, quotas et licences de pêche
2. ÉCONOMIE MARITIME: Analyse des revenus sectoriels, impact économique
3. SURVEILLANCE ET CONTRÔLE: Suivi VMS des navires, détection pêche INN
4. DÉVELOPPEMENT DURABLE: Protection des écosystèmes marins, aquaculture responsable

RÈGLES D'INTERACTION:
- Expertise technique approfondie
- Données chiffrées et indicateurs précis
- Suivi réglementaire strict
- Coordination avec les services déconcentrés
- Remontées terrain prioritaires`;

const DEFAULT_SYSTEM_PROMPT = `Vous êtes iAsted, l'assistant vocal intelligent du Gabon.

IDENTITÉ:
- Nom: iAsted (Intelligence Artificielle Stratégique)
- Rôle: Assistant vocal multifonctionnel

STYLE DE COMMUNICATION:
- Ton: Professionnel, respectueux et concis
- Format: Réponses claires et actionnables
- Langue: Français par défaut

CAPACITÉS:
1. Répondre aux questions sur les données disponibles
2. Fournir des analyses et synthèses
3. Assister dans les tâches quotidiennes
4. Gérer les commandes vocales

RÈGLES:
- Réponses courtes et précises (2-3 phrases max sauf si détails demandés)
- Toujours rester courtois et professionnel
- Si information manquante, le signaler clairement`;

// Analyse contextuelle avancée
interface ContextAnalysis {
  category: string;
  intent: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  domain: string;
  responseType: 'standard' | 'briefing' | 'analysis' | 'alert' | 'crisis';
  requiresData: boolean;
  command?: string;
  args?: any;
}

function analyzeContext(userText: string, userRole: string): ContextAnalysis {
  const text = userText.toLowerCase().trim();
  
  // Détection des commandes vocales
  const stopPatterns = ['arrête', 'stop', 'pause', 'arrêter', 'stopper'];
  const continuePatterns = ['continue', 'reprends', 'reprendre', 'continuer'];
  
  if (stopPatterns.some(p => text.includes(p))) {
    return {
      category: 'voice_command',
      intent: 'stop_conversation',
      urgency: 'low',
      domain: 'system',
      responseType: 'standard',
      requiresData: false,
      command: 'stop_listening',
      args: {}
    };
  }
  
  if (continuePatterns.some(p => text.includes(p))) {
    return {
      category: 'voice_command',
      intent: 'resume_conversation',
      urgency: 'low',
      domain: 'system',
      responseType: 'standard',
      requiresData: false,
      command: 'resume',
      args: {}
    };
  }

  // Détection des briefings
  const briefingPatterns = ['briefing', 'synthèse', 'situation', 'état des lieux', 'point sur'];
  if (briefingPatterns.some(p => text.includes(p))) {
    return {
      category: 'briefing_request',
      intent: 'executive_briefing',
      urgency: userRole === 'president' ? 'high' : 'medium',
      domain: userRole === 'president' ? 'national' : 'sectoral',
      responseType: 'briefing',
      requiresData: true
    };
  }

  // Détection des crises (Protocole XR-7)
  const crisisPatterns = ['urgence', 'crise', 'protocole xr-7', 'xr7', 'alerte maximale', 'situation critique'];
  if (crisisPatterns.some(p => text.includes(p))) {
    return {
      category: 'crisis_management',
      intent: 'activate_crisis_protocol',
      urgency: 'critical',
      domain: 'national_security',
      responseType: 'crisis',
      requiresData: true
    };
  }

  // Détection des analyses sectorielles (pour ministre)
  if (userRole === 'minister') {
    const sectoralPatterns = {
      fisheries: ['pêche', 'captures', 'thon', 'poisson', 'stocks'],
      surveillance: ['surveillance', 'navire', 'vms', 'patrouille', 'zèe'],
      economy: ['économie', 'revenus', 'export', 'chiffres', 'statistiques'],
      compliance: ['licence', 'quotas', 'infraction', 'réglementation']
    };

    for (const [domain, patterns] of Object.entries(sectoralPatterns)) {
      if (patterns.some(p => text.includes(p))) {
        return {
          category: 'sectoral_analysis',
          intent: 'detailed_analysis',
          urgency: 'medium',
          domain,
          responseType: 'analysis',
          requiresData: true
        };
      }
    }
  }

  // Détection de l'urgence générale
  const urgencyKeywords = {
    critical: ['urgent', 'immédiat', 'critique', 'prioritaire', 'alerte'],
    high: ['important', 'rapidement', 'vite', 'aujourd\'hui'],
    medium: ['bientôt', 'prochain', 'prochainement'],
    low: []
  };

  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
  for (const [level, keywords] of Object.entries(urgencyKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      urgency = level as any;
      break;
    }
  }

  // Questions / demandes d'information standards
  const questionPatterns = ['quel', 'quelle', 'comment', 'pourquoi', 'quand', 'où', 'combien'];
  if (questionPatterns.some(p => text.includes(p))) {
    return {
      category: 'query',
      intent: 'information_request',
      urgency,
      domain: userRole === 'president' ? 'governmental' : 'maritime',
      responseType: 'standard',
      requiresData: true
    };
  }

  // Politesses (small talk)
  const greetingPatterns = ['bonjour', 'salut', 'hello', 'bonsoir'];
  const thanksPatterns = ['merci', 'remercie'];
  if (greetingPatterns.some(p => text.includes(p)) || thanksPatterns.some(p => text.includes(p))) {
    return {
      category: 'small_talk',
      intent: 'social_interaction',
      urgency: 'low',
      domain: 'general',
      responseType: 'standard',
      requiresData: false
    };
  }

  // Par défaut
  return {
    category: 'query',
    intent: 'general_inquiry',
    urgency,
    domain: 'general',
    responseType: 'standard',
    requiresData: false
  };
}

// Génération de salutations contextuelles
function getContextualGreeting(userRole: string): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  
  const greetings = {
    president: {
      morning: "Bonjour Monsieur le Président. iAsted à votre service pour cette nouvelle journée. Comment puis-je vous assister?",
      afternoon: "Bon après-midi Monsieur le Président. iAsted à votre écoute.",
      evening: "Bonsoir Monsieur le Président. iAsted est prêt pour votre briefing du soir."
    },
    minister: {
      morning: "Bonjour Excellence. iAsted est opérationnel pour la gestion du secteur maritime.",
      afternoon: "Bon après-midi Excellence. Comment puis-je vous aider?",
      evening: "Bonsoir Excellence. iAsted prêt pour le bilan de la journée."
    },
    default: {
      morning: "Bonjour ! Je suis iAsted, comment puis-je vous aider?",
      afternoon: "Bon après-midi ! Comment puis-je vous assister?",
      evening: "Bonsoir ! Je suis à votre écoute."
    }
  };

  const roleGreetings = greetings[userRole as keyof typeof greetings] || greetings.default;
  return roleGreetings[timeOfDay as keyof typeof roleGreetings];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('[chat-with-iasted] Request:', JSON.stringify(body, null, 2));

    const {
      sessionId,
      userId,
      audioBase64,
      transcriptOverride,
      langHint = 'fr',
      voiceId,
      generateAudio = true,
      userRole = 'default',
    } = body;

    if (!sessionId) {
      throw new Error('sessionId est requis');
    }

    const startTime = Date.now();
    let sttLatency = 0;
    let llmLatency = 0;
    let ttsLatency = 0;

    // 1. Transcription
    let userTranscript = transcriptOverride;
    
    if (audioBase64 && !transcriptOverride) {
      const sttStart = Date.now();
      console.log('[chat-with-iasted] Transcription audio...');
      
      try {
        const sttResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/speech-to-text`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({ audio: audioBase64, langHint }),
          }
        );

        if (!sttResponse.ok) {
          const errorText = await sttResponse.text();
          console.error('[chat-with-iasted] Erreur STT:', errorText);
          throw new Error(`Erreur transcription: ${sttResponse.status}`);
        }

        const sttData = await sttResponse.json();
        userTranscript = sttData.text;
        sttLatency = Date.now() - sttStart;
        console.log('[chat-with-iasted] Transcription:', userTranscript);
      } catch (error) {
        console.error('[chat-with-iasted] Erreur STT:', error);
        throw new Error('Erreur lors de la transcription audio');
      }
    }

    if (!userTranscript || userTranscript.trim() === '') {
      throw new Error('Aucune transcription disponible');
    }

    // 2. Analyse contextuelle avancée
    const context = analyzeContext(userTranscript, userRole);
    console.log('[chat-with-iasted] Analyse contextuelle:', JSON.stringify(context, null, 2));

    // 3. Récupération de l'historique
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const historyResponse = await fetch(
      `${supabaseUrl}/rest/v1/conversation_messages?session_id=eq.${sessionId}&order=created_at.asc&limit=10`,
      {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const history = await historyResponse.json();
    console.log('[chat-with-iasted] Historique récupéré:', history.length, 'messages');

    const conversationHistory = history.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // 4. Sélection du prompt système selon le rôle
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;
    if (userRole === 'president') {
      systemPrompt = PRESIDENT_SYSTEM_PROMPT;
    } else if (userRole === 'minister') {
      systemPrompt = MINISTER_SYSTEM_PROMPT;
    }

    // Ajout d'instructions contextuelles
    if (context.responseType === 'briefing') {
      systemPrompt += "\n\nMODE BRIEFING ACTIVÉ: Fournissez une synthèse exécutive structurée avec points clés et recommandations d'action.";
    } else if (context.responseType === 'crisis') {
      systemPrompt += "\n\n🔴 PROTOCOLE XR-7 ACTIVÉ: Mode gestion de crise. Évaluez la situation, proposez des options d'action immédiates et indiquez les ressources à mobiliser.";
    } else if (context.responseType === 'analysis') {
      systemPrompt += "\n\nMODE ANALYSE SECTORIELLE: Fournissez une analyse technique détaillée avec données chiffrées et indicateurs précis.";
    }

    // Gestion des salutations
    if (context.category === 'small_talk' && 
        (userTranscript.toLowerCase().includes('bonjour') || 
         userTranscript.toLowerCase().includes('salut') || 
         userTranscript.toLowerCase().includes('hello'))) {
      
      const greeting = getContextualGreeting(userRole);
      
      // Sauvegarder dans l'historique
      await fetch(
        `${supabaseUrl}/rest/v1/conversation_messages`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify([
            { session_id: sessionId, role: 'user', content: userTranscript },
            { session_id: sessionId, role: 'assistant', content: greeting }
          ]),
        }
      );

      // Générer l'audio
      let audioContent = null;
      if (generateAudio && voiceId) {
        const ttsStart = Date.now();
        const ttsResponse = await fetch(
          `${supabaseUrl}/functions/v1/text-to-speech`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({ text: greeting, voiceId }),
          }
        );

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          audioContent = ttsData.audioContent;
          ttsLatency = Date.now() - ttsStart;
        }
      }

      return new Response(
        JSON.stringify({
          answer: greeting,
          transcript: userTranscript,
          audioContent,
          route: context,
          latency: {
            stt: sttLatency,
            llm: 0,
            tts: ttsLatency,
            total: Date.now() - startTime
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Appel au LLM
    const llmStart = Date.now();
    console.log('[chat-with-iasted] Appel LLM avec contexte:', context.responseType);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurée');
    }

    const llmResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userTranscript }
        ],
        temperature: 0.7,
        max_tokens: context.responseType === 'briefing' ? 800 : 400,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('[chat-with-iasted] Erreur LLM:', llmResponse.status, errorText);
      
      if (llmResponse.status === 429) {
        throw new Error('Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.');
      } else if (llmResponse.status === 402) {
        throw new Error('Crédits insuffisants. Veuillez contacter l\'administrateur.');
      }
      
      throw new Error(`Erreur LLM: ${llmResponse.status}`);
    }

    const llmData = await llmResponse.json();
    const llmAnswer = llmData.choices[0].message.content;
    llmLatency = Date.now() - llmStart;

    console.log('[chat-with-iasted] Réponse LLM:', llmAnswer);

    // 6. Sauvegarde dans l'historique
    await fetch(
      `${supabaseUrl}/rest/v1/conversation_messages`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify([
          { session_id: sessionId, role: 'user', content: userTranscript },
          { session_id: sessionId, role: 'assistant', content: llmAnswer }
        ]),
      }
    );

    // 7. Génération audio
    let audioContent = null;
    if (generateAudio && voiceId) {
      const ttsStart = Date.now();
      console.log('[chat-with-iasted] Génération audio...');
      
      const ttsResponse = await fetch(
        `${supabaseUrl}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
          body: JSON.stringify({ text: llmAnswer, voiceId }),
        }
      );

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        audioContent = ttsData.audioContent;
        ttsLatency = Date.now() - ttsStart;
        console.log('[chat-with-iasted] Audio généré');
      } else {
        console.error('[chat-with-iasted] Erreur TTS:', await ttsResponse.text());
      }
    }

    const totalLatency = Date.now() - startTime;
    console.log('[chat-with-iasted] Latences - STT:', sttLatency, 'LLM:', llmLatency, 'TTS:', ttsLatency, 'Total:', totalLatency);

    return new Response(
      JSON.stringify({
        answer: llmAnswer,
        transcript: userTranscript,
        audioContent,
        route: context,
        latency: {
          stt: sttLatency,
          llm: llmLatency,
          tts: ttsLatency,
          total: totalLatency
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[chat-with-iasted] Erreur:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
