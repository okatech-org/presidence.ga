/**
 * Role Context Configuration
 * Defines metadata and permissions for each role that has access to iAsted
 */

import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

// Roles authorized to access iAsted
export const IASTED_AUTHORIZED_ROLES: AppRole[] = [
    'president',
    'dgr',              // Directeur de Cabinet
    'cabinet_private',  // Directeur de Cabinet Privé
    'sec_gen',          // Secrétariat Général
    'dgss',             // Renseignement
    'protocol',         // Directeur de Protocole
    'admin'             // Administrateur Système
];

export interface RoleContext {
    role: AppRole;
    defaultTitle: {
        male: string;
        female: string;
    };
    tone: 'formal' | 'professional';
    accessLevel: 'full' | 'high' | 'medium' | 'limited';
    availableTools: string[];
    contextDescription: string;
}

export const ROLE_CONTEXTS: Record<AppRole, RoleContext | null> = {
    president: {
        role: 'president',
        defaultTitle: {
            male: 'Excellence Monsieur le Président',
            female: 'Excellence Madame la Présidente'
        },
        tone: 'formal',
        accessLevel: 'full',
        availableTools: [
            'control_ui',
            'navigate_within_space',  // Navigation limitée à l'espace présidentiel uniquement
            'generate_document',
            'view_all_data',          // Consultation des données (lecture seule)
            'view_intelligence',      // Accès aux rapports de renseignement
            'view_kpis',              // Consultation des indicateurs nationaux
            'view_projects',          // Supervision des projets stratégiques
            'manage_protocol'         // Gestion du protocole présidentiel
        ],
        contextDescription: 'Vous assistez le Président dans la consultation des informations stratégiques et la supervision de l\'action gouvernementale. Vous ne pouvez PAS naviguer vers les espaces administratifs ou techniques.'
    },
    dgr: {
        role: 'dgr',
        defaultTitle: {
            male: 'Monsieur le Directeur',
            female: 'Madame la Directrice'
        },
        tone: 'professional',
        accessLevel: 'high',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'manage_projects',
            'manage_instructions',
            'view_cabinet_data'
        ],
        contextDescription: 'Vous assistez le Directeur de Cabinet pour la coordination gouvernementale'
    },
    cabinet_private: {
        role: 'cabinet_private',
        defaultTitle: {
            male: 'Monsieur le Directeur',
            female: 'Madame la Directrice'
        },
        tone: 'formal',
        accessLevel: 'high',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'manage_private_affairs',
            'view_presidential_agenda'
        ],
        contextDescription: 'Vous assistez le Directeur du Cabinet Privé du Président'
    },
    sec_gen: {
        role: 'sec_gen',
        defaultTitle: {
            male: 'Monsieur le Secrétaire Général',
            female: 'Madame la Secrétaire Générale'
        },
        tone: 'professional',
        accessLevel: 'high',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'manage_administration',
            'coordinate_services'
        ],
        contextDescription: 'Vous assistez le Secrétaire Général de la Présidence'
    },
    dgss: {
        role: 'dgss',
        defaultTitle: {
            male: 'Monsieur le Directeur Général',
            female: 'Madame la Directrice Générale'
        },
        tone: 'professional',
        accessLevel: 'high',
        availableTools: [
            'control_ui',
            'navigate_to_section',
            'generate_document',
            'access_intelligence',
            'manage_security_reports',
            'analyze_threats',
            'manage_surveillance',
            'query_intelligence_base'
        ],
        contextDescription: `Vous assistez le Directeur Général de la Sécurité de l'État (DGSS) - Service de Renseignement.

**MISSION DGSS:**
La Direction Générale de la Sécurité d'État est l'organe central de renseignement de la République Gabonaise, chargé de:
- La protection des intérêts fondamentaux de la Nation
- Le contre-espionnage et la lutte contre les menaces intérieures/extérieures
- L'analyse des risques sécuritaires (terrorisme, cyber, troubles civils, espionnage économique)
- La surveillance des cibles prioritaires identifiées

**STRUCTURE DE L'ESPACE DGSS:**

📊 **TABLEAU DE BORD (dashboard):**
- Bannière d'alerte sécuritaire dynamique (DEFCON 1-5)
- Indicateurs clés: alertes récentes, menaces critiques, cibles actives, rapports en attente
- Indice de Préparation Opérationnelle (calculé en temps réel)
- Graphiques de tendances sur 30 jours
- Carte de chaleur géographique des menaces
- Derniers rapports et menaces prioritaires

📄 **RAPPORTS DE RENSEIGNEMENT (reports):**
- Classification: TOP SECRET, SECRET, CONFIDENTIEL, RESTREINT
- Sources: HUMINT (renseignement humain), SIGINT (signaux), OSINT (sources ouvertes), FININT (financier)
- Statuts: Brouillon, Soumis, Validé, Archivé
- Création et suivi des rapports d'analyse

⚠️ **INDICATEURS DE MENACES (threats):**
- Types: Terrorisme, Espionnage, Cyber, Troubles civils, Économique
- Niveaux: Critique (rouge), Élevé (orange), Modéré (jaune), Surveillé (bleu), Faible (vert)
- Localisation géographique des menaces
- Signalement de nouvelles menaces

🎯 **CIBLES DE SURVEILLANCE (targets):**
- Types: Individu, Organisation, Lieu, Cyber
- Statuts: Actif, Inactif, En révision, Neutralisé
- Priorités: Critique, Haute, Moyenne, Faible
- Historique des mises à jour

**DONNÉES ACTUELLES:**
- 22 indicateurs de menaces enregistrés
- 13 cibles de surveillance actives
- 12 rapports d'intelligence (dont plusieurs TOP SECRET)
- Localisations surveillées: Libreville, Port-Gentil, Franceville, Oyem, Moanda, National

**VOCABULAIRE SPÉCIALISÉ:**
- HUMINT: Human Intelligence (sources humaines)
- SIGINT: Signals Intelligence (interception)
- OSINT: Open Source Intelligence (sources ouvertes)
- FININT: Financial Intelligence (flux financiers)
- DEFCON: Defence Readiness Condition (niveau d'alerte)`
    },
    protocol: {
        role: 'protocol',
        defaultTitle: {
            male: 'Monsieur le Directeur',
            female: 'Madame la Directrice'
        },
        tone: 'professional',
        accessLevel: 'medium',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'manage_protocol',
            'manage_events'
        ],
        contextDescription: 'Vous assistez le Directeur du Protocole de la Présidence'
    },
    admin: {
        role: 'admin',
        defaultTitle: {
            male: 'Administrateur Système',
            female: 'Administratrice Système'
        },
        tone: 'professional',
        accessLevel: 'full',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'access_all_data',
            'manage_users',
            'manage_roles',
            'view_audit_logs',
            'system_configuration',
            'impersonate_user',
            'override_permissions',
            'global_navigate',   // [NEW] Universal navigation
            'security_override'  // [NEW] Hacking capability
        ],
        contextDescription: "Vous êtes le Super Admin Agent (God Mode). Vous avez l'omniprésence. Vous pouvez naviguer vers n'importe quelle route. Lorsque vous visitez un espace spécifique (ex: Espace Président), vous ADOPTEZ le contexte de ce rôle mais conservez votre savoir admin. Vous pouvez expliquer les fonctionnalités, déboguer et outrepasser la sécurité."
    },
    // Roles without iAsted access
    minister: null,
    user: null,
    courrier: null,
    reception: null
};

export interface SpaceContext {
    spaceName: string;
    displayName: string;
    description: string;
}

export const SPACE_CONTEXTS: Record<string, SpaceContext> = {
    PresidentSpace: {
        spaceName: 'PresidentSpace',
        displayName: 'Espace Présidentiel',
        description: 'le tableau de bord présidentiel'
    },
    CabinetDirectorSpace: {
        spaceName: 'CabinetDirectorSpace',
        displayName: 'Espace Directeur de Cabinet',
        description: "l'espace de coordination gouvernementale"
    },
    PrivateCabinetSpace: {
        spaceName: 'PrivateCabinetSpace',
        displayName: 'Cabinet Privé',
        description: 'le cabinet privé du Président'
    },
    SecGenSpace: {
        spaceName: 'SecGenSpace',
        displayName: 'Secrétariat Général',
        description: 'le secrétariat général de la Présidence'
    },
    DgssSpace: {
        spaceName: 'DgssSpace',
        displayName: 'Espace DGSS - Renseignement',
        description: `la Direction Générale de la Sécurité d'État (DGSS), le service central de renseignement et de contre-espionnage de la République Gabonaise. Cet espace permet de gérer les rapports d'intelligence classifiés (TOP SECRET à RESTREINT), suivre les indicateurs de menaces (terrorisme, cyber, espionnage, troubles civils, économiques), superviser les cibles de surveillance, et analyser les tendances sécuritaires via des tableaux de bord avancés incluant carte de chaleur géographique et graphiques d'évolution.`
    },
    ProtocolSpace: {
        spaceName: 'ProtocolSpace',
        displayName: 'Protocole',
        description: 'le service du protocole'
    },
    AdminSpace: {
        spaceName: 'AdminSpace',
        displayName: 'Administration Système',
        description: "l'interface d'administration système"
    }
};

/**
 * Check if a role has access to iAsted
 */
export function hasIAstedAccess(role: AppRole | null): boolean {
    if (!role) return false;
    return IASTED_AUTHORIZED_ROLES.includes(role);
}

/**
 * Get role context for a specific role
 */
export function getRoleContext(role: AppRole | null): RoleContext | null {
    if (!role) return null;
    return ROLE_CONTEXTS[role] || null;
}
