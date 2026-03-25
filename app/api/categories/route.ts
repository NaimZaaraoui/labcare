import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { rank: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { tests: true }
        }
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erreur GET /api/categories:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    );
  }
}
