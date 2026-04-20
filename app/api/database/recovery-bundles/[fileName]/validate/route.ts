import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';
import { getRecoveryBundleByName, validateRecoveryBundleFile } from '@/lib/recovery-bundles';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ fileName: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const guard = await requireAnyRole(['ADMIN']);
  if (!guard.ok) return guard.error;

  const meta = getRequestMeta({ headers: request.headers });
  const { fileName } = await context.params;

  const bundle = await getRecoveryBundleByName(fileName);
  if (!bundle) {
    return NextResponse.json({ error: 'Bundle de reprise introuvable.' }, { status: 404 });
  }

  const validation = await validateRecoveryBundleFile(bundle.absolutePath);

  await createAuditLog({
    action: 'database.recovery_bundle_test',
    severity: validation.valid ? 'INFO' : 'CRITICAL',
    entity: 'recovery_bundle',
    entityId: bundle.fileName,
    details: {
      fileName: bundle.fileName,
      validation,
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({
    fileName: bundle.fileName,
    validation,
  });
}
