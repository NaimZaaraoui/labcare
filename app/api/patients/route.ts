
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { phoneNumber: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (start || end) {
      whereClause.createdAt = {};
      if (start) {
        whereClause.createdAt.gte = new Date(start);
      }
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDate;
      }
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[API] Patient search for "${query}" returned ${patients.length} results`);

    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, birthDate, gender, address, phoneNumber } = body;

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        address,
        phoneNumber
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating patient' },
      { status: 500 }
    );
  }
}
