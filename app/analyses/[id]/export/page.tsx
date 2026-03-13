'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RapportImpression } from '@/components/print/RapportImpression';
import { Analysis } from '@/lib/types';

export default function ExportPage() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analyses/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
        }
      } catch (error) {
        console.error('Error fetching analysis for export:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAnalysis();
  }, [id]);

  if (loading) return null;
  if (!analysis) return <div>Analyse non trouvée</div>;

  // Convert results array to the Record format RapportImpression expects if necessary
  // (RapportImpression actually expects results mapping or uses analysis.results)
  // Let's check RapportImpression props again: analysis, results (Record), selectedResultIds
  
  const resultsRecord: Record<string, string> = {};
  analysis.results?.forEach(r => {
    resultsRecord[r.testId] = r.value || '';
  });

  return (
    <div className="bg-white min-h-screen">
      <RapportImpression 
        analysis={analysis} 
        results={resultsRecord} 
        selectedResultIds={[]} 
      />
      
      {/* Meta tag to signal Puppeteer that rendering is finished */}
      <div id="render-complete" style={{ display: 'none' }}></div>
    </div>
  );
}
