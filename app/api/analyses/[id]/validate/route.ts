import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validation finale de l'analyse
    const analysis = await prisma.analysis.update({
      where: { id },
      data: { 
        status: 'completed',
        updatedAt: new Date()
      }
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Erreur POST validate:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation de l\'analyse' },
      { status: 500 }
    );
  }
}
