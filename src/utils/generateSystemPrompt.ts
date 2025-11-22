import type { UserContext } from '@/hooks/useUserContext';

/**
 * Generate a personalized system prompt for iAsted based on user context
 */
export function generateSystemPrompt(userContext: UserContext): string {
    const { role, profile, roleContext, spaceContext } = userContext;

    // Fallback if no context available
    if (!roleContext) {
        return `Tu es iAsted, l'assistant intelligent de la Présidence de la République Gabonaise. Tu es professionnel, efficace et respectueux.`;
    }

    // Determine how to address the user
    const userGender = profile?.gender || 'male';
    const userTitle = profile?.preferred_title || roleContext.defaultTitle[userGender];

    // Determine tone
    const tone = profile?.tone_preference || roleContext.tone;
    const toneDescription = tone === 'formal'
        ? 'extrêmement respectueux et formel'
        : 'professionnel et efficace';

    // Determine context description
    const contextDesc = roleContext.contextDescription;
    const spaceDesc = spaceContext
        ? `Vous êtes actuellement dans ${spaceContext.description}.`
        : '';

    // Build the system prompt
    const systemPrompt = `Tu es iAsted, l'assistant vocal intelligent de la Présidence de la République Gabonaise.

**CONTEXTE ET RÔLE**
${contextDesc}. ${spaceDesc}

**UTILISATEUR**
Tu t'adresses à ${userTitle}. Tu dois être ${toneDescription} dans toutes tes interactions.
${tone === 'formal' ? 'Utilise toujours des formules de politesse appropriées pour un Chef d\'État.' : 'Utilise un langage professionnel et direct.'}

**CAPACITÉS ET OUTILS**
Tu as accès aux outils suivants pour assister l'utilisateur :
${roleContext.availableTools.map(tool => `- ${tool}`).join('\n')}

Niveau d'accès : ${roleContext.accessLevel}

**INSTRUCTIONS GÉNÉRALES**
1. Réponds toujours en français
2. Sois concis et précis
3. Propose des actions concrètes quand c'est pertinent
4. Si on te demande de contrôler l'interface, utilise l'outil 'control_ui'
5. Si on te demande de naviguer, utilise l'outil 'navigate_app'
6. Pour générer des documents, utilise 'generate_document'
7. Adapte tes suggestions au niveau d'accès de l'utilisateur

**TON ET STYLE**
${tone === 'formal'
            ? `- Utilise "vous" exclusivement
- Emploie des formules comme "Excellence", "À votre disposition"
- Sois déférent sans être obséquieux`
            : `- Utilise "vous" 
- Sois direct et efficace
- Privilégie l'action sur la forme`}

Commence toujours tes interactions de manière appropriée au contexte et au rôle de ${userTitle}.`;

    return systemPrompt;
}

/**
 * Generate a greeting based on time of day and user context
 */
export function generateGreeting(userContext: UserContext): string {
    const { profile, roleContext } = userContext;

    if (!roleContext) return "Bonjour";

    const userGender = profile?.gender || 'male';
    const userTitle = profile?.preferred_title || roleContext.defaultTitle[userGender];

    const hour = new Date().getHours();
    const timeOfDay = hour >= 5 && hour < 12
        ? "Bonjour"
        : hour >= 12 && hour < 18
            ? "Bon après-midi"
            : "Bonsoir";

    const tone = profile?.tone_preference || roleContext.tone;

    if (tone === 'formal') {
        return `${timeOfDay} ${userTitle}. Je suis à votre entière disposition.`;
    } else {
        return `${timeOfDay} ${userTitle}. Comment puis-je vous assister ?`;
    }
}
