import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const total = await prisma.analysis.count();
    
    const totalToday = await prisma.analysis.count({
      where: {
        createdAt: { gte: startOfDay }
      }
    });
    
    const pending = await prisma.analysis.count({ 
      where: { 
        status: 'pending',
        createdAt: { gte: startOfDay }
      } 
    });
    
    const completed = await prisma.analysis.count({
      where: {
        status: { in: ['completed', 'validated_bio'] },
        updatedAt: { gte: startOfDay }
      }
    });
    
    const urgent = await prisma.analysis.count({
      where: {
        results: { some: { abnormal: true } },
        updatedAt: { gte: startOfDay }
      }
    });

    // --- Pipeline Granulaire ---
    const purePending = await prisma.analysis.count({
      where: { 
        status: 'pending',
        results: { none: {} },
        createdAt: { gte: startOfDay }
      }
    });

    const inProgress = await prisma.analysis.count({
      where: {
        status: { in: ['in_progress', 'validated_tech'] },
        createdAt: { gte: startOfDay }
      }
    });

    // --- TAT (Turnaround Time) du jour ---
    const completedToday = await prisma.analysis.findMany({
      where: {
        status: { in: ['completed', 'validated_bio'] },
        updatedAt: { gte: startOfDay }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    let avgTat = 0;
    if (completedToday.length > 0) {
      const totalTat = completedToday.reduce((acc, curr) => {
        const diff = curr.updatedAt.getTime() - curr.createdAt.getTime();
        return acc + diff;
      }, 0);
      avgTat = Math.round((totalTat / completedToday.length) / (1000 * 60)); // en minutes
    }


    // ── Trend Data Calculation (Last 12 Months) ──
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const trendRaw = await prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as count
      FROM analyses
      WHERE status IN ('completed', 'validated_bio')
        AND createdAt >= ${twelveMonthsAgo.toISOString()}
      GROUP BY month
      ORDER BY month ASC
    ` as { month: string, count: bigint }[];

    // Format trend to ensure we return a consistent array (even if months are missing)
    const rawTrendMap = new Map(trendRaw.map(t => [t.month, Number(t.count)]));
    const trendLabels: string[] = [];
    const trendData: number[] = [];
    const frenchMonths = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trendLabels.push(frenchMonths[d.getMonth()]);
      trendData.push(rawTrendMap.get(mKey) || 0);
    }

    return NextResponse.json({
      total,
      totalToday,
      pending,        // Total pending
      purePending,   // Not started
      inProgress,    // Started
      completed,
      urgent,
      tat: avgTat,
      trend: {
        labels: trendLabels,
        data: trendData
      },
      revenue: 0 
    });


  } catch (error) {
    console.error('Erreur stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
