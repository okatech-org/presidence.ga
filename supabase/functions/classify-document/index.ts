import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "https://esm.sh/openai@4.68.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClassificationRequest {
    documentId: string
    ocrText: string
    userRole: string
}

// Folder templates by role
const ROLE_FOLDERS: Record<string, string[]> = {
    president: [
        "🗄️ Affaires Réservées - Défense, Renseignement, Affaires familiales",
        "🌍 Diplomatie & Chefs d'État - Courriers des homologues, UA, ONU",
        "⚡ Urgences & Sécurité Nationale - Rapports DGSS, Alertes sécuritaires",
        "🏛️ Relations Institutions - Parlement, Cour Constitutionnelle",
        "💰 Projets Stratégiques - Grands chantiers, Investissements majeurs",
        "📝 Notes Gouvernementales - Premier Ministre, Ministres",
        "👥 Nominations & Décrets - Projets de textes à signer",
        "🗣️ Doléances Citoyennes - Synthèses, Opinion publique"
    ],
    dgr: [
        "⚡ Instructions Présidentielles - Suivi d'exécution",
        "🏛️ Coordination Gouvernementale - Suivi des Ministères",
        "📅 Demandes d'Audience - Requêtes à filtrer et prioriser",
        "📁 Notes Techniques - Analyses des conseillers",
        "💰 Budget & Finances - Trésor, Budget de l'État",
        "🌍 Missions & Déplacements - Logistique présidentielle",
        "📢 Communication & Média - Relations presse",
        "🔴 Gestion de Crise - Alertes immédiates"
    ],
    sec_gen: [
        "⚖️ Projets de Lois & Ordonnances - Contrôle constitutionnel",
        "📜 Décrets & Arrêtés - Circuit de signature",
        "📰 Journal Officiel - Publications officielles",
        "🗃️ Archives Nationales - Classement historique",
        "💼 Contentieux de l'État - Affaires juridiques",
        "🏢 Conseils des Ministres - Ordres du jour",
        "🤝 Accords Internationaux - Traités, Conventions",
        "👥 Personnel Présidence - Administration RH"
    ],
    dgss: [
        "🕵️ Renseignement Intérieur - Sécurité intérieure",
        "🌍 Renseignement Extérieur - Intelligence internationale",
        "⚠️ Menaces Sécuritaires - Alertes, Analyses",
        "🛡️ Contre-Espionnage - Activités contre-espionnage",
        "📊 Rapports Quotidiens - Synthèses journalières",
        "💻 Cybersécurité - Menaces cyber",
        "🚨 Terrorisme & Extrémisme - Lutte anti-terroriste",
        "👁️ Personnalités Sous Surveillance - Dossiers sensibles"
    ],
    protocol: [
        "🛫 Visites Officielles - Organisation visites d'État",
        "🎖️ Cérémonies d'État - Événements protocole",
        "👑 Ordre de Préséance - Hiérarchie protocolaire",
        "🏅 Décorations & Honneurs - Remise de distinctions",
        "💌 Invitations Officielles - Gestion invitations",
        "🤝 Relations Diplomatiques - Corps diplomatique",
        "🌍 Événements Internationaux - Sommets, Conférences",
        "⚔️ Protocole Militaire - Cérémonies militaires"
    ],
    cabinet_private: [
        "🔒 Affaires Personnelles - Courriers privés du Président",
        "👨‍👩‍👧‍👦 Famille Présidentielle - Affaires familiales",
        "📅 Agenda Privé - Rendez-vous personnels",
        "✉️ Correspondance Personnelle - Lettres personnelles",
        "🏡 Patrimoine - Gestion patrimoniale",
        "🏥 Santé & Médical - Dossiers médicaux",
        "🤝 Relations Privées - Amis, Famille élargie",
        "🎭 Loisirs & Culture - Activités personnelles"
    ],
    minister: [
        "📥 Instructions Présidence - Directives de la Présidence",
        "🚀 Projets Sectoriels - Dossiers techniques du ministère",
        "💰 Exécution Budgétaire - Engagements, Paiements",
        "👥 Ressources Humaines - Nominations internes",
        "📝 Correspondance Administrative - Courrier départ/arrivée",
        "🤝 Partenaires & Bailleurs - Financements extérieurs",
        "📊 Rapports d'Activités - KPIs, Bilan périodique",
        "⚖️ Réglementation Sectorielle - Textes juridiques"
    ]
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { documentId, ocrText, userRole }: ClassificationRequest = await req.json()

        if (!documentId || !ocrText || !userRole) {
            throw new Error('documentId, ocrText, and userRole are required')
        }

        // Get available folders for this role
        const folders = ROLE_FOLDERS[userRole] || ROLE_FOLDERS['minister']

        // Call OpenAI for classification
        const openai = new OpenAI({
            apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
        })

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Tu es un assistant IA spécialisé dans le classement de documents administratifs.
Ta tâche est d'analyser le contenu d'un courrier et de suggérer le dossier thématique le plus approprié.

Voici les dossiers disponibles pour ce rôle (${userRole}):
${folders.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Tu dois répondre UNIQUEMENT avec un JSON contenant:
- folder_index: le numéro du dossier (1-${folders.length})
- confidence: ton niveau de confiance (0.0-1.0)
- reasoning: une brève explication en français (max 100 caractères)

Exemple de réponse:
{"folder_index": 2, "confidence": 0.85, "reasoning": "Courrier d'un chef d'État étranger concernant un sommet"}
`
                },
                {
                    role: "user",
                    content: `Analyse ce courrier et suggère le dossier approprié:\n\n${ocrText}`
                }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        })

        const response = JSON.parse(completion.choices[0].message.content || '{}')
        const folderIndex = response.folder_index - 1 // Convert to 0-based

        if (folderIndex < 0 || folderIndex >= folders.length) {
            throw new Error('Invalid folder index returned by AI')
        }

        const suggestedFolderName = folders[folderIndex].split(' - ')[0].trim()

        // Find the actual folder ID in database
        const { data: folder } = await supabaseClient
            .from('document_folders')
            .select('id')
            .eq('service_role', userRole)
            .ilike('name', `%${suggestedFolderName}%`)
            .single()

        // Update document metadata with AI suggestion
        await supabaseClient
            .from('documents')
            .update({
                metadata: {
                    ai_suggestion: {
                        folder_id: folder?.id,
                        folder_name: suggestedFolderName,
                        confidence: response.confidence,
                        reasoning: response.reasoning,
                        classified_at: new Date().toISOString()
                    }
                }
            })
            .eq('id', documentId)

        return new Response(
            JSON.stringify({
                success: true,
                suggestion: {
                    folder_id: folder?.id,
                    folder_name: suggestedFolderName,
                    confidence: response.confidence,
                    reasoning: response.reasoning
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error) {
        console.error('Classification error:', error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            },
        )
    }
})
