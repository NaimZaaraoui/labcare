// src/app/api/tests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      orderBy: { code: 'asc' }
    });
    
    return NextResponse.json(tests);
  } catch (error) {
    console.error('Erreur GET /api/tests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tests', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const test = await prisma.test.create({
      data: {
        code: body.code.toUpperCase(),
        name: body.name,
        unit: body.unit || null,
        minValue: body.minValue ? parseFloat(body.minValue) : null,
        maxValue: body.maxValue ? parseFloat(body.maxValue) : null,
      }
    });
    
    return NextResponse.json(test, { status: 201 });
  } catch (error: any) {
    console.error('Erreur POST /api/tests:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un test avec ce code existe déjà' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du test' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID du test manquant' },
        { status: 400 }
      );
    }

    const test = await prisma.test.update({
      where: { id },
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        unit: data.unit || null,
        minValue: data.resultType === 'numeric' && data.minValue ? parseFloat(data.minValue) : null,
        maxValue: data.resultType === 'numeric' && data.maxValue ? parseFloat(data.maxValue) : null,
        resultType: data.resultType || 'numeric',
        category: data.category || null,
      }
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error('Erreur PUT /api/tests:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du test' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID manquant' },
        { status: 400 }
      );
    }
    
    await prisma.test.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/tests:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}