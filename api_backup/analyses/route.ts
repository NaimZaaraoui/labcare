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
    
    const analysis = await prisma.analysis.create({
      data: {
        orderNumber,
        patientId: body.patientId,
        patientFirstName: body.patientFirstName || null,
        patientLastName: body.patientLastName || null,
        patientAge: body.patientAge ? parseInt(body.patientAge) : null,
        patientGender: body.patientGender || null,
        status: 'pending',
        results: {
          create: body.testsIds.map((testId: string) => ({
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