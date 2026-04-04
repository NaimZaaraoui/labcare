import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { importRecoveryBundle } from '@/lib/recovery-bundles';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier de bundle fourni.' }, { status: 400 });
    }

    if (!file.name.endsWith('.tar.gz')) {
      return NextResponse.json({ error: 'Le fichier doit être au format .tar.gz.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const imported = await importRecoveryBundle(file.name, Buffer.from(bytes));

    await createAuditLog({
      action: 'database.recovery_bundle_import',
      severity: 'CRITICAL',
      entity: 'recovery_bundle',
      entityId: imported.fileName,
      details: {
        importedFileName: file.name,
        storedAs: imported.fileName,
        size: imported.size,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      message: 'Bundle importé avec succès.',
      item: imported,
    });
  } catch (error) {
    console.error('Error importing recovery bundle:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l’import du bundle de reprise.' },
      { status: 500 }
    );
  }
}
