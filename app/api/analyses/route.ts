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
    
    // Générer numéro d'ordre unique
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.analysis.count({
      where: {
        creationDate: {
          gte: new Date(today.setHours(0, 0, 0, 0))
        }
      }
    });
    const orderNumber = `${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
    
    // Générer numéro de quittance (receiptNumber)
    const totalCount = await prisma.analysis.count();
    const receiptNumber = `Q${(totalCount + 1).toString().padStart(6, '0')}`;
    
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
      patientBirthDate, // YYYY-MM-DD
      patientGender, 
      patientPhone,
      patientEmail,
      patientAddress,
      receiptNumber: receiptNumberFromBody,
      testsIds 
    } = body;

    // Determine Patient UUID
    let finalPatientId = selectedPatientId;

    // If no existing patient selected, create one
    if (!finalPatientId) {
       const newPatient = await prisma.patient.create({
         data: {
           firstName: patientFirstName,
           lastName: patientLastName,
           gender: patientGender,
           birthDate: patientBirthDate ? new Date(patientBirthDate) : null,
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
        dailyId: patientId, // The "Paillasse" number
        
        patientId: finalPatientId, // Link to Patient Entity
        
        // Keep legacy snapshot fields (calculate age if possible or leave null)
        patientFirstName,
        patientLastName,
        patientAge: patientBirthDate ? new Date().getFullYear() - new Date(patientBirthDate).getFullYear() : null,
        patientGender,
        receiptNumber: receiptNumberFromBody || receiptNumber, // Use provided receiptNumber or generated default
        status: 'pending', // Default status
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
  } catch (error) {
    console.error('Erreur POST /api/analyses:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'analyse' },
      { status: 500 }
    );
  }
}