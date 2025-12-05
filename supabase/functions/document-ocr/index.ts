import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { documentId } = await req.json()

        if (!documentId) {
            throw new Error('Document ID is required')
        }

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Récupérer les métadonnées du document
        const { data: document, error: docError } = await supabaseClient
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single()

        if (docError || !document) {
            throw new Error('Document not found')
        }

        console.log('📄 Processing document:', document.filename)

        // 2. Mettre à jour le statut à 'processing'
        await supabaseClient
            .from('documents')
            .update({ status: 'processing' })
            .eq('id', documentId)

        // 3. Télécharger le fichier depuis Storage
        const { data: fileData, error: downloadError } = await supabaseClient
            .storage
            .from('documents-presidentiels')
            .download(document.file_path)

        if (downloadError || !fileData) {
            throw new Error('Failed to download file from storage')
        }

        let extractedText = ''

        // 4. Extraction du texte selon le type de fichier
        if (document.file_type === 'application/pdf') {
            // Pour PDF: utiliser pdf-parse ou appeler un service externe
            extractedText = await extractTextFromPDF(fileData)
        } else if (document.file_type.startsWith('image/')) {
            // Pour images: utiliser Google Cloud Vision API ou Tesseract
            extractedText = await extractTextFromImage(fileData)
        } else if (document.file_type.includes('word') || document.file_type.includes('docx')) {
            // Pour Word/Docx: utiliser mammoth ou similar
            extractedText = await extractTextFromDocx(fileData)
        } else {
            throw new Error('Unsupported file type for OCR')
        }

        console.log('✅ Text extracted, length:', extractedText.length)

        // 5. Appeler GPT-4 pour l'analyse
        const analysis = await analyzeDocumentWithGPT4(extractedText, document.filename)

        // 6. Sauvegarder l'analyse
        const { error: analysisError } = await supabaseClient
            .from('document_analysis')
            .insert({
                document_id: documentId,
                extracted_text: extractedText,
                key_points: analysis.key_points,
                entities: analysis.entities,
                sentiment: analysis.sentiment,
                urgency_score: analysis.urgency_score,
                suggested_action: analysis.suggested_action,
                action_items: analysis.action_items,
            })

        if (analysisError) {
            throw analysisError
        }

        // 7. Créer des action items si nécessaire
        if (analysis.action_items && analysis.action_items.length > 0) {
            const actionItemsToInsert = analysis.action_items.map((item: any) => ({
                source_type: 'document',
                source_id: documentId,
                action_type: item.action_type || 'review',
                priority: item.priority || 3,
                description: item.description,
                assigned_to: document.user_id,
                due_date: item.due_date || null,
                ai_suggested: true,
            }))

            await supabaseClient
                .from('action_items')
                .insert(actionItemsToInsert)
        }

        // 8. Générer les embeddings pour recherche sémantique
        await generateEmbeddings(supabaseClient, documentId, extractedText)

        // 9. Mettre à jour le statut à 'analyzed'
        await supabaseClient
            .from('documents')
            .update({ status: 'analyzed' })
            .eq('id', documentId)

        console.log('✅ Document analysis completed')

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Document analyzed successfully',
                analysis: {
                    urgency_score: analysis.urgency_score,
                    sentiment: analysis.sentiment,
                    key_points: analysis.key_points,
                },
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('❌ Error in document-ocr:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})

// ==================== HELPER FUNCTIONS ====================

async function extractTextFromPDF(fileData: Blob): Promise<string> {
    // Option 1: Utiliser pdf-parse (nécessite l'installer)
    // Option 2: Appeler une API externe comme pdf.co ou iLovePDF
    // Pour l'instant, simulons avec un placeholder

    console.log('📄 Extracting text from PDF...')

    // TODO: Implémenter l'extraction réelle
    // Exemple avec pdf-parse:
    // import pdfParse from 'pdf-parse'
    // const dataBuffer = await fileData.arrayBuffer()
    // const pdfData = await pdfParse(Buffer.from(dataBuffer))
    // return pdfData.text

    // Placeholder pour développement
    return "Contenu du PDF extrait (TODO: implémenter pdf-parse ou API externe)"
}

async function extractTextFromImage(fileData: Blob): Promise<string> {
    // Option 1: Google Cloud Vision API
    // Option 2: Tesseract.js
    // Option 3: Azure Computer Vision

    console.log('🖼️ Extracting text from image with OCR...')

    const GOOGLE_CLOUD_VISION_API_KEY = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')

    if (!GOOGLE_CLOUD_VISION_API_KEY) {
        console.warn('⚠️ Google Cloud Vision API key not configured, using placeholder')
        return "Texte extrait de l'image (TODO: configurer Google Cloud Vision)"
    }

    // Convert blob to base64
    const arrayBuffer = await fileData.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Call Google Cloud Vision API
    const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    {
                        image: { content: base64Image },
                        features: [{ type: 'TEXT_DETECTION' }],
                    },
                ],
            }),
        }
    )

    const result = await response.json()
    const text = result.responses[0]?.fullTextAnnotation?.text || ''

    console.log('✅ OCR completed, extracted', text.length, 'characters')
    return text
}

async function extractTextFromDocx(fileData: Blob): Promise<string> {
    // Option: Utiliser mammoth.js ou docx library
    console.log('📝 Extracting text from DOCX...')

    // TODO: Implémenter avec mammoth ou similar
    // import mammoth from 'mammoth'
    // const arrayBuffer = await fileData.arrayBuffer()
    // const result = await mammoth.extractRawText({ arrayBuffer })
    // return result.value

    return "Contenu du DOCX extrait (TODO: implémenter mammoth.js)"
}

async function analyzeDocumentWithGPT4(text: string, filename: string): Promise<any> {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured')
    }

    const systemPrompt = `Tu es un analyste de documents pour la Présidence de la République Gabonaise.
Analyse le document suivant et fournis une réponse structurée en JSON avec:
- key_points: tableau de 3-5 points clés (chacun avec topic, importance 1-5, summary)
- entities: {persons: [], places: [], dates: [], organizations: []}
- sentiment: 'positive', 'neutral' ou 'negative'
- urgency_score: note de 0 à 10 (10 = extrêmement urgent)
- suggested_action: phrase décrivant l'action recommandée
- action_items: tableau d'actions concrètes avec {action_type, priority 1-5, description, due_date (ISO string ou null)}

Sois concis et précis.`

    const userPrompt = `Document: ${filename}\n\nContenu:\n${text.substring(0, 8000)}`

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
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        }),
    })

    const result = await response.json()
    const analysisText = result.choices[0].message.content

    console.log('🤖 GPT-4 analysis:', analysisText)

    return JSON.parse(analysisText)
}

async function generateEmbeddings(supabaseClient: any, documentId: string, text: string) {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
        console.warn('⚠️ OpenAI API key not set, skipping embeddings generation')
        return
    }

    // Découper le texte en chunks de 1000 caractères max
    const chunkSize = 1000
    const chunks = []
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize))
    }

    console.log(`📊 Generating embeddings for ${chunks.length} chunks...`)

    for (let i = 0; i < chunks.length; i++) {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-ada-002',
                input: chunks[i],
            }),
        })

        const result = await response.json()
        const embedding = result.data[0].embedding

        await supabaseClient
            .from('document_embeddings')
            .insert({
                document_id: documentId,
                chunk_index: i,
                chunk_text: chunks[i],
                embedding,
            })
    }

    console.log('✅ Embeddings generated')
}
