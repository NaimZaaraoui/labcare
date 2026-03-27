import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

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

    if (analysis.status === 'completed' || analysis.status === 'validated_bio') {
      return NextResponse.json(
        { error: 'Analyse validée: modification des résultats interdite' },
        { status: 409 }
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
      data: {
        updatedAt: new Date(),
        ...(analysis.status === 'pending' ? { status: 'in_progress' } : {})
      }
    });

    await createAuditLog({
      action: 'analysis.results_save',
      severity: 'INFO',
      entity: 'analysis',
      entityId: id,
      details: {
        updatedResults: Object.keys(results).length,
        hadNotes: Boolean(notes),
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'MEDECIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { id } = await params;
    const body = await request.json();
    const { testsIds } = body;

    if (!Array.isArray(testsIds)) {
      return NextResponse.json({ error: 'testsIds invalide' }, { status: 400 });
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: { results: true }
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analyse non trouvée' }, { status: 404 });
    }

    if (analysis.status === 'completed' || analysis.status === 'validated_bio') {
      return NextResponse.json(
        { error: 'Analyse validée: modification des tests interdite' },
        { status: 409 }
      );
    }

    const resolveTests = async (ids: string[]): Promise<string[]> => {
      const allIds = new Set<string>();

      const fetchChildren = async (testId: string) => {
        if (allIds.has(testId)) return;
        allIds.add(testId);
        const test = await (prisma.test as any).findUnique({
          where: { id: testId },
          include: { children: true }
        });
        if (test?.children) {
          for (const child of test.children) {
            await fetchChildren(child.id);
          }
        }
      };

      for (const testId of ids) {
        await fetchChildren(testId);
      }

      return Array.from(allIds);
    };

    const resolvedTestsIds = await resolveTests(testsIds);
    const currentTestIds = new Set(analysis.results.map(r => r.testId));
    const targetTestIds = new Set(resolvedTestsIds);

    const toCreate = resolvedTestsIds.filter(testId => !currentTestIds.has(testId));
    const toDelete = analysis.results.filter(r => !targetTestIds.has(r.testId)).map(r => r.id);

    await prisma.$transaction([
      ...(toDelete.length > 0
        ? [prisma.result.deleteMany({ where: { id: { in: toDelete }, analysisId: id } })]
        : []),
      ...(toCreate.length > 0
        ? [prisma.result.createMany({ data: toCreate.map(testId => ({ analysisId: id, testId })) })]
        : []),
      prisma.analysis.update({
        where: { id },
        data: { updatedAt: new Date() }
      })
    ]);

    await createAuditLog({
      action: 'analysis.tests_update',
      severity: 'WARN',
      entity: 'analysis',
      entityId: id,
      details: {
        added: toCreate.length,
        removed: toDelete.length,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, added: toCreate.length, removed: toDelete.length });
  } catch (error) {
    console.error('Erreur PATCH results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des tests', details: errorMessage },
      { status: 500 }
    );
  }
}
