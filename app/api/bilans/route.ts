
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bilans = await prisma.bilan.findMany({
      include: {
        tests: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(bilans);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching bilans' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, testIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const bilan = await prisma.bilan.create({
      data: {
        name,
        code,
        tests: {
          connect: testIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        tests: true,
      },
    });

    return NextResponse.json(bilan);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating bilan' },
      { status: 500 }
    );
  }
}
