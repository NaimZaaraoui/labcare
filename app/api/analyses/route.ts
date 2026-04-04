// src/app/api/analyses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/app/generated/prisma';
import {prisma} from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notifyUsers, getUserIdsByRoles } from '@/lib/notifications';
import { requireAnyRole, requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const status = searchParams.get('status');
    const includeResults = searchParams.get('includeResults') === 'true';
    const category = searchParams.get('category');
    
    const where: Prisma.AnalysisWhereInput = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (start || end) {
      where.creationDate = {};
      if (start) {
        where.creationDate.gte = new Date(start);
      }
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        where.creationDate.lte = endDate;
      }
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.results = {
        some: {
          test: {
            categoryRel: {
              name: category,
            }
          }
        }
      };
    }

    const analyses = await prisma.analysis.findMany({
      where,
      include: {
        patient: true,
        results: includeResults ? {
          include: {
            test: {
              include: {
                categoryRel: true
              }
            }
          }
        } : {
          select: {
            id: true,
            testId: true,
            test: {
              select: {
                parentId: true,
                isGroup: true,
              }
            }
          }
        }
      },
      orderBy: { creationDate: 'desc' }
    });

    const normalizedAnalyses = analyses.map((analysis) => {
      const testsCount = (analysis.results || []).filter(
        (result) => !result.test?.parentId
      ).length;

      return {
        ...analysis,
        testsCount,
      };
    });

    return NextResponse.json(normalizedAnalyses);
  } catch (error) {
    console.error('Erreur GET /api/analyses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analyses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    
    // Générer numéro d'ordre unique (Robuste: cherche le max existant du jour)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastAnalysisToday = await prisma.analysis.findFirst({
      where: {
        orderNumber: {
          startsWith: dateStr
        }
      },
      orderBy: {
        orderNumber: 'desc'
      }
    });

    let nextOrderNum = 1;
    if (lastAnalysisToday) {
      const lastPart = lastAnalysisToday.orderNumber.split('-')[1];
      nextOrderNum = parseInt(lastPart, 10) + 1;
    }
    const orderNumber = `${dateStr}-${nextOrderNum.toString().padStart(4, '0')}`;
    
    // Générer numéro de quittance (receiptNumber) - Robuste: cherche le max numérique
    const lastAnalysisAny = await prisma.analysis.findFirst({
      where: {
        receiptNumber: {
          startsWith: 'Q'
        }
      },
      orderBy: {
        receiptNumber: 'desc'
      }
    });

    let nextReceiptNum = 1;
    if (lastAnalysisAny && lastAnalysisAny.receiptNumber) {
      const match = lastAnalysisAny.receiptNumber.match(/Q(\d+)/);
      if (match) {
        nextReceiptNum = parseInt(match[1], 10) + 1;
      }
    }
    const receiptNumber = `Q${nextReceiptNum.toString().padStart(6, '0')}`;
    
    // Fonction récursive pour récupérer tous les tests enfants (panels)
    const resolveTests = async (ids: string[]): Promise<string[]> => {
      const allIds = new Set<string>();
      
      const fetchChildren = async (id: string) => {
        if (allIds.has(id)) return;
        allIds.add(id);
        
        const test = await prisma.test.findUnique({
          where: { id },
          include: { children: true }
        });
        
        if (test?.children) {
          for (const child of test.children) {
            await fetchChildren(child.id);
          }
        }
      };

      for (const id of ids) {
        await fetchChildren(id);
      }
      return Array.from(allIds);
    };

    const { 
      dailyId,
      patientId, 
      selectedPatientId,
      patientFirstName, 
      patientLastName, 
      patientBirthDate,
      patientGender, 
      patientPhone,
      patientEmail,
      patientAddress,
      provenance,
      medecinPrescripteur,
      isUrgent,
      globalNote,
      globalNotePlacement,
      receiptNumber: receiptNumberFromBody,
      testsIds,
      insuranceProvider,
      insuranceNumber,
      insuranceCoverage,
    } = body;

    // Determine Patient UUID and Daily ID (handling naming inconsistencies)
    let finalPatientId = selectedPatientId || (typeof patientId === 'string' && patientId.includes('-') ? patientId : null);
    const finalDailyId = dailyId || (typeof patientId === 'string' && !patientId.includes('-') ? patientId : patientId);

    // If no existing patient selected, create one
    const parseDate = (d: string | null | undefined) => {
      if (!d) return null;
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date;
    };

    const birthDateObj = parseDate(patientBirthDate);
    const calculatedAge = birthDateObj ? new Date().getFullYear() - birthDateObj.getFullYear() : null;

    // Use a transaction or separate catch for patient creation
    if (!finalPatientId) {
       const newPatient = await prisma.patient.create({
         data: {
           firstName: patientFirstName,
           lastName: patientLastName,
           gender: patientGender,
           birthDate: birthDateObj,
           phoneNumber: patientPhone,
           email: patientEmail,
           address: patientAddress,
           insuranceProvider: insuranceProvider || null,
           insuranceNumber: insuranceNumber || null,
         }
       });
       finalPatientId = newPatient.id;
    }
    
    const resolvedTestsIds = await resolveTests(testsIds);
    
    // Calculate total price based on resolved tests
    const testsData = await prisma.test.findMany({
      where: { id: { in: resolvedTestsIds } },
      select: { price: true }
    });
    const totalPrice = testsData.reduce((sum, t) => sum + (t.price || 0), 0);

    const coveragePct = typeof insuranceCoverage === 'number' && insuranceCoverage > 0 ? insuranceCoverage : 0;
    const insuranceShare = coveragePct > 0 ? Math.round((totalPrice * coveragePct / 100) * 100) / 100 : 0;
    const patientShare = Math.round((totalPrice - insuranceShare) * 100) / 100;
    
    const analysis = await prisma.analysis.create({
      data: {
        orderNumber,
        dailyId: String(finalDailyId),
        patientId: finalPatientId,
        totalPrice: totalPrice,
        patientFirstName,
        patientLastName,
        patientAge: calculatedAge,
        patientGender,
        receiptNumber: receiptNumberFromBody || receiptNumber,
        provenance: provenance || null,
        medecinPrescripteur: medecinPrescripteur || null,
        isUrgent: Boolean(isUrgent),
        globalNote: globalNote?.trim() || null,
        globalNotePlacement: ['all', 'first', 'last'].includes(globalNotePlacement) ? globalNotePlacement : 'all',
        status: 'pending',
        insuranceProvider: insuranceProvider || null,
        insuranceCoverage: coveragePct > 0 ? coveragePct : null,
        insuranceShare,
        patientShare,
        results: {
          create: resolvedTestsIds.map((testId: string) => ({
            testId,
          }))
        }
      },
      include: {
        results: {
          include: {
            test: true
          }
        }
      }
    });
    
    // Notifications
    try {
      const session = await auth();
      const creatorId = session?.user?.id || '';

      // Notify all technicians and admins (excluding the creator)
      const techAdminIds = await getUserIdsByRoles(
        ['TECHNICIEN', 'ADMIN'], 
        creatorId
      );

      await notifyUsers({
        userIds: techAdminIds,
        type: 'new_analysis',
        title: 'Nouvelle analyse',
        message: `Nouvelle analyse pour ${analysis.patientLastName} ${analysis.patientFirstName} — ORD-${analysis.orderNumber}`,
        analysisId: analysis.id,
      });

      // If urgent: notify ALL active users immediately
      if (analysis.isUrgent) {
        const allUserIds = await getUserIdsByRoles(
          ['ADMIN', 'TECHNICIEN', 'MEDECIN', 'RECEPTIONNISTE'],
          creatorId
        );
        await notifyUsers({
          userIds: allUserIds,
          type: 'urgent',
          title: 'URGENT — Analyse prioritaire',
          message: `Analyse urgente créée pour ${analysis.patientLastName} ${analysis.patientFirstName} — ORD-${analysis.orderNumber}`,
          analysisId: analysis.id,
        });
      }
    } catch (e) {
      console.error('Error in analysis notifications:', e);
    }

    await createAuditLog({
      action: 'analysis.create',
      severity: analysis.isUrgent ? 'WARN' : 'INFO',
      entity: 'analysis',
      entityId: analysis.id,
      details: {
        orderNumber: analysis.orderNumber,
        patient: `${analysis.patientLastName || ''} ${analysis.patientFirstName || ''}`.trim(),
        totalPrice: analysis.totalPrice,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(analysis, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Erreur POST /api/analyses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'analyse', details: errorMessage },
      { status: 500 }
    );
  }
}
