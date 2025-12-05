import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsPDF } from "https://esm.sh/jspdf@2.5.2"
import QRCode from "https://esm.sh/qrcode@1.5.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReceiptRequest {
    documentId: string
    senderName: string
    senderOrganization?: string
}

serve(async (req) => {
    // Handle CORS pre flight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get request body
        const { documentId, senderName, senderOrganization }: ReceiptRequest = await req.json()

        if (!documentId || !senderName) {
            throw new Error('documentId and senderName are required')
        }

        // Get document details
        const { data: document, error: docError } = await supabaseClient
            .from('documents')
            .select('document_number, deposited_at')
            .eq('id', documentId)
            .single()

        if (docError || !document) {
            throw new Error('Document not found')
        }

        // Generate receipt number
        const { data: receiptNumberData } = await supabaseClient
            .rpc('generate_receipt_number')

        const receiptNumber = receiptNumberData as string

        // Generate QR code tracking URL
        const trackingUrl = `https://presidence.ga/track/${receiptNumber}`
        const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })

        // Create PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a5' // Smaller format for receipt
        })

        // Colors
        const primaryColor = [26, 87, 181] // RGB for #1A57B5 (Gabon blue)
        const textColor = [51, 51, 51]
        const lightGray = [200, 200, 200]

        // Header - Republic emblem area
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(0, 0, 148, 30, 'F')

        // Title
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text('RÉCÉPISSÉ', 74, 12, { align: 'center' })

        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text('PRÉSIDENCE DE LA RÉPUBLIQUE', 74, 19, { align: 'center' })
        doc.text('Service Réception', 74, 25, { align: 'center' })

        // Reset text color
        doc.setTextColor(textColor[0], textColor[1], textColor[2])

        // Receipt details box
        let yPos = 40

        // Receipt number (prominent)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(`N° ${receiptNumber}`, 74, yPos, { align: 'center' })
        yPos += 10

        // Horizontal line
        doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
        doc.setLineWidth(0.5)
        doc.line(15, yPos, 133, yPos)
        yPos += 8

        // Date and time
        const depositDate = new Date(document.deposited_at)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.text('Date de dépôt:', 20, yPos)
        doc.setFont('helvetica', 'bold')
        doc.text(depositDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }), 55, yPos)
        yPos += 7

        doc.setFont('helvetica', 'normal')
        doc.text('Heure:', 20, yPos)
        doc.setFont('helvetica', 'bold')
        doc.text(depositDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        }), 55, yPos)
        yPos += 10

        // Separator
        doc.line(15, yPos, 133, yPos)
        yPos += 8

        // Sender information
        doc.setFont('helvetica', 'normal')
        doc.text('Expéditeur:', 20, yPos)
        doc.setFont('helvetica', 'bold')
        doc.text(senderName, 55, yPos)
        yPos += 7

        if (senderOrganization) {
            doc.setFont('helvetica', 'normal')
            doc.text('Organisation:', 20, yPos)
            doc.setFont('helvetica', 'bold')
            doc.text(senderOrganization, 55, yPos)
            yPos += 7
        }

        yPos += 3

        // Document number
        doc.setFont('helvetica', 'normal')
        doc.text('Référence document:', 20, yPos)
        doc.setFont('helvetica', 'bold')
        doc.text(document.document_number, 55, yPos)
        yPos += 12

        // QR Code section
        doc.addImage(qrCodeDataUrl, 'PNG', 54, yPos, 40, 40)
        yPos += 45

        // Tracking instruction
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(100, 100, 100)
        doc.text('Scannez ce code QR pour suivre votre courrier', 74, yPos, { align: 'center' })
        yPos += 5
        doc.text(`ou visitez: ${trackingUrl}`, 74, yPos, { align: 'center' })

        // Footer
        yPos = 195 // Bottom of A5 page
        doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
        doc.line(15, yPos - 5, 133, yPos - 5)

        doc.setFontSize(8)
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.setFont('helvetica', 'normal')
        doc.text('Ce récépissé atteste du dépôt de votre courrier.', 74, yPos, { align: 'center' })
        doc.text('Conservez-le précieusement. Il vous sera demandé en cas de réclamation.', 74, yPos + 4, { align: 'center' })

        // Generate PDF as buffer
        const pdfBuffer = doc.output('arraybuffer')
        const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })

        // Upload to Supabase Storage
        const fileName = `receipts/${receiptNumber}.pdf`
        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('documents')
            .upload(fileName, pdfBlob, {
                contentType: 'application/pdf',
                upsert: false
            })

        if (uploadError) {
            throw uploadError
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient
            .storage
            .from('documents')
            .getPublicUrl(fileName)

        // Insert receipt record
        const { data: receipt, error: receiptError } = await supabaseClient
            .from('receipts')
            .insert({
                receipt_number: receiptNumber,
                document_id: documentId,
                pdf_url: publicUrl,
                qr_code_data: trackingUrl,
                issued_at: new Date().toISOString(),
                issued_by: null // Will be set by RLS/trigger if needed
            })
            .select()
            .single()

        if (receiptError) {
            throw receiptError
        }

        return new Response(
            JSON.stringify({
                success: true,
                receipt: {
                    receipt_number: receiptNumber,
                    pdf_url: publicUrl,
                    tracking_url: trackingUrl
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error) {
        console.error('Receipt generation error:', error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            },
        )
    }
})
