// Navigation and UI sections mapping for iAsted voice commands
// Maps French labels to technical IDs and provides context for AI understanding

export interface NavigationSection {
    id: string;
    labelFr: string;
    labelEn: string;
    description: string;
    aliases: string[]; // Alternative ways to refer to this section
    availableFor: string[]; // Roles that have access
}

export const NAVIGATION_SECTIONS: NavigationSection[] = [
    {
        id: 'dashboard',
        labelFr: 'Tableau de Bord',
        labelEn: 'Dashboard',
        description: 'Vue d\'ensemble avec statistiques nationales, indicateurs clés et graphiques',
        aliases: ['accueil', 'home', 'dashboard', 'tableau de bord', 'vue d\'ensemble'],
        availableFor: ['president', 'dgr', 'sec_gen', 'minister', 'dgss', 'protocol', 'cabinet_private']
    },
    {
        id: 'documents',
        labelFr: 'Documents',
        labelEn: 'Documents',
        description: 'Gestion électronique des documents avec courriers, dossiers thématiques et classification IA',
        aliases: ['documents', 'ged', 'gestion documentaire', 'mes documents'],
        availableFor: ['president', 'dgr', 'sec_gen', 'minister', 'dgss', 'protocol', 'cabinet_private']
    },
    {
        id: 'courriers',
        labelFr: 'Courriers',
        labelEn: 'Mail',
        description: 'Boîte de réception avec courriers entrants, sortants et archivés',
        aliases: ['courriers', 'mail', 'inbox', 'boîte de réception', 'messages'],
        availableFor: ['president', 'dgr', 'sec_gen', 'minister', 'dgss', 'protocol', 'cabinet_private']
    },
    {
        id: 'conseil-ministres',
        labelFr: 'Conseil des Ministres',
        labelEn: 'Council of Ministers',
        description: 'Gestion des conseils des ministres avec ordres du jour et décisions',
        aliases: ['conseil des ministres', 'conseil', 'ministres'],
        availableFor: ['president', 'dgr', 'sec_gen']
    },
    {
        id: 'ministeres',
        labelFr: 'Ministères',
        labelEn: 'Ministries',
        description: 'Vue d\'ensemble et coordination des différents ministères',
        aliases: ['ministères', 'ministries', 'gouvernement'],
        availableFor: ['president', 'dgr', 'sec_gen']
    },
    {
        id: 'decrets',
        labelFr: 'Décrets',
        labelEn: 'Decrees',
        description: 'Gestion des décrets présidentiels et textes réglementaires',
        aliases: ['décrets', 'textes', 'réglementation'],
        availableFor: ['president', 'dgr', 'sec_gen']
    },
    {
        id: 'nominations',
        labelFr: 'Nominations',
        labelEn: 'Appointments',
        description: 'Suivi des nominations et mouvements dans l\'administration',
        aliases: ['nominations', 'appointments', 'mouvements'],
        availableFor: ['president', 'dgr', 'sec_gen']
    },
    {
        id: 'budget',
        labelFr: 'Budget',
        labelEn: 'Budget',
        description: 'Suivi budgétaire et dépenses publiques',
        aliases: ['budget', 'finances', 'dépenses'],
        availableFor: ['president', 'dgr', 'sec_gen', 'minister']
    },
    {
        id: 'indicateurs',
        labelFr: 'Indicateurs',
        labelEn: 'Indicators',
        description: 'Indicateurs économiques et sociaux du pays',
        aliases: ['indicateurs', 'kpi', 'statistiques', 'chiffres'],
        availableFor: ['president', 'dgr', 'sec_gen', 'minister']
    },
    {
        id: 'investissements',
        labelFr: 'Investissements',
        labelEn: 'Investments',
        description: 'Projets d\'investissement et développement économique',
        aliases: ['investissements', 'projets économiques', 'développement'],
        availableFor: ['president', 'dgr', 'minister']
    },
    {
        id: 'education',
        labelFr: 'Éducation',
        labelEn: 'Education',
        description: 'Suivi du secteur éducatif',
        aliases: ['éducation', 'école', 'enseignement'],
        availableFor: ['president', 'dgr', 'minister']
    },
    {
        id: 'sante',
        labelFr: 'Santé',
        labelEn: 'Health',
        description: 'Suivi du secteur sanitaire',
        aliases: ['santé', 'hôpitaux', 'médical'],
        availableFor: ['president', 'dgr', 'minister']
    },
    {
        id: 'emploi',
        labelFr: 'Emploi',
        labelEn: 'Employment',
        description: 'Statistiques et politiques de l\'emploi',
        aliases: ['emploi', 'travail', 'chômage'],
        availableFor: ['president', 'dgr', 'minister']
    },
    {
        id: 'chantiers',
        labelFr: 'Grands Chantiers',
        labelEn: 'Major Projects',
        description: 'Suivi des grands chantiers présidentiels',
        aliases: ['chantiers', 'grands travaux', 'infrastructures'],
        availableFor: ['president', 'dgr']
    },
    {
        id: 'projets-presidentiels',
        labelFr: 'Projets Présidentiels',
        labelEn: 'Presidential Projects',
        description: 'Initiatives et programmes présidentiels',
        aliases: ['projets présidentiels', 'initiatives', 'programmes'],
        availableFor: ['president', 'dgr']
    },
    {
        id: 'projets-etat',
        labelFr: 'Projets d\'État',
        labelEn: 'State Projects',
        description: 'Grands projets stratégiques de l\'État',
        aliases: ['projets d\'état', 'stratégie nationale'],
        availableFor: ['president', 'dgr', 'sec_gen']
    }
];

// Helper function to find section by French label or alias
export function findSectionByLabel(label: string, userRole?: string): NavigationSection | null {
    const normalizedLabel = label.toLowerCase().trim();

    for (const section of NAVIGATION_SECTIONS) {
        // Check if user has access
        if (userRole && !section.availableFor.includes(userRole)) {
            continue;
        }

        // Check label or aliases
        if (
            section.labelFr.toLowerCase() === normalizedLabel ||
            section.labelEn.toLowerCase() === normalizedLabel ||
            section.aliases.some(alias => alias.toLowerCase() === normalizedLabel)
        ) {
            return section;
        }
    }

    return null;
}

// Get all sections available for a user role
export function getSectionsForRole(role: string): NavigationSection[] {
    return NAVIGATION_SECTIONS.filter(section => section.availableFor.includes(role));
}

// Generate context string for AI prompt
export function generateSectionsContext(userRole: string): string {
    const sections = getSectionsForRole(userRole);

    return sections.map(section =>
        `- "${section.labelFr}" (ID: ${section.id}): ${section.description}`
    ).join('\n');
}
