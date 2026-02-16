// src/app/api/analyses/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        results: {
          include: {
            test: true
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
    
    return NextResponse.json(analysis);
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
    const { id } = await params;
    const body = await request.json();
    
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
    const { id } = await params;
    const body = await request.json();
    
    const analysis = await prisma.analysis.update({
      where: { id },
      data: {
        status: body.status || undefined
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
    
    // Supprimer tous les résultats associés (cascade)
    await prisma.result.deleteMany({
      where: { analysisId: id }
    });
    
    // Supprimer l'analyse
    await prisma.analysis.delete({
      where: { id }
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