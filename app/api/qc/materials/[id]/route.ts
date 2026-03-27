import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;

    const { id } = await params;
    const body = await request.json();
    const meta = getRequestMeta({ headers: request.headers });

    if (String(body?.action || '') !== 'toggle-active') {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const existing = await prisma.qcMaterial.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Matériel QC introuvable' }, { status: 404 });
    }

    const updated = await prisma.qcMaterial.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await createAuditLog({
      action: updated.isActive ? 'qc.material_reactivate' : 'qc.material_deactivate',
      severity: 'WARN',
      entity: 'qc_material',
      entityId: updated.id,
      details: { name: updated.name, isActive: updated.isActive },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur PATCH /api/qc/materials/[id]:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du matériel QC' }, { status: 500 });
  }
}
