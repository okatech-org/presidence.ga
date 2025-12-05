-- Insert improved document templates
INSERT INTO public.document_templates (name, description, structure)
VALUES 
(
    'Le Républicain Moderne', 
    'Style standard amélioré. Typographie soignée (Roboto/Times), alignement millimétré, interligne 1.5. Idéal pour les courriers officiels.',
    '{
        "styles": {
            "header": { "fontSize": 14, "bold": true, "alignment": "center", "font": "Roboto" },
            "body": { "fontSize": 12, "lineHeight": 1.5, "font": "Times" }
        },
        "layout": "standard_modern"
    }'::jsonb
),
(
    'L''Exécutif Dynamique', 
    'Style moderne pour notes de service. Accents de couleurs discrets (Vert-Jaune-Bleu), puces stylisées, design compact.',
    '{
        "styles": {
            "header": { "fontSize": 12, "bold": true, "color": "#009E60" },
            "body": { "fontSize": 11, "lineHeight": 1.3 }
        },
        "layout": "executive_dynamic"
    }'::jsonb
),
(
    'Le Solennel Prestige', 
    'Style haute importance pour Décrets et Nominations. Filigrane des armoiries, mise en page centrée, signature élargie.',
    '{
        "styles": {
            "header": { "fontSize": 16, "bold": true, "alignment": "center" },
            "body": { "fontSize": 12, "lineHeight": 1.6, "alignment": "justify" },
            "watermark": true
        },
        "layout": "solemn_prestige"
    }'::jsonb
);
