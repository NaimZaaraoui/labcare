import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import {
  createRecoveryBundle,
  getRecoveryBundleDirectory,
  listRecoveryBundles,
} from '@/lib/recovery-bundles';

export const runtime = 'nodejs';

export async function GET() {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  try {
    const items = await listRecoveryBundles();
    return NextResponse.json({
      recoveryDirectory: getRecoveryBundleDirectory(),
      items,
    });
  } catch (error) {
    console.error('Error listing recovery bundles:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des bundles de reprise.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });

  try {
    const bundle = await createRecoveryBundle();

    await createAuditLog({
      action: 'database.recovery_bundle_create',
      severity: 'CRITICAL',
      entity: 'recovery_bundle',
      entityId: bundle.fileName,
      details: {
        fileName: bundle.fileName,
        size: bundle.size,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      message: 'Bundle de reprise créé avec succès.',
      item: bundle,
    });
  } catch (error) {
    console.error('Error creating recovery bundle:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création du bundle de reprise.' },
      { status: 500 }
    );
  }
}
