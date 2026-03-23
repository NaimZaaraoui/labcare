import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const type = body?.type as 'tech' | 'bio' | undefined;

    if (!type || (type !== 'tech' && type !== 'bio')) {
      return NextResponse.json({ error: 'Type de validation invalide' }, { status: 400 });
    }

    const analysis = await prisma.analysis.findUnique({ where: { id } });
    if (!analysis) {
      return NextResponse.json({ error: 'Analyse non trouvée' }, { status: 404 });
    }

    const role = (session?.user as any)?.role || '';
    const userId = (session?.user as any)?.id || null;
    const userName = session?.user?.name || 'Utilisateur';

    if (type === 'tech') {
      if (!['TECHNICIEN', 'ADMIN'].includes(role)) {
        return NextResponse.json({ error: 'Rôle insuffisant' }, { status: 403 });
      }
      if (analysis.status !== 'in_progress') {
        return NextResponse.json(
          { error: 'Validation technique impossible: saisissez et sauvegardez d’abord les résultats (statut "En analyse").' },
          { status: 400 }
        );
      }

      const updated = await prisma.analysis.update({
        where: { id },
        data: {
          status: 'validated_tech',
          validatedTechAt: new Date(),
          validatedTechBy: userId,
          validatedTechName: userName,
          updatedAt: new Date()
        },
        include: {
          results: { include: { test: true } },
          patient: true
        }
      });

      return NextResponse.json(updated);
    }

    if (!['MEDECIN', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Rôle insuffisant' }, { status: 403 });
    }
    if (analysis.status !== 'validated_tech') {
      return NextResponse.json(
        { error: 'Validation biologique impossible: la validation technique doit être effectuée en premier.' },
        { status: 400 }
      );
    }

    const updated = await prisma.analysis.update({
      where: { id },
      data: {
        status: 'validated_bio',
        validatedBioAt: new Date(),
        validatedBioBy: userId,
        validatedBioName: userName,
        updatedAt: new Date()
      },
      include: {
        results: { include: { test: true } },
        patient: true
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur PATCH validate:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation' },
      { status: 500 }
    );
  }
}
