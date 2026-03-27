'use client';

import { Geist } from "next/font/google";
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { RapportImpression } from '@/components/print/RapportImpression';
import { Analysis } from '@/lib/types';

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export default function ExportPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [reportSettings, setReportSettings] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const printToken = searchParams.get('printToken') || '';
    const tokenHeaders = printToken ? { 'x-internal-print-token': printToken } : undefined;
    const patchHeaders = {
      'Content-Type': 'application/json',
      ...(tokenHeaders || {}),
    };

    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analyses/${id}`, {
          headers: tokenHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
          
          // Mark as printed if not already marked
          if (!data.printedAt) {
            await fetch(`/api/analyses/${id}`, {
              method: 'PATCH',
              headers: patchHeaders,
              body: JSON.stringify({ printedAt: new Date().toISOString() })
            });
          }

          setTimeout(() => setReady(true), 2000);
        } else {
          console.error('API Error: analyses fetch returned', res.status);
          setTimeout(() => setReady(true), 1000);
        }
      } catch (error) {
        console.error('Error fetching analysis for export:', error);
        setTimeout(() => setReady(true), 1000);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', {
          headers: tokenHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setReportSettings(data);
        }
      } catch (e) {
        console.error('Error fetching settings for export:', e);
      }
    };

    if (id) {
      fetchAnalysis();
      fetchSettings();
    }
  }, [id, searchParams]);

  if (!analysis) return null;

  const resultsRecord: Record<string, string> = {};
  analysis.results?.forEach(r => {
    resultsRecord[r.id] = r.value || '';
  });

  return (
    <div className={`${geist.variable} font-sans`}>
      <style>{`
        *, body, html {
          font-family: var(--font-geist), ui-sans-serif, system-ui, sans-serif !important;
        }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0 !important; padding: 0 !important; background: white !important; }
      `}</style>

      <RapportImpression
        analysis={analysis}
        results={resultsRecord}
        selectedResultIds={[]}
        settings={reportSettings}
      />

      {ready && <div id="render-complete" style={{ display: 'none' }} />}
    </div>
  );
}
