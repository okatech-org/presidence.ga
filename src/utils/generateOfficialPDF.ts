import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Flag pour s'assurer qu'on initialise qu'une seule fois
let fontsInitialized = false;

// Fonction pour initialiser les fonts de manière lazy
function initializeFonts() {
    if (!fontsInitialized && pdfFonts && (pdfFonts as any).pdfMake) {
        (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
        fontsInitialized = true;
    }
}

interface DocumentData {
    type: 'lettre' | 'decret' | 'rapport' | 'circulaire' | 'note' | 'nomination';
    recipient: string;
    subject: string;
    content_points?: string[];
    signature_authority?: string;
    reference?: string;
    date?: string;
}

/**
 * Génère un document officiel PDF  pour la Présidence Gabonaise
 */
export async function generateOfficialPDF(data: DocumentData): Promise<Blob> {
    // Initialiser les fonts au premier appel
    initializeFonts();

    const currentDate = data.date || new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // En-tête officiel
    const header = {
        columns: [
            {
                width: '*',
                stack: [
                    { text: 'RÉPUBLIQUE GABONAISE', style: 'header', alignment: 'center' },
                    { text: 'Unité - Travail - Justice', style: 'subheader', alignment: 'center', margin: [0, 2, 0, 10] },
                    { text: '________', alignment: 'center', margin: [0, 0, 0, 5] },
                    { text: 'PRÉSIDENCE DE LA RÉPUBLIQUE', style: 'institution', alignment: 'center' },
                ]
            }
        ],
        margin: [0, 20, 0, 30]
    };

    // Pied de page
    const footer = (currentPage: number, pageCount: number) => {
        return {
            columns: [
                { text: `Avenue Président Omar Bongo Ondimba - BP 546 - Libreville - Gabon`, style: 'footer', alignment: 'center' },
            ],
            margin: [40, 10, 40, 20]
        };
    };

    let documentDefinition: any = {
        pageSize: 'A4',
        pageMargins: [60, 140, 60, 60],
        header: header,
        footer: footer,
        content: [],
        styles: {
            header: {
                fontSize: 14,
                bold: true,
                color: '#1e3a8a'
            },
            subheader: {
                fontSize: 10,
                italics: true,
                color: '#64748b'
            },
            institution: {
                fontSize: 12,
                bold: true,
                color: '#0f172a'
            },
            documentType: {
                fontSize: 16,
                bold: true,
                alignment: 'center',
                margin: [0, 20, 0, 20],
                decoration: 'underline'
            },
            reference: {
                fontSize: 10,
                italics: true,
                color: '#64748b',
                margin: [0, 0, 0, 15]
            },
            metaInfo: {
                fontSize: 11,
                margin: [0, 5, 0, 5]
            },
            bodyText: {
                fontSize: 11,
                lineHeight: 1.5,
                alignment: 'justify',
                margin: [0, 10, 0, 10]
            },
            listItem: {
                fontSize: 11,
                margin: [0, 5, 0, 5]
            },
            signature: {
                fontSize: 11,
                bold: true,
                margin: [0, 30, 0, 5]
            },
            footer: {
                fontSize: 8,
                color: '#94a3b8'
            }
        }
    };

    // Construction selon le type de document
    switch (data.type) {
        case 'lettre':
            documentDefinition.content = [
                { text: 'LETTRE D\'INSTRUCTION', style: 'documentType' },
                { text: data.reference || `Réf: PR/CAB/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, style: 'reference' },
                { text: `Libreville, le ${currentDate}`, style: 'metaInfo', alignment: 'right' },
                { text: '\n' },
                { text: `Le Président de la République`, style: 'metaInfo', bold: true },
                { text: `à`, style: 'metaInfo', margin: [0, 5, 0, 5] },
                { text: data.recipient, style: 'metaInfo', bold: true },
                { text: '\n' },
                { text: `Objet : ${data.subject}`, style: 'metaInfo', bold: true },
                { text: '\n' },
                {
                    text: data.content_points && data.content_points.length > 0
                        ? `J'ai l'honneur de vous transmettre les instructions suivantes :`
                        : `J'ai l'honneur de vous adresser cette correspondance concernant ${data.subject}.`,
                    style: 'bodyText'
                },
                ...(data.content_points || []).map((point, index) => ({
                    text: `${index + 1}. ${point}`,
                    style: 'listItem',
                    margin: [20, 5, 0, 5]
                })),
                { text: '\n' },
                { text: `Je vous prie d'agréer, ${data.recipient}, l'expression de ma haute considération.`, style: 'bodyText' },
                { text: '\n\n' },
                { text: data.signature_authority || 'Le Président de la République', style: 'signature', alignment: 'right' },
            ];
            break;

        case 'decret':
            documentDefinition.content = [
                { text: 'DÉCRET', style: 'documentType' },
                { text: data.reference || `N° ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}/PR/${new Date().getFullYear()}`, style: 'reference', alignment: 'center' },
                { text: currentDate, style: 'metaInfo', alignment: 'center' },
                { text: '\n' },
                { text: data.subject.toUpperCase(), style: 'metaInfo', bold: true, alignment: 'center' },
                { text: '\n' },
                { text: 'LE PRÉSIDENT DE LA RÉPUBLIQUE,', style: 'bodyText', bold: true },
                { text: '\n' },
                { text: 'Vu la Constitution ;', style: 'listItem', margin: [20, 0, 0, 5] },
                { text: 'Vu les textes en vigueur ;', style: 'listItem', margin: [20, 0, 0, 5] },
                { text: '\n' },
                { text: 'DÉCRÈTE :', style: 'bodyText', bold: true, alignment: 'center' },
                { text: '\n' },
                ...(data.content_points || []).map((point, index) => ({
                    text: `Article ${index + 1}. ${point}`,
                    style: 'listItem',
                    margin: [0, 8, 0, 8],
                    bold: true
                })),
                { text: '\n\n' },
                { text: 'Fait à Libreville, le ' + currentDate, style: 'metaInfo' },
                { text: '\n' },
                { text: data.signature_authority || 'Le Président de la République', style: 'signature', alignment: 'center' },
            ];
            break;

        case 'rapport':
            documentDefinition.content = [
                { text: 'RAPPORT', style: 'documentType' },
                { text: data.subject.toUpperCase(), style: 'metaInfo', bold: true, alignment: 'center' },
                { text: '\n' },
                { text: `Date : ${currentDate}`, style: 'metaInfo' },
                { text: `Destinataire : ${data.recipient}`, style: 'metaInfo' },
                { text: '\n' },
                { text: 'SYNTHÈSE EXÉCUTIVE', style: 'bodyText', bold: true },
                { text: '\n' },
                ...(data.content_points || []).map((point, index) => ({
                    text: point,
                    style: 'bodyText',
                    margin: [0, 10, 0, 10]
                })),
                { text: '\n\n' },
                { text: 'CONCLUSION', style: 'bodyText', bold: true },
                { text: '\n' },
                { text: `Ce rapport a été établi pour l'information de ${data.recipient}.`, style: 'bodyText' },
                { text: '\n\n' },
                { text: data.signature_authority || 'La Présidence de la République', style: 'signature' },
            ];
            break;

        case 'circulaire':
            documentDefinition.content = [
                { text: 'CIRCULAIRE', style: 'documentType' },
                { text: data.reference || `N° ${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}/PR/CIRC/${new Date().getFullYear()}`, style: 'reference' },
                { text: currentDate, style: 'metaInfo', alignment: 'right' },
                { text: '\n' },
                { text: `Objet : ${data.subject}`, style: 'metaInfo', bold: true },
                { text: `Destinataires : ${data.recipient}`, style: 'metaInfo' },
                { text: '\n' },
                {
                    text: data.content_points && data.content_points.length > 0
                        ? `Il est porté à votre connaissance les dispositions suivantes :`
                        : `La présente circulaire a pour objet de ${data.subject}.`,
                    style: 'bodyText'
                },
                { text: '\n' },
                ...(data.content_points || []).map((point, index) => ({
                    text: `${index + 1}. ${point}`,
                    style: 'listItem',
                    margin: [20, 5, 0, 5]
                })),
                { text: '\n\n' },
                { text: `Ces dispositions entrent en vigueur à compter de la date de signature de la présente circulaire.`, style: 'bodyText' },
                { text: '\n\n' },
                { text: data.signature_authority || 'Le Président de la République', style: 'signature', alignment: 'right' },
            ];
            break;

        case 'note':
            documentDefinition.content = [
                { text: 'NOTE À L\'ATTENTION DE', style: 'documentType' },
                { text: data.recipient.toUpperCase(), style: 'metaInfo', bold: true, alignment: 'center' },
                { text: '\n' },
                { text: `Objet : ${data.subject}`, style: 'metaInfo', bold: true },
                { text: `Date : ${currentDate}`, style: 'metaInfo' },
                { text: '\n' },
                ...(data.content_points || []).map((point) => ({
                    text: point,
                    style: 'bodyText'
                })),
                { text: '\n\n' },
                { text: data.signature_authority || 'Cabinet de la Présidence', style: 'signature' },
            ];
            break;

        case 'nomination':
            documentDefinition.content = [
                { text: 'DÉCRET DE NOMINATION', style: 'documentType' },
                { text: data.reference || `N° ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}/PR/NOM/${new Date().getFullYear()}`, style: 'reference', alignment: 'center' },
                { text: currentDate, style: 'metaInfo', alignment: 'center' },
                { text: '\n' },
                { text: 'LE PRÉSIDENT DE LA RÉPUBLIQUE,', style: 'bodyText', bold: true },
                { text: '\n' },
                { text: 'Vu la Constitution ;', style: 'listItem', margin: [20, 0, 0, 5] },
                { text: '\n' },
                { text: 'DÉCRÈTE :', style: 'bodyText', bold: true, alignment: 'center' },
                { text: '\n' },
                { text: `Article 1. ${data.recipient} est nommé(e) ${data.subject}.`, style: 'bodyText', bold: true },
                { text: '\n' },
                ...(data.content_points || []).map((point, index) => ({
                    text: `Article ${index + 2}. ${point}`,
                    style: 'listItem',
                    margin: [0, 8, 0, 8]
                })),
                { text: '\n\n' },
                { text: 'Fait à Libreville, le ' + currentDate, style: 'metaInfo' },
                { text: '\n' },
                { text: data.signature_authority || 'Le Président de la République', style: 'signature', alignment: 'center' },
            ];
            break;
    }

    // Générer le PDF et retourner le Blob
    return new Promise((resolve, reject) => {
        const pdfDocGenerator = pdfMake.createPdf(documentDefinition);

        pdfDocGenerator.getBlob((blob) => {
            resolve(blob);
        });
    });
}

/**
 * Génère un PDF et retourne une URL de téléchargement
 */
export async function generateOfficialPDFWithURL(data: DocumentData): Promise<{ blob: Blob; url: string; filename: string }> {
    const blob = await generateOfficialPDF(data);
    const url = URL.createObjectURL(blob);

    // Générer un nom de fichier descriptif
    const filename = `${data.type}_${data.recipient.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;

    return { blob, url, filename };
}
