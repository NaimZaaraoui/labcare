// src/app/api/results/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, value, unit, notes, abnormal } = body;
    
    const result = await prisma.result.update({
      where: { id },
      data: {
        value: value || null,
        unit: unit || null,
        notes: notes || null,
        abnormal: abnormal || false
      }
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur PUT /api/results:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du résultat' },
      { status: 500 }
    );
  }
}