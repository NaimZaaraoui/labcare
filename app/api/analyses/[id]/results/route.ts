import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { results, notes } = body; // results: Record<resultId, value>, notes: Record<resultId, text>

    if (!results || typeof results !== 'object') {
      return NextResponse.json(
        { error: 'Données manquantes ou format invalide' },
        { status: 400 }
      );
    }

    // Valider que l'analyse existe
    const analysis = await prisma.analysis.findUnique({
      where: { id }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    // Utilisation d'une transaction pour garantir l'intégrité des données
    const updates = Object.entries(results)
      .map(([resultId, value]) => 
        prisma.result.update({
          where: { id: resultId },
          data: { 
            value: value !== undefined && value !== null ? String(value).trim() || null : undefined,
            notes: notes && notes[resultId] !== undefined ? notes[resultId] : undefined,
            updatedAt: new Date()
          }
        })
      );

    await prisma.$transaction(updates);

    // Mettre à jour la date de modification de l'analyse
    await prisma.analysis.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PUT results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des résultats', details: errorMessage },
      { status: 500 }
    );
  }
}
