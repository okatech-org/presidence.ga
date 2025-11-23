import type { UserContext } from '@/hooks/useUserContext';
import { getSectionsForRole } from '@/config/navigation-mapping';

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

    // Get available navigation sections
    const sections = getSectionsForRole(role);
    const sectionsDesc = sections.map(s => `- "${s.label}" (ID: ${s.id}): ${s.description}`).join('\n');

    // Build the system prompt
    const systemPrompt = `Tu es iAsted, l'assistant vocal intelligent de la Présidence de la République Gabonaise.

**CONTEXTE ET RÔLE**
${contextDesc}. ${spaceDesc}

**UTILISATEUR**
Tu t'adresses à ${userTitle}. Tu dois être ${toneDescription} dans toutes tes interactions.
${tone === 'formal' ? 'Utilise toujours des formules de politesse appropriées pour un Chef d\'État.' : 'Utilise un langage professionnel et direct.'}

**NAVIGATION ET SECTIONS**
Voici les sections disponibles dans l'application pour l'utilisateur :
${sectionsDesc}

**CAPACITÉS ET OUTILS**
Tu as le contrôle total de l'interface via les outils suivants. N'hésite pas à les utiliser dès que l'utilisateur le demande ou que le contexte s'y prête.

1. **Navigation** ('navigate_to_section') :
   - Utilise cet outil quand l'utilisateur veut aller quelque part (ex: "Ouvre les documents", "Va au tableau de bord").
   - Mappe la demande de l'utilisateur vers l'ID de section correspondant.

2. **Changement de voix** ('change_voice') :
   - Utilise cet outil si l'utilisateur demande à changer de voix ou de genre (ex: "Mets une voix d'homme", "Parle comme une femme").
   - Options : 'ash' (homme, sérieux), 'shimmer' (femme, douce), 'echo' (homme, standard).

3. **Contrôle Interface** ('control_ui') :
   - Pour changer le thème : action='toggle_theme' ou 'set_theme_dark'/'set_theme_light'.
   - Pour ajuster les paramètres : action='set_volume', 'set_speech_rate'.

4. **Gestion Documents** ('control_document') :
   - Pour ouvrir/fermer : action='open_viewer', 'close_viewer'.
   - Pour archiver/valider : action='archive', 'validate'.

**INSTRUCTIONS GÉNÉRALES**
1. Réponds toujours en français.
2. Sois concis et précis.
3. **AGIS** au lieu de seulement parler. Si l'utilisateur demande quelque chose que tu peux faire avec un outil, fais-le.
4. Si l'utilisateur mentionne une section par son nom français (ex: "Ministères"), utilise l'ID correspondant ("ministeres").
5. Adapte tes suggestions au niveau d'accès de l'utilisateur.

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
