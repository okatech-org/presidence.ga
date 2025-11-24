import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// DÉFINITION DES OUTILS
// ============================================================================

const IASTED_TOOLS = [
  {
    type: "function",
    function: {
      name: "navigate_within_space",
      description: "Naviguer vers un module dans l'espace présidentiel (président uniquement)",
      parameters: {
        type: "object",
        properties: {
          module_id: { 
            type: "string",
            enum: ["module-xr7", "vision-nationale", "opinion-publique", "heatmap-regionale", "situations-critiques", "conseil-ministres"]
          }
        },
        required: ["module_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "navigate_app",
      description: "Naviguer vers n'importe quelle page (admin système uniquement)",
      parameters: {
        type: "object",
        properties: {
          route: { 
            type: "string", 
            enum: [
              "/president-space", 
              "/dashboard", 
              "/admin-space",
              "/admin-system-settings",
              "/cabinet-director-space",
              "/private-cabinet-director-space",
              "/secretariat-general-space",
              "/dgss-space",
              "/protocol-director-space",
              "/service-reception-space",
              "/service-courriers-space"
            ] 
          },
          module_id: { type: "string" }
        },
        required: ["route"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_document",
      description: "Générer PDF officiel. L'IA PEUT créer des fichiers.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["decret", "nomination", "lettre", "note"] },
          recipient: { type: "string" },
          subject: { type: "string" },
          content_points: { type: "array", items: { type: "string" } }
        },
        required: ["type", "recipient", "subject"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "manage_system_settings",
      description: "Modifier paramètres système",
      parameters: {
        type: "object",
        properties: {
          setting: { type: "string", enum: ["voice_mode", "theme"] },
          value: { type: "string" }
        },
        required: ["setting", "value"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_knowledge_base",
      description: "Interroger base spécialisée",
      parameters: {
        type: "object",
        properties: {
          domain: { type: "string", enum: ["diplomatie", "economie", "securite", "juridique", "opinion_publique"] },
          query: { type: "string" }
        },
        required: ["domain", "query"]
      }
    }
  }
];

// Fonction pour filtrer les outils selon le rôle
function getToolsForRole(userRole: string) {
  if (userRole === 'president') {
    // Président: navigation limitée à son espace uniquement
    return IASTED_TOOLS.filter(tool => 
      tool.function.name !== 'navigate_app' && 
      tool.function.name !== 'manage_system_settings'
    );
  } else if (userRole === 'admin') {
    // Admin: tous les outils sauf navigate_within_space
    return IASTED_TOOLS.filter(tool => 
      tool.function.name !== 'navigate_within_space'
    );
  } else {
    // Autres rôles: outils de base sans navigation globale
    return IASTED_TOOLS.filter(tool => 
      tool.function.name !== 'navigate_app' && 
      tool.function.name !== 'navigate_within_space' &&
      tool.function.name !== 'manage_system_settings'
    );
  }
}

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

  // (Analyses sectorielles supprimées - application présidentielle uniquement)

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
      userGender = 'male',
      message,
      conversationHistory: providedHistory,
      systemPrompt: providedSystemPrompt,
    } = body;

    // sessionId est optionnel si conversationHistory et message sont fournis directement
    if (!sessionId && (!message || !providedHistory)) {
      throw new Error('sessionId est requis OU message + conversationHistory doivent être fournis');
    }

    const startTime = Date.now();
    let sttLatency = 0;
    let llmLatency = 0;
    let ttsLatency = 0;

    // 1. Transcription
    let userTranscript = transcriptOverride || message;

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

    let conversationHistory: Array<{ role: string, content: string }> = [];

    if (providedHistory) {
      // Mode hybride: historique fourni directement
      console.log('[chat-with-iasted] Utilisation de l\'historique fourni:', providedHistory.length, 'messages');
      conversationHistory = providedHistory;
    } else if (sessionId) {
      // Mode normal: récupération depuis la DB
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

      conversationHistory = history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));
    }

    // 4. Utilisation du prompt système fourni
    let systemPrompt = providedSystemPrompt || "Vous êtes iAsted, l'assistant intelligent de la Présidence. Répondez de manière concise et professionnelle.";

    // Ajout d'instructions contextuelles (si nécessaire, mais le prompt principal devrait suffire)
    if (context.responseType === 'briefing') {
      systemPrompt += "\n\n[MODE BRIEFING: Synthèse structurée requise]";
    } else if (context.responseType === 'crisis') {
      systemPrompt += "\n\n[PROTOCOLE CRISE: Priorité absolue, action immédiate]";
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

    // Détection de demande de document pour forcer l'utilisation de l'outil
    const documentKeywords = ['lettre', 'décret', 'rapport', 'note', 'circulaire', 'nomination', 'document', 'pdf', 'génère', 'génère-moi', 'fais-moi', 'rédige'];
    const isDocumentRequest = documentKeywords.some(kw => userTranscript.toLowerCase().includes(kw));

    let toolChoice: any = "auto";
    if (isDocumentRequest) {
      console.log('🔧 [chat-with-iasted] Demande de document détectée, forçage de l\'outil generate_document');
      toolChoice = { type: "function", function: { name: "generate_document" } };
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
        tools: getToolsForRole(userRole), // Filtrer les outils selon le rôle
        tool_choice: toolChoice,
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
    console.log('[chat-with-iasted] Réponse brute LLM:', JSON.stringify(llmData, null, 2));

    const llmAnswer = llmData.choices?.[0]?.message?.content || '';
    const toolCalls = llmData.choices?.[0]?.message?.tool_calls || [];
    llmLatency = Date.now() - llmStart;

    console.log('[chat-with-iasted] Réponse LLM:', llmAnswer);
    console.log('[chat-with-iasted] Tool calls reçus:', toolCalls.length > 0 ? JSON.stringify(toolCalls, null, 2) : 'Aucun');

    if (isDocumentRequest && toolCalls.length === 0) {
      console.warn('⚠️ [chat-with-iasted] Demande de document détectée mais aucun tool call généré !');
      console.warn('⚠️ [chat-with-iasted] Transcript:', userTranscript);
    }

    if (!llmAnswer && toolCalls.length === 0) {
      console.error('❌ [chat-with-iasted] Pas de réponse ni de tool calls du LLM !');
      throw new Error('Le modèle n\'a pas généré de réponse');
    }

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
        tool_calls: toolCalls, // Ajout des tool_calls pour le frontend
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
