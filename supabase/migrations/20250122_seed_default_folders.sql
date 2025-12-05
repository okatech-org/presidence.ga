-- Seed Default Folder Taxonomy for Document Management
-- Creates 8 system folders for each authorized role + 2 universal folders

-- ============================================
-- UNIVERSAL SYSTEM FOLDERS (All roles)
-- ============================================
INSERT INTO public.document_folders (name, icon, folder_type, service_role, description, color, sort_order)
VALUES
    ('Courriers Non Lus', '📨', 'system', NULL, 'Boîte de réception - Courriers non lus', '#3B82F6', -2),
    ('Courriers Lus', '✅', 'system', NULL, 'Archive - Courriers traités et lus', '#10B981', -1);

-- ============================================
-- PRESIDENT FOLDERS
-- ============================================
INSERT INTO public.document_folders (name, icon, folder_type, service_role, description, color, sort_order)
VALUES
    ('Affaires Réservées', '🗄️', 'system', 'president', 'Défense, Renseignement, Affaires familiales', '#EF4444', 1),
    ('Diplomatie & Chefs d''État', '🌍', 'system', 'president', 'Courriers des homologues, UA, ONU', '#3B82F6', 2),
    ('Urgences & Sécurité Nationale', '⚡', 'system', 'president', 'Rapports DGSS, Alertes sécuritaires', '#F59E0B', 3),
    ('Relations Institutions', '🏛️', 'system', 'president', 'Parlement, Cour Constitutionnelle', '#8B5CF6', 4),
    ('Projets Stratégiques', '💰', 'system', 'president', 'Grands chantiers, Investissements majeurs', '#10B981', 5),
    ('Notes Gouvernementales', '📝', 'system', 'president', 'Premier Ministre, Ministres', '#6366F1', 6),
    ('Nominations & Décrets', '👥', 'system', 'president', 'Projets de textes à signer', '#EC4899', 7),
    ('Doléances Citoyennes', '🗣️', 'system', 'president', 'Synthèses, Opinion publique', '#14B8A6', 8);

-- ============================================
-- DIRECTEUR DE CABINET (DGR) FOLDERS
-- ============================================
INSERT INTO public.document_folders (name, icon, folder_type, service_role, description, color, sort_order)
VALUES
    ('Instructions Présidentielles', '⚡', 'system', 'dgr', 'Suivi d''exécution des instructions', '#F59E0B', 1),
    ('Coordination Gouvernementale', '🏛️', 'system', '

dgr', 'Suivi des Ministères', '#3B82F6', 2),
    ('Demandes d''Audience', '📅', 'system', 'dgr', 'Requêtes à filtrer et prioriser', '#8B5CF6', 3),
    ('Notes Techniques', '📁', 'system', 'dgr', 'Analyses des conseillers', '#6366F1', 4),
    ('Budget & Finances', '💰', 'system', 'dgr', 'Trésor, Budget de l''État', '#10B981', 5),
    ('Missions & Déplacements', '🌍', 'system', 'dgr', 'Logistique présidentielle', '#14B8A6', 6),
    ('Communication & Média', '📢', 'system', 'dgr', 'Relations presse, Communication officielle', '#EC4899', 7),
    ('Gestion de Crise', '🔴', 'system', 'dgr', 'Alertes immédiates, Cellule de crise', '#EF4444', 8);

-- ============================================
-- SECRÉTARIAT GÉNÉRAL FOLDERS
-- ============================================
INSERT INTO public.document_folders (name, icon, folder_type, service_role, description, color, sort_order)
VALUES
    ('Projets de Lois & Ordonnances', '⚖️', 'system', 'sec_gen', 'Contrôle constitutionnel', '#8B5CF6', 1),
    ('Décrets & Arrêtés', '📜', 'system', 'sec_gen', 'Circuit de signature', '#6366F1', 2),
    ('Journal Officiel', '📰', 'system', 'sec_gen', 'Publications officielles', '#3B82F6', 3),
    ('Archives Nationales', '🗃️', 'system', 'sec_gen', 'Classement historique', '#64748B', 4),
    ('Contentieux de l''État', '💼', 'system', 'sec_gen', 'Affaires juridiques', '#EF4444', 5),
    ('Conseils des Ministres', '🏢', 'system', 'sec_gen', 'Ordres du jour, Relevés de décisions', '#10B981', 6),
    ('Accords Internationaux', '🤝', 'system', 'sec_gen', 'Traités, Conventions', '#14B8A6', 7),
    ('Personnel Présidence', '👥', 'system', 'sec_gen', 'Administration RH', '#EC4899', 8);

-- ============================================
-- CABINET PRIVÉ FOLDERS
-- ============================================
INSERT INTO public.document_folders (name, icon, folder_type, service_role, description, color, sort_order)
VALUES
    ('Affaires Personnelles', '🔒', 'system', 'cabinet_private', 'Courriers privés du Président', '#EF4444', 1),
    ('Famille Présidentielle', '👨‍👩‍👧‍👦', 'system', 'cabinet_private', 'Affaires familiales', '#EC4899', 2),
    ('Agenda Privé', '📅', 'system', 'cabinet_private', 'Rendez-vous personnels', '#8B5CF6', 3),
    ('Correspondance Personnelle', '✉️', 'system', 'cabinet_private', 'Lettres personnelles', '#6366F1', 4),
    ('Patrimoine', '🏡', 'system', 'cabinet_private', 'Gestion patrimoniale', '#10B981', 5),
    ('Santé & Médical', '🏥', 'system', 'cabinet_private', 'Dossiers médicaux', '#F59E0B', 6),
    ('Relations Privées', '🤝', 'system', 'cabinet_private', 'Amis, Famille élargie', '#14B8A6', 7),
    ('Loisirs & Culture', '🎭', 'system', 'cabinet_private', 'Activités personnelles', '#3B82F6', 8);

-- ============================================
-- DGSS (Renseignement) FOLDERS
-- ============================================
INSERT INTO public.document_folders (name, icon, folder_type, service_role, description, color, sort_order)
VALUES
    ('Renseignement Intérieur', '🕵️', 'system', 'dgss', 'Sécurité intérieure, Surveillance', '#EF4444', 1),
    ('Renseignement Extérieur', '🌍', 'system', 'dgss', 'Intelligence internationale', '#3B82F6', 2),
    ('Menaces Sécuritaires', '⚠️', 'system', 'dgss', 'Alertes, Analyses de menaces', '#F59E0B', 3),
    ('Contre-Espionnage', '🛡️', 'system', 'dgss', 'Activités contre-espionnage', '#8B5CF6', 4),
    ('Rapports Quotidiens', '📊', 'system', 'dgss', 'Synthèses journalières', '#6366F1', 5),
    ('Cybersécurité', '💻', 'system', 'dgss', 'Menaces cyber, Protection SI', '#10B981', 6),
    ('Terrorisme & Extrémisme', '🚨', 'system', 'dgss', 'Lutte anti-terroriste', '#DC2626', 7),
    ('Personnalités Sous Surveillance', '👁️', 'system', 'dgss', 'Dossiers sensibles', '#64748B', 8);

-- ============================================
-- PROTOCOLE FOLDERS
-- ============================================
INSERT INTO public.document_folders (name, icon, folder_type, service_role, description, color, sort_order)
VALUES
    ('Visites Officielles', '🛫', 'system', 'protocol', 'Organisation visites d''État', '#3B82F6', 1),
    ('Cérémonies d''État', '🎖️', 'system', 'protocol', 'Événements protocole', '#8B5CF6', 2),
    ('Ordre de Préséance', '👑', 'system', 'protocol', 'Hiérarchie protocolaire', '#6366F1', 3),
    ('Décorations & Honneurs', '🏅', 'system', 'protocol', 'Remise de distinctions', '#F59E0B', 4),
    ('Invitations Officielles', '💌', 'system', 'protocol', 'Gestion invitations', '#EC4899', 5),
    ('Relations Diplomatiques', '🤝', 'system', 'protocol', 'Corps diplomatique', '#14B8A6', 6),
    ('Événements Internationaux', '🌍', 'system', 'protocol', 'Sommets, Conférences', '#10B981', 7),
    ('Protocole Militaire', '⚔️', 'system', 'protocol', 'Cérémonies militaires', '#EF4444', 8);

-- ============================================
-- MINISTÈRES FOLDERS (Generic for all ministers)
-- ============================================
INSERT INTO public.document_folders (name, icon, folder_type, service_role, description, color, sort_order)
VALUES
    ('Instructions Présidence', '📥', 'system', 'minister', 'Directives de la Présidence', '#F59E0B', 1),
    ('Projets Sectoriels', '🚀', 'system', 'minister', 'Dossiers techniques du ministère', '#3B82F6', 2),
    ('Exécution Budgétaire', '💰', 'system', 'minister', 'Engagements, Paiements', '#10B981', 3),
    ('Ressources Humaines', '👥', 'system', 'minister', 'Nominations internes', '#EC4899', 4),
    ('Correspondance Administrative', '📝', 'system', 'minister', 'Courrier départ/arrivée', '#6366F1', 5),
    ('Partenaires & Bailleurs', '🤝', 'system', 'minister', 'Financements extérieurs', '#14B8A6', 6),
    ('Rapports d''Activités', '📊', 'system', 'minister', 'KPIs, Bilan périodique', '#8B5CF6', 7),
    ('Réglementation Sectorielle', '⚖️', 'system', 'minister', 'Textes juridiques du secteur', '#64748B', 8);

-- ============================================
-- COURRIER SERVICE FOLDERS (Service Courriers)
-- ============================================
INSERT INTO public.document_folders (name, icon, folder_type, service_role, description, color, sort_order)
VALUES
    ('À Trier', '📦', 'system', 'courrier', 'Courriers en attente de tri', '#F59E0B', 1),
    ('Courriers Confidentiels', '🔒', 'system', 'courrier', 'À transmettre sans ouverture', '#EF4444', 2),
    ('Courriers Généraux', '📧', 'system', 'courrier', 'Traités par le service', '#3B82F6', 3),
    ('En Transit', '🚚', 'system', 'courrier', 'En cours de transfert', '#8B5CF6', 4);

-- ============================================
-- RECEPTION SERVICE FOLDERS
-- ============================================
INSERT INTO public.document_folders (name, icon, folder_type, service_role, description, color, sort_order)
VALUES
    ('Dépôts du Jour', '📬', 'system', 'reception', 'Courriers déposés aujourd''hui', '#3B82F6', 1),
    ('En Attente Scan', '📸', 'system', 'reception', 'À numériser', '#F59E0B', 2),
    ('Transférés', '✅', 'system', 'reception', 'Envoyés au Service Courriers', '#10B981', 3);
