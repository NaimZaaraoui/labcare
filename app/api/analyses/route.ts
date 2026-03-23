// src/app/api/analyses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    const where = patientId ? { patientId } : {};
    
    const analyses = await prisma.analysis.findMany({
      where,
      include: {
        patient: true,
        results: {
          include: {
            test: true
          }
        }
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

    // Determine Patient UUID
    let finalPatientId = selectedPatientId;

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
    
    const analysis = await prisma.analysis.create({
      data: {
        orderNumber,
        dailyId: patientId,
        patientId: finalPatientId,
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
    
    return NextResponse.json(analysis, { status: 201 });
  } catch (error: any) {
    console.error('Erreur POST /api/analyses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'analyse', details: error.message },
      { status: 500 }
    );
  }
}