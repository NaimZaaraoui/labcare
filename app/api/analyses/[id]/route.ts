// src/app/api/analyses/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notifyUsers, getUserIdsByRoles } from '@/lib/notifications';
import { hasValidInternalPrintToken, requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isInternalPrint = hasValidInternalPrintToken(request);
    if (!isInternalPrint) {
      const guard = await requireAuthUser();
      if (!guard.ok) return guard.error;
    }

    const { id } = await params;
    
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        patient: true,
        results: {
          include: {
            test: {
              include: { 
                children: true,
                parent: true,
                categoryRel: true
              }
            }
          }
        }
      }
    });
    
    if (!analysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    // --- Fetch Previous Results ---
    // Look for the most recent COMPLETED analysis for the same patient, BEFORE the current one
    const previousAnalysis = await prisma.analysis.findFirst({
      where: {
        patientId: analysis.patientId,
        status: { in: ['completed', 'validated_bio'] },
        creationDate: {
          lt: analysis.creationDate
        }
      },
      orderBy: {
        creationDate: 'desc'
      },
      include: {
        results: true
      }
    });

    const previousResultsMap: Record<string, string> = {};
    if (previousAnalysis) {
      previousAnalysis.results.forEach((r) => {
        if (r.value) {
          previousResultsMap[r.testId] = r.value;
        }
      });
    }

    // Attach previous results to the response
    const analysisWithHistory = {
      ...analysis,
      previousResults: previousResultsMap
    };
    
    return NextResponse.json(analysisWithHistory);
  } catch (error) {
    console.error('Erreur GET /api/analyses/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isInternalPrint = hasValidInternalPrintToken(request);
    if (!isInternalPrint) {
      const guard = await requireAuthUser();
      if (!guard.ok) return guard.error;
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.analysis.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    if (existing.status === 'completed' || existing.status === 'validated_bio') {
      return NextResponse.json(
        { error: 'Analyse validée: modification interdite' },
        { status: 409 }
      );
    }
    
    const analysis = await prisma.analysis.update({
      where: { id },
      data: {
        status: body.status
      },
      include: {
        results: {
          include: {
            test: true
          }
        }
      }
    });
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Erreur PUT /api/analyses/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });
    
    const parseGender = (value: unknown) => {
      if (value !== 'M' && value !== 'F') return undefined;
      return value;
    };

    const parseNumber = (value: unknown) => {
      if (value === null) return null;
      if (value === undefined || value === '') return undefined;
      const n = Number(value);
      return Number.isNaN(n) ? undefined : n;
    };

    const existing = await prisma.analysis.findUnique({
      where: { id },
      select: {
        status: true,
        totalPrice: true,
        amountPaid: true,
        paymentStatus: true,
        paymentMethod: true,
        paidAt: true,
        orderNumber: true,
        patientFirstName: true,
        patientLastName: true,
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      );
    }

    const isPrintOnlyUpdate =
      body.printedAt !== undefined &&
      body.status === undefined &&
      body.dailyId === undefined &&
      body.receiptNumber === undefined &&
      body.patientFirstName === undefined &&
      body.patientLastName === undefined &&
      body.patientAge === undefined &&
      body.patientGender === undefined &&
      body.provenance === undefined &&
      body.medecinPrescripteur === undefined &&
      body.isUrgent === undefined &&
      body.globalNote === undefined &&
      body.globalNotePlacement === undefined &&
      body.amountPaid === undefined &&
      body.paymentMethod === undefined;

    const isPaymentOnlyUpdate =
      (body.amountPaid !== undefined || body.paymentMethod !== undefined) &&
      body.status === undefined &&
      body.printedAt === undefined &&
      body.dailyId === undefined &&
      body.receiptNumber === undefined &&
      body.patientFirstName === undefined &&
      body.patientLastName === undefined &&
      body.patientAge === undefined &&
      body.patientGender === undefined &&
      body.provenance === undefined &&
      body.medecinPrescripteur === undefined &&
      body.isUrgent === undefined &&
      body.globalNote === undefined &&
      body.globalNotePlacement === undefined;

    if ((existing.status === 'completed' || existing.status === 'validated_bio') && !isPrintOnlyUpdate && !isPaymentOnlyUpdate) {
      return NextResponse.json(
        { error: 'Analyse validée: modification interdite' },
        { status: 409 }
      );
    }

    const parsedAmountPaid = parseNumber(body.amountPaid);
    const nextAmountPaid =
      parsedAmountPaid !== undefined
        ? Math.max(0, Number(parsedAmountPaid ?? 0))
        : existing.amountPaid ?? 0;
    const totalPrice = existing.totalPrice ?? 0;
    const nextPaymentStatus =
      nextAmountPaid <= 0
        ? 'UNPAID'
        : nextAmountPaid >= totalPrice
          ? 'PAID'
          : 'PARTIAL';
    const nextPaymentMethod =
      body.paymentMethod !== undefined ? (body.paymentMethod || null) : existing.paymentMethod;
    const nextPaidAt =
      parsedAmountPaid !== undefined
        ? nextPaymentStatus === 'PAID'
          ? existing.paidAt || new Date()
          : null
        : undefined;

    const analysis = await prisma.analysis.update({
      where: { id },
      data: {
        status: body.status || undefined,
        printedAt: body.printedAt !== undefined ? (body.printedAt ? new Date(body.printedAt) : null) : undefined,
        dailyId: body.dailyId !== undefined ? (body.dailyId || null) : undefined,
        receiptNumber: body.receiptNumber !== undefined ? (body.receiptNumber || null) : undefined,
        patientFirstName: body.patientFirstName !== undefined ? (body.patientFirstName || null) : undefined,
        patientLastName: body.patientLastName !== undefined ? (body.patientLastName || null) : undefined,
        patientAge: parseNumber(body.patientAge),
        patientGender: parseGender(body.patientGender),
        provenance: body.provenance !== undefined ? (body.provenance || null) : undefined,
        medecinPrescripteur: body.medecinPrescripteur !== undefined ? (body.medecinPrescripteur || null) : undefined,
        isUrgent: body.isUrgent !== undefined ? Boolean(body.isUrgent) : undefined,
        globalNote: body.globalNote !== undefined ? (body.globalNote?.trim() || null) : undefined,
        globalNotePlacement: body.globalNotePlacement !== undefined && ['all', 'first', 'last'].includes(body.globalNotePlacement)
          ? body.globalNotePlacement
          : undefined,
        amountPaid: parsedAmountPaid !== undefined ? nextAmountPaid : undefined,
        paymentStatus: parsedAmountPaid !== undefined ? nextPaymentStatus : undefined,
        paymentMethod: body.paymentMethod !== undefined ? nextPaymentMethod : undefined,
        paidAt: nextPaidAt
      },
      include: {
        results: {
          include: {
            test: true
          }
        }
      }
    });

    if (parsedAmountPaid !== undefined || body.paymentMethod !== undefined) {
      await createAuditLog({
        action: 'analysis.payment_update',
        severity: 'WARN',
        entity: 'analysis',
        entityId: id,
        details: {
          orderNumber: existing.orderNumber,
          patient: `${existing.patientLastName || ''} ${existing.patientFirstName || ''}`.trim(),
          previousAmountPaid: existing.amountPaid ?? 0,
          nextAmountPaid,
          paymentStatus: nextPaymentStatus,
          paymentMethod: nextPaymentMethod,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }
    
    // Notifications
    try {
      if (body.status === 'in_progress' && existing.status === 'pending') {
        const session = await auth();
        const medecinAdminIds = await getUserIdsByRoles(
          ['MEDECIN', 'ADMIN'],
          session?.user?.id
        );
        await notifyUsers({
          userIds: medecinAdminIds,
          type: 'results_entered',
          title: 'Résultats en cours de saisie',
          message: `Les résultats pour ${analysis.patientLastName} ${analysis.patientFirstName} (ORD-${analysis.orderNumber}) sont en cours de saisie.`,
          analysisId: id,
        });
      }
    } catch (e) {
      console.error('Error in status update notifications:', e);
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Erreur PATCH /api/analyses/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { id } = await params;
    
    // Vérifier que l'analyse existe
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
        { error: 'Analyse validée: suppression interdite' },
        { status: 409 }
      );
    }
    
    // Supprimer tous les résultats associés (cascade)
    await prisma.result.deleteMany({
      where: { analysisId: id }
    });
    
    // Supprimer l'analyse
    await prisma.analysis.delete({
      where: { id }
    });

    await createAuditLog({
      action: 'analysis.delete',
      severity: 'CRITICAL',
      entity: 'analysis',
      entityId: id,
      details: {
        orderNumber: analysis.orderNumber,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    
    return NextResponse.json(
      { message: 'Analyse supprimée avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur DELETE /api/analyses/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
