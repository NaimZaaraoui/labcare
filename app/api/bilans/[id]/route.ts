
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, testIds } = body;

    const bilan = await prisma.bilan.update({
      where: { id },
      data: {
        name,
        code,
        tests: {
          set: [], // Clear existing relations
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
      { error: 'Error updating bilan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bilan = await prisma.bilan.delete({
      where: { id },
    });

    return NextResponse.json(bilan);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting bilan' },
      { status: 500 }
    );
  }
}
