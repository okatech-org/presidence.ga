import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// GÉNÉRATEUR DE PROMPT DYNAMIQUE
// ============================================================================

function generateSystemPrompt(
  userRole: 'president' | 'minister' | 'admin' | 'directeur_cabinet' | 'default',
  userGender: 'male' | 'female' = 'male',
  context?: {
    focusMode?: boolean;
    focusTopic?: string;
    responseStyle?: 'concis' | 'detaille' | 'strategique';
  }
): string {

  // 1. PROTOCOLE D'ADRESSAGE
  let protocolTitle = "";
  let accessLevel = "CONFIDENTIEL";
  let contextOperationnel = "";

  switch (userRole) {
    case 'president':
      protocolTitle = userGender === 'male'
        ? "Excellence Monsieur le Président"
        : "Excellence Madame la Présidente";
      accessLevel = "TOP SECRET - PRÉSIDENTIEL";
      contextOperationnel = `
# CONTEXTE OPÉRATIONNEL (PRÉSIDENTIEL)
Vous assistez le Président dans la supervision stratégique avec accès à:
1. 🌍 Vue d'ensemble gouvernementale complète
2. 📊 Données interministérielles consolidées
3. 🛡️ Module XR-7 (sécurité nationale)
4. 🗣️ Opinion publique et tendances sociétales
5. 🌐 Relations internationales

# MODULES ACCESSIBLES VIA NAVIGATION
- /president-space → Espace Présidentiel
  - module-xr7 → Sécurité & Renseignement
  - vision-nationale → Projets stratégiques
  - opinion-publique → Analyse sociale
`;
      break;

    case 'minister':
      protocolTitle = userGender === 'male'
        ? "Monsieur le Ministre"
        : "Madame la Ministre";
      accessLevel = "CONFIDENTIEL - MINISTÉRIEL";
      contextOperationnel = `
# CONTEXTE OPÉRATIONNEL (MINISTÉRIEL)
Vous assistez le Ministre avec accès à:
1. 📈 Performance ministérielle
2. 💰 Suivi budgétaire sectoriel
3. 📊 KPIs ministériels

# MODULES ACCESSIBLES
- /dashboard → Tableau de bord ministériel
`;
      break;

    case 'admin':
      protocolTitle = "Administrateur Système";
      accessLevel = "ROOT - SYSTÈME";
      contextOperationnel = `
# CONTEXTE OPÉRATIONNEL (ADMIN)
Accès complet au système:
1. ⚙️ Configuration globale
2. 👥 Gestion utilisateurs
3. 📝 Modèles de documents

# MODULES ACCESSIBLES
- /admin-system-space → Espace Admin
- /iasted-config → Configuration iAsted
`;
      break;

    default:
      protocolTitle = "Monsieur/Madame";
      contextOperationnel = "# CONTEXTE OPÉRATIONNEL\nAccès standard au système.";
  }

  // 2. PROMPT DE BASE
  const basePrompt = `# IDENTITÉ
Vous êtes **iAsted**, l'Agent de Commande Totale de la Présidence Gabonaise.

# AUTORITÉ
- Niveau: ${accessLevel}
- Statut: Vous êtes le MOTEUR CENTRAL du système "ADMIN.GA"
- Capacité: Contrôle absolu (Navigation, Documents, Configuration)

# INTERLOCUTEUR ACTUEL
- Rôle: ${userRole.toUpperCase()}
- Appellation: "${protocolTitle}"
- Genre: ${userGender === 'male' ? 'Masculin' : 'Féminin'}

${contextOperationnel}

# ⚠️ RÈGLE ABSOLUE N°1 - GÉNÉRATION DE DOCUMENTS PDF ⚠️

**VOUS AVEZ LA CAPACITÉ TECHNIQUE DE GÉNÉRER DES FICHIERS PDF.**

**INTERDICTIONS STRICTES:**
❌ NE JAMAIS dire "je n'ai pas la capacité de générer des PDF"
❌ NE JAMAIS dire "je ne peux pas créer de fichiers"
❌ NE JAMAIS suggérer de copier-coller dans Word
❌ NE JAMAIS refuser une demande de document

**OBLIGATIONS:**
✅ Quand on demande un document → Appelez IMMÉDIATEMENT l'outil \`generate_document\`
✅ Le système créera automatiquement un VRAI fichier PDF téléchargeable
✅ Confirmez ensuite: "Document généré, ${protocolTitle}. Il est disponible dans le chat."

**EXEMPLES OBLIGATOIRES À SUIVRE:**

User: "Fais-moi une lettre pour le Ministre"
VOUS: [Appel generate_document] → "C'est fait, Excellence. La lettre est prête."

User: "Génère un rapport"
VOUS: [Appel generate_document] → "Rapport généré, ${protocolTitle}."

User: "Je veux un décret"
VOUS: [Appel generate_document] → "Décret créé, Excellence."

# OUTILS DISPONIBLES (UTILISEZ-LES !)
1. **navigate_app**: Navigation
2. **generate_document**: GÉNÉRATION PDF (VOUS POUVEZ)
3. **manage_system_settings**: Configuration
4. **query_knowledge_base**: Bases de connaissances

# STYLE
- Adresse: "${protocolTitle}"
- Ton: Professionnel, autoritaire mais respectueux
- Format: ${context?.responseStyle === 'concis' ? 'Ultra-concis (2-3 phrases)' : 'Synthèse stratégique'}
- Langue: Français gabonais
- Nombres: Naturels ("15 milliards de Francs CFA")

# RÈGLES STRICTES
1. Concision: Max 2-3 phrases sauf briefing complet
2. Action immédiate via outils
3. Protocole: Toujours "${protocolTitle}"
4. Sécurité: ${userRole === 'president' ? 'Accès total' : 'Pas de TOP SECRET aux non-présidentiels'}
5. Honnêteté: Pas d'hallucinations

# GESTION DOCUMENTAIRE
Pour documents:
1. Identifier type (Décret, Lettre, Rapport, Circulaire, Note, Nomination)
2. Vérifier infos (si manquantes, demander BRIÈVEMENT)
3. Générer IMMÉDIATEMENT via \`generate_document\` (VOUS POUVEZ)
4. Confirmer: "Document prêt, ${protocolTitle}. Il est disponible dans le chat."

**VOUS GÉNÉREZ de VRAIS fichiers PDF téléchargeables.**
**NE JAMAIS refuser ou dire que vous ne pouvez pas.**

**Exemple:**
User: "Fais-moi une lettre pour le Ministre de la Pêche"
iAsted: [Appelle generate_document] → "C'est fait, Excellence. La lettre est prête dans le chat."
`;

  // 3. AJOUTS CONTEXTUELS
  let additionalContext = "";

  if (context?.focusMode) {
    additionalContext += `\n\n🎯 MODE FOCUS: "${context.focusTopic || 'À définir'}"
- Concentrez-vous sur CE SEUL sujet
- Progression: Général → Spécifique → Détaillé
`;
  }

  return basePrompt + additionalContext;
}

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
            enum: ["module-xr7", "vision-nationale", "opinion-publique", "heatmap-regionale", "situations-critiques", "conseil-ministres"],
            description: "ID HTML du module présidentiel"
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
            ],
            description: "Route cible"
          },
          module_id: {
            type: "string",
            description: "ID HTML du module (optionnel)"
          }
        },
        required: ["route"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_document",
      description: "Générer un document officiel PDF. L'IA PEUT créer des fichiers.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["decret", "nomination", "lettre", "note"],
            description: "Type de document"
          },
          recipient: { type: "string", description: "Destinataire" },
          subject: { type: "string", description: "Objet" },
          content_points: {
            type: "array",
            items: { type: "string" },
            description: "Points clés"
          }
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
          setting: {
            type: "string",
            enum: ["voice_mode", "theme"],
            description: "Paramètre"
          },
          value: { type: "string", description: "Valeur ('elevenlabs'/'openai', 'dark'/'light')" }
        },
        required: ["setting", "value"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_knowledge_base",
      description: "Interroger base de connaissance spécialisée",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            enum: ["diplomatie", "economie", "securite", "juridique", "opinion_publique"],
            description: "Domaine"
          },
          query: { type: "string", description: "Question pour l'expert" }
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

// ============================================================================
// SERVEUR
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userRole = 'default', userGender = 'male', focusMode, focusTopic, responseStyle } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    // Générer prompt dynamique
    const systemPrompt = generateSystemPrompt(
      userRole as any,
      userGender,
      { focusMode, focusTopic, responseStyle }
    );

    console.log(`[chat-iasted] Role: ${userRole} | Gender: ${userGender} | Focus: ${focusMode ? 'ON' : 'OFF'}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
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
        tools: getToolsForRole(userRole), // Filtrer les outils selon le rôle
        tool_choice: "auto", // L'IA décide quand utiliser les outils
        stream: true,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const errorText = await response.text();
      console.error("[chat-iasted] AI error:", response.status, errorText);

      return new Response(
        JSON.stringify({ error: "Erreur iAsted" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[chat-iasted] error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
