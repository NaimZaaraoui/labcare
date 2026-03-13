import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';
import { generateAnalysisPDF } from '@/lib/pdf-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { recipientEmail } = body;

    // Runtime check for API Key
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder_for_build') {
      return NextResponse.json(
        { error: 'Service d\'email non configuré sur ce serveur (Clé API manquante).' },
        { status: 500 }
      );
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Email du destinataire manquant' },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: { patient: true }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    // Generate PDF on the server using Puppeteer
    console.log(`Generating PDF for analysis ${id}...`);
    const pdfBuffer = await generateAnalysisPDF(id);
    
    const patientName = `${analysis.patientLastName} ${analysis.patientFirstName}`;
    
    // Send Email via Resend
    const { data, error } = await resend.emails.send({
      from: 'LabCare <onboarding@resend.dev>', // Change to your domain in production
      to: recipientEmail,
      subject: `Résultats d'Analyse - ${patientName} - N° ${analysis.orderNumber}`,
      html: `
        <div style="font-family: sans-serif; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
          <h2 style="color: #2563eb;">Bonjour ${patientName},</h2>
          <p>Veuillez trouver ci-joint vos résultats d'analyse médicale effectués le <strong>${analysis.creationDate.toLocaleDateString('fr-FR')}</strong>.</p>
          <p>Le rapport est disponible en format PDF ci-joint.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Ceci est un message automatique du laboratoire <strong>LabCare</strong>. Merci de ne pas y répondre directement.</p>
        </div>
      `,
      attachments: [
        {
          filename: `Rapport_${analysis.orderNumber}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
