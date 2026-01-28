-- =============================================
-- DGSS Demo Seed Data
-- Direction Générale des Services Spéciaux
-- =============================================
-- This migration inserts realistic demo data for the DGSS intelligence space.
-- Run in demo mode only or remove data after testing.

-- =============================================
-- INTELLIGENCE REPORTS (10 reports)
-- =============================================
INSERT INTO public.intelligence_reports (id, title, content, source, classification, status, created_at)
VALUES
    (
        gen_random_uuid(),
        'Activités suspectes au port d''Owendo',
        'Observation de mouvements inhabituels de conteneurs non déclarés dans la zone nord du port. Les activités semblent liées à un réseau de contrebande transfrontalier. Une surveillance renforcée est recommandée.',
        'HUMINT',
        'secret',
        'submitted',
        NOW() - INTERVAL '2 days'
    ),
    (
        gen_random_uuid(),
        'Intrusion détectée sur le réseau gouvernemental',
        'Les systèmes de détection ont identifié une tentative d''intrusion sophistiquée ciblant les serveurs du Ministère des Finances. L''attaque semble provenir d''un groupe APT étranger. Mesures de confinement activées.',
        'SIGINT',
        'top_secret',
        'reviewed',
        NOW() - INTERVAL '1 day'
    ),
    (
        gen_random_uuid(),
        'Rencontre diplomatique non officielle à Franceville',
        'Un attaché commercial étranger a été observé lors de réunions privées avec des responsables locaux. Les échanges pourraient concerner des contrats miniers non déclarés.',
        'HUMINT',
        'confidential',
        'submitted',
        NOW() - INTERVAL '4 days'
    ),
    (
        gen_random_uuid(),
        'Mouvements financiers suspects - Secteur pétrolier',
        'Analyse des flux financiers révélant des transferts de 2.3 milliards FCFA vers des comptes offshore. Les transactions impliquent trois sociétés écran basées aux Émirats.',
        'FININT',
        'top_secret',
        'draft',
        NOW() - INTERVAL '6 hours'
    ),
    (
        gen_random_uuid(),
        'Rassemblement politique non autorisé - Libreville',
        'Préparation d''un rassemblement clandestin prévu pour le week-end prochain dans le 3ème arrondissement. Environ 200 participants attendus. Surveillance préventive recommandée.',
        'OSINT',
        'restricted',
        'submitted',
        NOW() - INTERVAL '3 days'
    ),
    (
        gen_random_uuid(),
        'Trafic d''espèces protégées - Forêt de Lopé',
        'Réseau identifié opérant dans le Parc National de la Lopé. Exportation illégale de faune vers l''Asie via des routes maritimes. Collaboration avec Interpol en cours.',
        'HUMINT',
        'confidential',
        'reviewed',
        NOW() - INTERVAL '5 days'
    ),
    (
        gen_random_uuid(),
        'Analyse des médias sociaux - Désinformation',
        'Campagne coordonnée de désinformation identifiée sur les réseaux sociaux. Plus de 500 comptes automatisés diffusent des informations erronées sur les élections.',
        'OSINT',
        'secret',
        'submitted',
        NOW() - INTERVAL '1 day'
    ),
    (
        gen_random_uuid(),
        'Rapport de contre-espionnage - Ambassade',
        'Activités inhabituelles détectées autour du complexe diplomatique. Deux individus identifiés comme agents de renseignement étrangers sous couverture commerciale.',
        'HUMINT',
        'top_secret',
        'draft',
        NOW() - INTERVAL '12 hours'
    ),
    (
        gen_random_uuid(),
        'Infrastructure critique - Évaluation des risques',
        'Audit de sécurité du barrage de Kinguélé révélant des vulnérabilités potentielles. Recommandations de renforcement transmises au Ministère de l''Énergie.',
        'TECHINT',
        'secret',
        'reviewed',
        NOW() - INTERVAL '7 days'
    ),
    (
        gen_random_uuid(),
        'Flux migratoires - Frontière Nord',
        'Augmentation de 35% des passages clandestins à la frontière camerounaise. Nécessité de renforcer les patrouilles et la coopération bilatérale.',
        'HUMINT',
        'confidential',
        'submitted',
        NOW() - INTERVAL '2 days'
    )
ON CONFLICT DO NOTHING;

-- =============================================
-- SURVEILLANCE TARGETS (8 targets)
-- =============================================
INSERT INTO public.surveillance_targets (id, name, type, status, priority, last_update, created_at)
VALUES
    (
        gen_random_uuid(),
        'COBRA-7',
        'individual',
        'active',
        'critical',
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '30 days'
    ),
    (
        gen_random_uuid(),
        'Société Minière Fantôme SARL',
        'organization',
        'active',
        'high',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '45 days'
    ),
    (
        gen_random_uuid(),
        'SHADOW-NET',
        'cyber',
        'under_review',
        'critical',
        NOW() - INTERVAL '6 hours',
        NOW() - INTERVAL '15 days'
    ),
    (
        gen_random_uuid(),
        'Entrepôt Zone Industrielle Oloumi',
        'location',
        'active',
        'medium',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '60 days'
    ),
    (
        gen_random_uuid(),
        'DELTA-FINANCE Network',
        'organization',
        'active',
        'high',
        NOW() - INTERVAL '12 hours',
        NOW() - INTERVAL '20 days'
    ),
    (
        gen_random_uuid(),
        'FALCON-3',
        'individual',
        'inactive',
        'medium',
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '90 days'
    ),
    (
        gen_random_uuid(),
        'darkmarket.ga (Domaine)',
        'cyber',
        'active',
        'high',
        NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '10 days'
    ),
    (
        gen_random_uuid(),
        'NEXUS-OPS',
        'organization',
        'neutralized',
        'low',
        NOW() - INTERVAL '14 days',
        NOW() - INTERVAL '120 days'
    )
ON CONFLICT DO NOTHING;

-- =============================================
-- THREAT INDICATORS (15 threats)
-- =============================================
INSERT INTO public.threat_indicators (id, type, level, description, location, timestamp, created_at)
VALUES
    (
        gen_random_uuid(),
        'cyber',
        'critical',
        'Attaque DDoS massive ciblant les services gouvernementaux. Volume de trafic anormal détecté sur les serveurs principaux. Origine : botnet international.',
        'Libreville',
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '3 hours'
    ),
    (
        gen_random_uuid(),
        'terrorism',
        'high',
        'Interception de communications suspectes évoquant un projet d''action violente. Surveillance accrue des groupes radicalisés en cours.',
        'Port-Gentil',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    ),
    (
        gen_random_uuid(),
        'espionage',
        'critical',
        'Agent étranger identifié tentant de recruter un fonctionnaire du Ministère de la Défense. Opération de contre-espionnage activée.',
        'Libreville',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        gen_random_uuid(),
        'civil_unrest',
        'elevated',
        'Tension sociale croissante suite aux annonces économiques. Mouvements de protestation spontanés signalés dans plusieurs quartiers.',
        'Libreville',
        NOW() - INTERVAL '6 hours',
        NOW() - INTERVAL '6 hours'
    ),
    (
        gen_random_uuid(),
        'economic',
        'high',
        'Manipulation des cours du pétrole détectée. Acteurs non identifiés semblent orchestrer une déstabilisation du marché local.',
        'Moanda',
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '4 days'
    ),
    (
        gen_random_uuid(),
        'cyber',
        'elevated',
        'Tentatives de phishing ciblant les employés de la présidence. 12 courriels malveillants interceptés cette semaine.',
        'Libreville',
        NOW() - INTERVAL '12 hours',
        NOW() - INTERVAL '12 hours'
    ),
    (
        gen_random_uuid(),
        'terrorism',
        'guarded',
        'Mouvements inhabituels à la frontière nord. Surveillance renforcée des voies d''accès.',
        'Bitam',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days'
    ),
    (
        gen_random_uuid(),
        'espionage',
        'high',
        'Équipement d''écoute clandestin découvert dans un bureau ministériel. Analyse technique en cours.',
        'Libreville',
        NOW() - INTERVAL '8 hours',
        NOW() - INTERVAL '8 hours'
    ),
    (
        gen_random_uuid(),
        'civil_unrest',
        'low',
        'Rumeurs de manifestation pacifique prévue. Aucune menace immédiate identifiée.',
        'Franceville',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        gen_random_uuid(),
        'economic',
        'elevated',
        'Transactions suspectes dans le secteur forestier. Évasion fiscale potentielle estimée à 500 millions FCFA.',
        'Oyem',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days'
    ),
    (
        gen_random_uuid(),
        'cyber',
        'high',
        'Vulnérabilité zero-day exploitée sur les systèmes bancaires. Correctif d''urgence déployé.',
        'Libreville',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    ),
    (
        gen_random_uuid(),
        'terrorism',
        'elevated',
        'Surveillance de groupe radical sur réseaux sociaux. Discours de propagande en augmentation.',
        'Lambaréné',
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '4 days'
    ),
    (
        gen_random_uuid(),
        'espionage',
        'guarded',
        'Activité inhabituelle près de l''ambassade. Véhicule non identifié stationné pendant plusieurs heures.',
        'Libreville',
        NOW() - INTERVAL '6 days',
        NOW() - INTERVAL '6 days'
    ),
    (
        gen_random_uuid(),
        'civil_unrest',
        'high',
        'Appel à la grève générale par les syndicats. Mobilisation prévue pour la semaine prochaine.',
        'Libreville',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    ),
    (
        gen_random_uuid(),
        'economic',
        'critical',
        'Tentative de corruption d''un officiel gouvernemental par une multinationale étrangère. Dossier transmis à la justice.',
        'Libreville',
        NOW() - INTERVAL '5 hours',
        NOW() - INTERVAL '5 hours'
    )
ON CONFLICT DO NOTHING;

-- =============================================
-- GRANT SELECT permissions if needed
-- =============================================
-- Already handled by RLS policies in the schema migration
