import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const total = await prisma.analysis.count();
    
    const pending = await prisma.analysis.count({ 
      where: { status: 'pending' } 
    });
    
    const completed = await prisma.analysis.count({ 
      where: { status: 'completed' } 
    });
    
    // On considère comme "Urgentes" les analyses qui ont des résultats anormaux
    const urgent = await prisma.analysis.count({
      where: {
        results: {
          some: {
            abnormal: true
          }
        }
      }
    });

    return NextResponse.json({
      total,
      pending,
      completed,
      urgent,
      revenue: 0 // Placeholder, souvent calculé différemment ou géré côté client
    });
  } catch (error) {
    console.error('Erreur stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
