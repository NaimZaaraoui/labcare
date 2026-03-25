// src/app/api/analyses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notifyUsers, getUserIdsByRoles } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const status = searchParams.get('status');
    const includeResults = searchParams.get('includeResults') === 'true';
    const category = searchParams.get('category');
    
    const where: any = {};

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
            category: category
          }
        }
      };
    }

    const analyses = await prisma.analysis.findMany({
      where,
      include: {
        patient: true,
        ...(includeResults && {
          results: {
            include: {
              test: {
                include: {
                  categoryRel: true
                }
              }
            }
          }
        })
      },
      orderBy: { creationDate: 'desc' }
    });
    
    return NextResponse.json(analyses);
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
        
        const test = await (prisma.test as any).findUnique({
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
      testsIds 
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
           address: patientAddress
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

    return NextResponse.json(analysis, { status: 201 });
  } catch (error: any) {
    console.error('Erreur POST /api/analyses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'analyse', details: error.message },
      { status: 500 }
    );
  }
}