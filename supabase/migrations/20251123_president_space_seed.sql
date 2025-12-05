-- Seed data for President Space Dashboard
-- This creates sample data for development and testing

-- ============================================================
-- CONSEIL DES MINISTRES - Sample Sessions
-- ============================================================

INSERT INTO conseil_ministres_sessions (date, time, location, status, notes)
VALUES
  (CURRENT_DATE + INTERVAL '7 days', '10:00:00', 'Palais de la Rénovation', 'scheduled', 'Session ordinaire hebdomadaire'),
  (CURRENT_DATE - INTERVAL '7 days', '10:00:00', 'Palais de la Rénovation', 'completed', 'Session complétée avec succès'),
  (CURRENT_DATE + INTERVAL '14 days', '14:00:00', 'Palais de la Rénovation', 'scheduled', 'Session extraordinaire');

-- Get the ID of the next scheduled session
DO $$
DECLARE
  next_session_id UUID;
BEGIN
  SELECT id INTO next_session_id 
  FROM conseil_ministres_sessions 
  WHERE status = 'scheduled' 
  ORDER BY date ASC 
  LIMIT 1;

  -- Add agenda items for the next session
  INSERT INTO ordre_du_jour (session_id, title, description, item_order, type, presenter, duration_minutes)
  VALUES
    (next_session_id, 'Projet de décret – Nomination Directeur Général SEEG', 'Nomination du nouveau DG de la Société d''Énergie et d''Eau du Gabon', 1, 'decree', 'Ministre de l''Énergie', 15),
    (next_session_id, 'Ordonnance – Budget rectificatif 2025', 'Ajustement budgétaire pour le premier trimestre 2025', 2, 'ordinance', 'Ministre de l''Économie et des Finances', 30),
    (next_session_id, 'Communication – Relations diplomatiques', 'Point sur les visites diplomatiques prévues au Q2', 3, 'communication', 'Ministre des Affaires Étrangères', 20);
END $$;

-- ============================================================
-- DÉCRETS & ORDONNANCES - Sample Documents
-- ============================================================

INSERT INTO decrets_ordonnances (reference, type, title, content, status, requires_signature, submitted_at)
VALUES
  ('2025/047', 'decree', 'Nomination au poste de Directeur Général de la SEEG', 
   'Décret portant nomination de M. Jean MBADINGA au poste de Directeur Général de la Société d''Énergie et d''Eau du Gabon.',
   'signed', true, NOW() - INTERVAL '10 days'),
  
  ('2025/051', 'ordinance', 'Budget rectificatif du premier trimestre 2025', 
   'Ordonnance portant modification du budget général de l''État pour l''exercice 2025.',
   'pending', true, NOW() - INTERVAL '3 days'),
  
  ('2025/059', 'decree', 'Réorganisation de la Direction Générale des Impôts', 
   'Décret portant réorganisation structurelle et fonctionnelle de la Direction Générale des Impôts.',
   'revision_needed', true, NOW() - INTERVAL '5 days'),
  
  ('2025/063', 'decree', 'Création du Conseil National du Numérique', 
   'Décret portant création, attributions et organisation du Conseil National du Numérique.',
   'pending', true, NOW() - INTERVAL '2 days');

-- ============================================================
-- NOMINATIONS - Sample Nominations
-- ============================================================

INSERT INTO nominations (poste, ministere, candidate_name, candidate_info, status, submitted_at)
VALUES
  ('Directeur Général SEEG', 'Énergie et Ressources Hydrauliques', 'Jean MBADINGA',
   '{"qualifications": ["Ingénieur Électrique", "MBA Management"], "experience": "15 ans dans le secteur énergétique", "age": 45}'::jsonb,
   'approved', NOW() - INTERVAL '15 days'),
  
  ('Secrétaire Général', 'Intérieur et Sécurité', 'Marie OBIANG',
   '{"qualifications": ["Maîtrise Droit Public", "ENA"], "experience": "12 ans dans l''administration", "age": 42}'::jsonb,
   'pending', NOW() - INTERVAL '5 days'),
  
  ('Directeur de Cabinet', 'Économie et Finances', 'Paul NGUEMA',
   '{"qualifications": ["Économiste", "PhD Finance"], "experience": "18 ans", "age": 48}'::jsonb,
   'pending', NOW() - INTERVAL '3 days'),
  
  ('Directeur Général Impôts', 'Économie et Finances', 'Sophie MOUSSAVOU',
   '{"qualifications": ["Expert-Comptable", "Master Fiscalité"], "experience": "20 ans", "age": 50}'::jsonb,
   'pending', NOW() - INTERVAL '1 day');

-- ============================================================
-- BUDGET NATIONAL - Sample Budget Data
-- ============================================================

INSERT INTO budget_national (fiscal_year, ministry_name, ministry_code, category, allocated_amount, spent_amount)
VALUES
  -- Ministère de l'Éducation Nationale
  (2025, 'Éducation Nationale', 'MEN', 'Salaires', 450000000000, 305000000000),
  (2025, 'Éducation Nationale', 'MEN', 'Infrastructure', 120000000000, 45000000000),
  (2025, 'Éducation Nationale', 'MEN', 'Fonctionnement', 50000000000, 32000000000),
  
  -- Ministère de la Santé
  (2025, 'Santé Publique', 'MSP', 'Salaires', 280000000000, 195000000000),
  (2025, 'Santé Publique', 'MSP', 'Infrastructure', 150000000000, 67000000000),
  (2025, 'Santé Publique', 'MSP', 'Médicaments', 50000000000, 38000000000),
  
  -- Ministère de la Défense
  (2025, 'Défense Nationale', 'MDN', 'Salaires', 520000000000, 360000000000),
  (2025, 'Défense Nationale', 'MDN', 'Équipement', 150000000000, 89000000000),
  (2025, 'Défense Nationale', 'MDN', 'Fonctionnement', 50000000000, 34000000000),
  
  -- Ministère des Infrastructures
  (2025, 'Infrastructures', 'MI', 'Projets Routiers', 650000000000, 234000000000),
  (2025, 'Infrastructures', 'MI', 'Bâtiments Publics', 200000000000, 98000000000),
  (2025, 'Infrastructures', 'MI', 'Fonctionnement', 100000000000, 67000000000);

-- ============================================================
-- INDICATEURS ÉCONOMIQUES - Sample Economic Data
-- ============================================================

INSERT INTO indicateurs_economiques (indicator_type, indicator_name, value, unit, period, period_start_date, period_end_date, source)
VALUES
  ('gdp_growth', 'Croissance du PIB', 3.2, '%', 'Q4-2024', '2024-10-01', '2024-12-31', 'Institut National de la Statistique'),
  ('inflation', 'Taux d''Inflation', 4.8, '%', 'Q4-2024', '2024-10-01', '2024-12-31', 'Banque Centrale'),
  ('employment', 'Taux d''Emploi', 80.2, '%', 'Q4-2024', '2024-10-01', '2024-12-31', 'Ministère du Travail'),
  ('trade_balance', 'Balance Commerciale', 120000000000, 'FCFA', 'Q4-2024', '2024-10-01', '2024-12-31', 'Ministère du Commerce'),
  ('public_debt', 'Dette Publique (% PIB)', 42.5, '%', '2024', '2024-01-01', '2024-12-31', 'Ministère des Finances'),
  ('fdi', 'Investissements Directs Étrangers', 85000000000, 'FCFA', 'Q4-2024', '2024-10-01', '2024-12-31', 'Banque Centrale'),
  
  -- Historical data for comparison
  ('gdp_growth', 'Croissance du PIB', 2.8, '%', 'Q3-2024', '2024-07-01', '2024-09-30', 'Institut National de la Statistique'),
  ('inflation', 'Taux d''Inflation', 4.5, '%', 'Q3-2024', '2024-07-01', '2024-09-30', 'Banque Centrale'),
  ('employment', 'Taux d''Emploi', 79.8, '%', 'Q3-2024', '2024-07-01', '2024-09-30', 'Ministère du Travail');

-- ============================================================
-- CHANTIERS - Sample Construction Projects
-- ============================================================

INSERT INTO chantiers (name, description, location, contractor, contract_amount, budget, spent_amount, progress, start_date, expected_end_date, status)
VALUES
  ('Autoroute Libreville-Port-Gentil', 'Construction de l''autoroute reliant Libreville à Port-Gentil', 'Libreville - Port-Gentil', 
   'China Road & Bridge Corporation', 850000000000, 850000000000, 425000000000, 50, '2023-06-01', '2026-12-31', 'ongoing'),
  
  ('Complexe Hospitalier Universitaire d''Owendo', 'Construction d''un hôpital universitaire moderne de 500 lits', 'Owendo, Libreville',
   'Bouygues Construction', 125000000000, 125000000000, 87500000000, 70, '2023-01-15', '2025-06-30', 'ongoing'),
  
  ('Stade Omnisports de Franceville', 'Construction d''un stade multifonctionnel de 35 000 places', 'Franceville',
   'SOGEA-SATOM', 45000000000, 45000000000, 31500000000, 70, '2023-09-01', '2025-08-31', 'ongoing'),
  
  ('Port en Eau Profonde d''Owendo - Extension', 'Extension et modernisation du port d''Owendo', 'Owendo',
   'Bolloré Africa Logistics', 230000000000, 230000000000, 69000000000, 30, '2024-03-01', '2027-02-28', 'ongoing'),
  
  ('Centrale Hydroélectrique de Kinguélé-Aval', 'Construction d''une centrale hydroélectrique de 60 MW', 'Kinguélé',
   'SINOHYDRO', 95000000000, 95000000000, 85500000000, 90, '2022-11-01', '2025-04-30', 'ongoing');

-- ============================================================
-- PROJETS PRÉSIDENTIELS - Presidential Priority Projects
-- ============================================================

INSERT INTO projets_presidentiels (title, description, priority, status, budget_allocated, budget_spent, progress, start_date, expected_end_date, responsible_ministry, milestones)
VALUES
  ('Gabon Numérique 2025', 
   'Digitalisation complète de l''administration gabonaise et connexion internet haut débit sur tout le territoire',
   1, 'in_progress', 180000000000, 108000000000, 60, '2023-01-01', '2025-12-31', 'Communication et Économie Numérique',
   '[{"name": "Déploiement fibre optique", "status": "completed", "date": "2024-03-15"}, 
     {"name": "Plateformes e-government", "status": "in_progress", "date": "2025-06-30"},
     {"name": "Formation agents", "status": "planned", "date": "2025-09-30"}]'::jsonb),
  
  ('Route de la Santé Universelle', 
   'Accès aux soins de santé de qualité pour tous les Gabonais',
   2, 'in_progress', 250000000000, 137500000000, 55, '2023-06-01', '2026-12-31', 'Santé Publique',
   '[{"name": "Construction 10 centres de santé", "status": "in_progress", "date": "2025-12-31"},
     {"name": "Formation personnel médical", "status": "in_progress", "date": "2025-06-30"},
     {"name": "Équipement médical", "status": "planned", "date": "2026-06-30"}]'::jsonb),
  
  ('Gabon Vert - Transition Énergétique', 
   'Transition vers 80% d''énergies renouvelables d''ici 2030',
   3, 'in_progress', 320000000000, 96000000000, 30, '2024-01-01', '2030-12-31', 'Énergie et Ressources Hydrauliques',
   '[{"name": "Audit énergétique national", "status": "completed", "date": "2024-06-30"},
     {"name": "Centrales solaires - Phase 1", "status": "in_progress", "date": "2025-12-31"},
     {"name": "Parc éolien offshore", "status": "planned", "date": "2028-12-31"}]'::jsonb),
  
  ('Formation Professionnelle du 21ème Siècle', 
   'Adapter la formation professionnelle aux besoins du marché du travail moderne',
   4, 'approved', 150000000000, 30000000000, 20, '2024-09-01', '2027-08-31', 'Enseignement Technique et Formation Professionnelle',
   '[{"name": "Création centres d''excellence", "status": "in_progress", "date": "2025-06-30"},
     {"name": "Partenariats entreprises", "status": "planned", "date": "2025-12-31"},
     {"name": "Programmes d''apprentissage", "status": "planned", "date": "2026-06-30"}]'::jsonb);

-- ============================================================
-- PROJETS D'ÉTAT - State Projects
-- ============================================================

INSERT INTO projets_etat (title, description, ministry_name, priority, status, budget_allocated, budget_spent, progress, start_date, expected_end_date, sector)
VALUES
  ('Réhabilitation Écoles Rurales', 'Rénovation de 200 écoles en zones rurales', 'Éducation Nationale', 1, 'in_progress', 
   45000000000, 27000000000, 60, '2024-01-01', '2025-12-31', 'Éducation'),
  
  ('Programme Vaccination Nationale', 'Campagne de vaccination contre les maladies endémiques', 'Santé Publique', 2, 'in_progress',
   12000000000, 8400000000, 70, '2024-06-01', '2025-05-31', 'Santé'),
  
  ('Électrification Villages Reculés', 'Accès à l''électricité pour 150 villages isolés', 'Énergie et Ressources Hydrauliques', 3, 'in_progress',
   35000000000, 14000000000, 40, '2024-03-01', '2026-02-28', 'Infrastructure'),
  
  ('Adduction Eau Potable', 'Extension du réseau d''eau potable en zones périurbaines', 'Énergie et Ressources Hydrauliques', 4, 'in_progress',
   28000000000, 11200000000, 40, '2024-04-01', '2025-12-31', 'Infrastructure'),
  
  ('Routes Désenclavement', 'Construction de routes pour désenclaver 50 villages', 'Infrastructures', 5, 'approved',
   67000000000, 20100000000, 30, '2024-08-01', '2026-07-31', 'Infrastructure');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Seed data inserted successfully for President Space Dashboard';
END $$;
