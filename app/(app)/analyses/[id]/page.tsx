// src/app/analyses/[id]/page.tsx

import { ResultatsForm } from '@/components/analyses/ResultatsForm';

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto w-full max-w-[1640px]">
        <ResultatsForm analysisId={id} />
      </div>
    </div>
  );
}
