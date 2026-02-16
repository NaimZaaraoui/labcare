import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { model, updates } = body; // model: 'category' | 'test', updates: { id: string, rank: number }[]

    if (!model || !updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const transaction = updates.map((update: { id: string, rank: number }) => {
      // @ts-ignore - Dynamic model access
      return prisma[model].update({
        where: { id: update.id },
        data: { rank: update.rank }
      });
    });

    await prisma.$transaction(transaction);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}
