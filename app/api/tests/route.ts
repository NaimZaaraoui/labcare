// src/app/api/tests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole, requireAuthUser } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeGrouped = searchParams.get('includeGrouped') !== 'false';
    
    const whereClause: { isGroup?: boolean; categoryId?: string } = {};
    
    if (!includeGrouped) {
      whereClause.isGroup = false;
    }
    
    if (category) {
      whereClause.categoryId = category;
    }

    const tests = await prisma.test.findMany({
      where: whereClause,
      orderBy: [
        { rank: 'asc' },
        { name: 'asc' }
      ],
      include: { 
        children: includeGrouped,
        categoryRel: true,
        _count: {
          select: {
            inventoryRules: true,
          },
        },
      }
    });
    
    return NextResponse.json(tests);
  } catch (error) {
    console.error('Erreur GET /api/tests:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tests', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    
    let categoryId = body.categoryId || null;
    if (!categoryId && body.category) {
      const cat = await prisma.category.findFirst({
        where: { name: body.category }
      });
      categoryId = cat?.id || null;
    }

    const test = await prisma.test.create({
        data: {
          code: body.code.toUpperCase(),
          name: body.name,
          unit: body.unit || null,
          minValue: body.minValue ? parseFloat(body.minValue) : null,
          maxValue: body.maxValue ? parseFloat(body.maxValue) : null,
          minValueM: body.minValueM ? parseFloat(body.minValueM) : null,
          maxValueM: body.maxValueM ? parseFloat(body.maxValueM) : null,
          minValueF: body.minValueF ? parseFloat(body.minValueF) : null,
          maxValueF: body.maxValueF ? parseFloat(body.maxValueF) : null,
          decimals: body.decimals || 1,
          resultType: body.resultType || 'numeric',
          categoryId: categoryId,
          parentId: body.parentId || null,
          options: body.options || null,
          isGroup: !!body.isGroup,
          sampleType: body.sampleType || null,
          price: body.price ? parseFloat(body.price) : 0,
        }

    });

    await createAuditLog({
      action: 'test.create',
      severity: 'WARN',
      entity: 'test',
      entityId: test.id,
      details: { code: test.code, name: test.name },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    
    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/tests:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un test avec ce code existe déjà' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du test' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID du test manquant' },
        { status: 400 }
      );
    }

    let categoryId = data.categoryId || null;
    if (!categoryId && data.category) {
      const cat = await prisma.category.findFirst({
        where: { name: data.category }
      });
      categoryId = cat?.id || null;
    }

    const test = await prisma.test.update({
      where: { id },
        data: {
          code: data.code.toUpperCase(),
          name: data.name,
          unit: data.unit || null,
          minValue: data.resultType === 'numeric' && data.minValue ? parseFloat(data.minValue) : null,
          maxValue: data.resultType === 'numeric' && data.maxValue ? parseFloat(data.maxValue) : null,          
          minValueM: data.resultType === 'numeric' && data.minValueM ? parseFloat(data.minValueM) : null,
          maxValueM: data.resultType === 'numeric' && data.maxValueM ? parseFloat(data.maxValueM) : null,
          minValueF: data.resultType === 'numeric' && data.minValueF ? parseFloat(data.minValueF) : null,
          maxValueF: data.resultType === 'numeric' && data.maxValueF ? parseFloat(data.maxValueF) : null,          
          decimals: data.resultType === 'numeric' ? data.decimals : 1,
          resultType: data.resultType || 'numeric',
          categoryId: categoryId,
          parentId: data.parentId || null,
          options: data.options || null,
          isGroup: !!data.isGroup,
          sampleType: data.sampleType || null,
          price: data.price ? parseFloat(data.price) : 0,
        }

    });

    await createAuditLog({
      action: 'test.update',
      severity: 'WARN',
      entity: 'test',
      entityId: test.id,
      details: { code: test.code, name: test.name },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error('Erreur PUT /api/tests:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du test' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID manquant' },
        { status: 400 }
      );
    }
    
    const existing = await prisma.test.findUnique({
      where: { id },
      select: { id: true, code: true, name: true },
    });

    await prisma.test.delete({
      where: { id }
    });

    await createAuditLog({
      action: 'test.delete',
      severity: 'CRITICAL',
      entity: 'test',
      entityId: id,
      details: existing,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/tests:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
