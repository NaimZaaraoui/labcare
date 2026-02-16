import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { results } = body; // Record<resultId, value>

    if (!results) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Utilisation d'une transaction pour garantir l'intégrité des données
    const updates = Object.entries(results).map(([resultId, value]) => 
      prisma.result.update({
        where: { id: resultId },
        data: { 
          value: value as string,
          // On pourrait ajouter logic pour marquer abnormal ici si on avait les bornes
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
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des résultats' },
      { status: 500 }
    );
  }
}
