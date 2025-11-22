import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisResult {
    sender_name: string;
    sender_organization: string;
    confidentiality_level: string;
    summary: string;
    sentiment: string;
    urgency_score: number;
    urgency_level: string;
    suggested_destination_role: string;
    suggested_folder: string;
    confidence_score: number;
    entities: string[];
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { mailId, analysisType } = await req.json() // analysisType: 'envelope' (Level 1) or 'content' (Level 2)

        if (!mailId) {
            throw new Error('Mail ID is required')
        }

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch mail metadata
        const { data: mail, error: mailError } = await supabaseClient
            .from('mails')
            .select('*')
            .eq('id', mailId)
            .single()

        if (mailError || !mail) {
            throw new Error('Mail not found')
        }

        console.log(`📧 Processing mail: ${mail.tracking_number} (${analysisType})`)

        // 2. Fetch attachment (scan)
        // Determine which attachment to analyze based on type
        const attachmentType = analysisType === 'envelope' ? 'envelope' : 'content'

        const { data: attachments, error: attachError } = await supabaseClient
            .from('mail_attachments')
            .select('*')
            .eq('mail_id', mailId)
            .eq('attachment_type', attachmentType)
            .limit(1)

        if (attachError || !attachments || attachments.length === 0) {
            throw new Error(`No ${attachmentType} attachment found for this mail`)
        }

        const attachment = attachments[0]

        // 3. Download file
        const { data: fileData, error: downloadError } = await supabaseClient
            .storage
            .from('mail-scans')
            .download(attachment.file_path)

        if (downloadError || !fileData) {
            throw new Error('Failed to download file from storage')
        }

        // 4. Perform OCR (Simulated or via Vision API)
        // For this implementation, we'll use GPT-4o Vision if available, or simulate text extraction
        // In a real scenario, we'd use Google Cloud Vision or similar as in document-ocr

        // For now, let's assume we extract text via a helper (reusing logic from document-ocr conceptually)
        const extractedText = await extractTextFromImage(fileData)

        let analysisResult: Partial<AnalysisResult> = {}

        // 5. Analyze based on type
        if (analysisType === 'envelope') {
            // Level 1: Envelope Analysis
            analysisResult = await analyzeEnvelopeWithGPT4(extractedText)

            // Update mail metadata
            await supabaseClient
                .from('mails')
                .update({
                    sender_name: analysisResult.sender_name,
                    sender_organization: analysisResult.sender_organization,
                    confidentiality_level: analysisResult.confidentiality_level,
                    envelope_ocr_text: extractedText,
                    status: 'processing'
                })
                .eq('id', mailId)

        } else {
            // Level 2 & 3: Content Analysis & Routing
            analysisResult = await analyzeContentWithGPT4(extractedText, mail)

            // Save to mail_ai_analysis
            await supabaseClient
                .from('mail_ai_analysis')
                .insert({
                    mail_id: mailId,
                    full_ocr_text: extractedText,
                    summary: analysisResult.summary,
                    sentiment: analysisResult.sentiment,
                    urgency_score: analysisResult.urgency_score,
                    suggested_destination_role: analysisResult.suggested_destination_role,
                    suggested_folder: analysisResult.suggested_folder,
                    confidence_score: analysisResult.confidence_score,
                    detected_entities: analysisResult.entities
                })

            // Update mail status
            await supabaseClient
                .from('mails')
                .update({
                    urgency: analysisResult.urgency_level, // Map score to enum
                    status: 'pending_validation'
                })
                .eq('id', mailId)
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `${analysisType} analysis completed`,
                data: analysisResult
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('❌ Error in mail-analysis:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})

// --- Helpers ---

async function extractTextFromImage(fileData: Blob): Promise<string> {
    // Reusing the logic from document-ocr (simplified for this file)
    // In production, this would call Google Cloud Vision or similar
    console.log('🖼️ Extracting text from image...')

    const GOOGLE_CLOUD_VISION_API_KEY = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')

    if (!GOOGLE_CLOUD_VISION_API_KEY) {
        console.warn('⚠️ No Vision API key, returning placeholder text')
        return "Texte extrait de l'image (Simulation: Expéditeur: Ministère de la Santé, Objet: Rapport Urgence Sanitaire)"
    }

    try {
        const arrayBuffer = await fileData.arrayBuffer()
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [{
                        image: { content: base64Image },
                        features: [{ type: 'TEXT_DETECTION' }],
                    }],
                }),
            }
        )

        const result = await response.json()
        return result.responses[0]?.fullTextAnnotation?.text || ''
    } catch (e) {
        console.error('OCR Error:', e)
        return "Erreur extraction OCR"
    }
}

async function analyzeEnvelopeWithGPT4(text: string): Promise<Partial<AnalysisResult>> {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    const systemPrompt = `Tu es un expert en tri de courrier présidentiel. Analyse le texte d'une enveloppe et extrais:
    - sender_name: Nom de l'expéditeur
    - sender_organization: Organisation/Ministère
    - confidentiality_level: 'public', 'restricted', 'secret' (défaut: 'public' si non mentionné)
    
    Réponds uniquement en JSON.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Texte enveloppe: ${text}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
        }),
    })

    const result = await response.json()
    return JSON.parse(result.choices[0].message.content)
}

async function analyzeContentWithGPT4(text: string, mailMetadata: any): Promise<Partial<AnalysisResult>> {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    const systemPrompt = `Tu es l'IA de gestion du courrier de la Présidence du Gabon.
    Analyse le contenu du courrier et les métadonnées pour:
    1. Résumer en 1 phrase.
    2. Déterminer le sentiment (request, complaint, neutral, positive).
    3. Scorer l'urgence (0-10).
    4. Suggérer le destinataire (role) parmi: 'president', 'dir_cabinet', 'sec_general', 'ministre'.
    5. Suggérer le dossier de classement (ex: 'Doléances', 'Diplomatie', 'Instructions').
    6. Extraire les entités (Personnes, Lieux).
    
    Contexte Enveloppe: Expéditeur=${mailMetadata.sender_name}, Org=${mailMetadata.sender_organization}.
    
    Réponds en JSON: {
        summary, sentiment, urgency_score, urgency_level (normal/high/critical),
        suggested_destination_role, suggested_folder, confidence_score (0-1),
        entities: { persons: [], places: [] }
    }`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Contenu du courrier: ${text.substring(0, 10000)}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
        }),
    })

    const result = await response.json()
    return JSON.parse(result.choices[0].message.content)
}