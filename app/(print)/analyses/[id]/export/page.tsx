'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { RapportImpression } from '@/components/print/RapportImpression';
import { Analysis } from '@/lib/types';

export default function ExportPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [reportSettings, setReportSettings] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const autoPrint = searchParams.get('autoprint') === '1';
  const closeAfterPrint = searchParams.get('closeAfterPrint') === '1';
  const selectedResultIds = (searchParams.get('selected') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

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

          setTimeout(() => setReady(true), 500);
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

  useEffect(() => {
    if (!ready || !autoPrint) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 150);

    if (closeAfterPrint) {
      const previous = window.onafterprint;
      window.onafterprint = () => {
        previous?.call(window, new Event('afterprint'));
        window.close();
      };

      return () => {
        window.clearTimeout(timer);
        window.onafterprint = previous;
      };
    }

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoPrint, closeAfterPrint, ready]);

  if (!analysis) return null;

  const resultsRecord: Record<string, string> = {};
  analysis.results?.forEach(r => {
    resultsRecord[r.id] = r.value || '';
  });

  return (
    <div className="font-sans">
      <style>{`
        *, body, html {
          font-family: "Segoe UI", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif !important;
        }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0 !important; padding: 0 !important; background: white !important; }
      `}</style>

      <RapportImpression
        analysis={analysis}
        results={resultsRecord}
        selectedResultIds={selectedResultIds}
        settings={reportSettings}
      />

      {ready && <div id="render-complete" style={{ display: 'none' }} />}
    </div>
  );
}
