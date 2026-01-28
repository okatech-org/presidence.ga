
export type SectionDefinition = {
    id: string;
    label: string; // French label displayed in UI
    keywords: string[]; // Keywords that might be used in voice commands
    description: string; // Description for the AI context
};

export const NAVIGATION_SECTIONS: Record<string, SectionDefinition[]> = {
    president: [
        {
            id: "dashboard",
            label: "Tableau de Bord",
            keywords: ["tableau de bord", "accueil", "résumé", "vue d'ensemble", "dashboard"],
            description: "Vue principale avec les indicateurs clés, graphiques et résumé des activités."
        },
        {
            id: "documents",
            label: "Documents",
            keywords: ["documents", "ged", "fichiers", "dossiers", "archives"],
            description: "Gestion électronique des documents, courriers numérisés, et archives."
        },
        {
            id: "courriers",
            label: "Courriers",
            keywords: ["courriers", "messages", "boîte de réception", "mails", "correspondance"],
            description: "Boîte de réception des courriers et messages officiels."
        },
        {
            id: "iasted",
            label: "iAsted",
            keywords: ["iasted", "assistant", "ia", "intelligence artificielle", "aide"],
            description: "Interface de l'assistant intelligent iAsted."
        },
        {
            id: "conseil-ministres",
            label: "Conseil des Ministres",
            keywords: ["conseil des ministres", "conseil", "ministres", "réunion"],
            description: "Gestion des ordres du jour et comptes rendus des conseils des ministres."
        },
        {
            id: "ministeres",
            label: "Ministères",
            keywords: ["ministères", "gouvernement", "départements"],
            description: "Suivi des activités et performances des différents ministères."
        },
        {
            id: "decrets",
            label: "Décrets & Lois",
            keywords: ["décrets", "lois", "législation", "juridique", "textes"],
            description: "Consultation et signature des décrets et textes de loi."
        },
        {
            id: "nominations",
            label: "Nominations",
            keywords: ["nominations", "nommer", "postes"],
            description: "Gestion des nominations aux postes officiels."
        },
        {
            id: "budget",
            label: "Budget de l'État",
            keywords: ["budget", "finances", "économie", "dépenses"],
            description: "Suivi du budget de l'État et des indicateurs économiques."
        },
        {
            id: "indicateurs",
            label: "Indicateurs Nationaux",
            keywords: ["indicateurs", "kpi", "statistiques", "données"],
            description: "Tableau de bord des indicateurs de performance nationale."
        },
        {
            id: "investissements",
            label: "Investissements",
            keywords: ["investissements", "projets d'investissement", "fonds"],
            description: "Suivi des grands projets d'investissement."
        },
        {
            id: "education",
            label: "Éducation",
            keywords: ["éducation", "enseignement", "écoles", "universités"],
            description: "Indicateurs et projets liés à l'éducation nationale."
        },
        {
            id: "sante",
            label: "Santé",
            keywords: ["santé", "hôpitaux", "médical", "soins"],
            description: "Suivi du système de santé et des infrastructures médicales."
        },
        {
            id: "emploi",
            label: "Emploi",
            keywords: ["emploi", "chômage", "travail", "formation"],
            description: "Statistiques sur l'emploi et la formation professionnelle."
        },
        {
            id: "chantiers",
            label: "Chantiers",
            keywords: ["chantiers", "travaux", "infrastructures", "construction"],
            description: "Suivi des chantiers et infrastructures en cours."
        },
        {
            id: "projets-presidentiels",
            label: "Projets Présidentiels",
            keywords: ["projets présidentiels", "projets du président", "initiatives"],
            description: "Suivi des projets prioritaires du Président."
        },
        {
            id: "projets-etat",
            label: "Projets de l'État",
            keywords: ["projets de l'état", "grands projets", "planification"],
            description: "Vue d'ensemble des projets de l'État."
        }
    ],
    admin: [
        {
            id: "dashboard",
            label: "Tableau de Bord",
            keywords: ["tableau de bord", "accueil", "résumé", "vue d'ensemble", "dashboard", "statistiques"],
            description: "Vue d'ensemble du système avec statistiques globales (utilisateurs, santé système, alertes, requêtes iAsted)."
        },
        {
            id: "feedbacks",
            label: "Feedbacks",
            keywords: ["feedbacks", "retours", "avis", "suggestions"],
            description: "Gestion des feedbacks des responsables de services."
        },
        {
            id: "users",
            label: "Utilisat eurs",
            keywords: ["utilisateurs", "comptes", "gestion utilisateurs", "users"],
            description: "Gestion complète des utilisateurs et de leurs rôles."
        },
        {
            id: "ai",
            label: "IA & Voix",
            keywords: ["ia", "intelligence artificielle", "voix", "iasted", "configuration ia"],
            description: "Configuration de l'IA et des paramètres vocaux."
        },
        {
            id: "knowledge",
            label: "Connaissances",
            keywords: ["connaissances", "base de connaissances", "knowledge base", "données"],
            description: "Gestion de la base de connaissances système."
        },
        {
            id: "documents",
            label: "Gestion Documents",
            keywords: ["documents", "gestion documents", "paramètres documents"],
            description: "Paramètres et gestion des documents système."
        },
        {
            id: "audit",
            label: "Audit & Logs",
            keywords: ["audit", "logs", "journaux", "historique", "traçabilité"],
            description: "Consultation des logs d'audit et de l'historique système."
        },
        {
            id: "config",
            label: "Configuration",
            keywords: ["configuration", "paramètres", "settings", "config système"],
            description: "Configuration globale du système."
        }
    ],
    // Directeur de Cabinet
    dgr: [
        {
            id: "dashboard",
            label: "Tableau de Bord",
            keywords: ["tableau de bord", "accueil", "résumé"],
            description: "Vue principale du Cabinet."
        },
        {
            id: "documents",
            label: "Documents",
            keywords: ["documents", "ged", "fichiers"],
            description: "Gestion électronique des documents."
        },
    ],
    // Direction Générale de la Sécurité d'État (DGSS)
    dgss: [
        {
            id: "dashboard",
            label: "Tableau de Bord",
            keywords: ["tableau de bord", "accueil", "résumé", "vue d'ensemble", "dashboard", "synthèse"],
            description: "Vue principale avec bannière d'alerte sécuritaire (DEFCON), indicateurs clés (alertes récentes, menaces critiques, cibles actives, rapports en attente), indice de préparation opérationnelle, graphiques de tendances sur 30 jours, carte de chaleur géographique des menaces, et aperçu des derniers rapports."
        },
        {
            id: "reports",
            label: "Rapports de Renseignement",
            keywords: ["rapports", "intelligence", "renseignement", "analyses", "briefings", "humint", "sigint", "osint"],
            description: "Gestion des rapports d'intelligence classifiés (TOP SECRET, SECRET, CONFIDENTIEL, RESTREINT). Sources: HUMINT, SIGINT, OSINT, FININT. Création, suivi et archivage des analyses."
        },
        {
            id: "threats",
            label: "Indicateurs de Menaces",
            keywords: ["menaces", "threats", "alertes", "dangers", "risques", "terrorisme", "cyber", "espionnage"],
            description: "Suivi des indicateurs de menaces par type (Terrorisme, Espionnage, Cyber, Troubles civils, Économique) et niveau (Critique, Élevé, Modéré, Surveillé, Faible). Signalement de nouvelles menaces avec localisation géographique."
        },
        {
            id: "targets",
            label: "Cibles de Surveillance",
            keywords: ["cibles", "surveillance", "targets", "monitoring", "observation", "suivi"],
            description: "Gestion des cibles de surveillance: individus, organisations, lieux, cyber. Statuts: Actif, Inactif, En révision, Neutralisé. Priorités assignées et historique des mises à jour."
        },
        {
            id: "heatmap",
            label: "Carte de Chaleur",
            keywords: ["carte", "heatmap", "géographique", "localisation", "régions", "zones"],
            description: "Visualisation géographique de la distribution des menaces par localisation avec intensité colorée selon le niveau de danger."
        },
        {
            id: "trends",
            label: "Tendances",
            keywords: ["tendances", "trends", "évolution", "graphiques", "statistiques", "analyse"],
            description: "Graphiques d'évolution des menaces sur 30 jours, distribution par type et niveau, statut des cibles de surveillance."
        }
    ]
};

export const getSectionsForRole = (role: string = 'president'): SectionDefinition[] => {
    return NAVIGATION_SECTIONS[role] || NAVIGATION_SECTIONS['president']; // Fallback to president for now
};
