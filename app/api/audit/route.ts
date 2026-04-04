import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { Prisma } from '@/app/generated/prisma';

export async function GET(request: Request) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const query = searchParams.get('query');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const severity = searchParams.get('severity');

    const whereClause: Prisma.AuditLogWhereInput = {};

    if (query) {
      whereClause.OR = [
        { userName: { contains: query } },
        { action: { contains: query } },
        { entity: { contains: query } },
        { entityId: { contains: query } },
      ];
    }

    if (severity && severity !== 'ALL') {
      whereClause.severity = severity;
    }

    if (start || end) {
      whereClause.createdAt = {};
      if (start) whereClause.createdAt.gte = new Date(start);
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDate;
      }
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    return NextResponse.json({
      logs,
      totalCount,
      pageCount: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Error fetching audit logs' },
      { status: 500 }
    );
  }
}
