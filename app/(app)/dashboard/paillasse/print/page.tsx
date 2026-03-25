import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { notFound } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ date?: string; category?: string }>;
}

async function getPaillasseData(date: string, category?: string) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const whereClause: any = {
    creationDate: {
      gte: startDate,
      lte: endDate
    },
    status: {
      in: ['pending', 'validated_tech', 'in_progress']
    }
  };

  const analyses = await prisma.analysis.findMany({
    where: whereClause,
    include: {
      results: {
        include: {
          test: {
            include: {
              categoryRel: true
            }
          }
        },
        orderBy: {
          test: {
            rank: 'asc'
          }
        }
      }
    },
    orderBy: [
      { isUrgent: 'desc' },
      { creationDate: 'asc' }
    ]
  });

  let filteredAnalyses = analyses;
  
  if (category && category !== 'all') {
    filteredAnalyses = analyses.map(a => ({
      ...a,
      results: a.results.filter(r => 
        r.test?.categoryId === category || 
        r.test?.category === category
      )
    })).filter(a => a.results.length > 0);
  }

  const summary = filteredAnalyses.reduce((acc: Record<string, { count: number; total: number }>, analysis) => {
    analysis.results.forEach(r => {
      const catName = r.test?.category || r.test?.categoryRel?.name || 'Non classé';
      if (!acc[catName]) {
        acc[catName] = { count: 0, total: r.test?.price || 0 };
      }
      acc[catName].count++;
      acc[catName].total += r.test?.price || 0;
    });
    return acc;
  }, {});

  return {
    analyses: filteredAnalyses,
    summary,
    date,
    totalAnalyses: filteredAnalyses.length,
    totalResults: filteredAnalyses.reduce((sum, a) => sum + a.results.length, 0)
  };
}

export default async function PaillassePrintPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const date = params.date || format(new Date(), 'yyyy-MM-dd');
  const category = params.category;
  
  const data = await getPaillasseData(date, category);
  
  if (!data.analyses.length) {
    return notFound();
  }

  return (
    <html>
      <head>
        <title>Fiche de Paillasse - {format(new Date(date), 'dd/MM/yyyy', { locale: fr })}</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1e293b;
          }
          
          .page {
            padding: 20mm 15mm;
            max-width: 210mm;
            margin: 0 auto;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          
          .header-left h1 {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
            margin-bottom: 4px;
          }
          
          .header-left p {
            font-size: 10px;
            color: #64748b;
          }
          
          .header-right {
            text-align: right;
          }
          
          .date-box {
            background: #f1f5f9;
            padding: 8px 12px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 14px;
          }
          
          .stats {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
          }
          
          .stat {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 6px 10px;
            border-radius: 6px;
            font-weight: 600;
          }
          
          .stat span {
            color: #64748b;
            font-weight: 400;
            font-size: 9px;
            text-transform: uppercase;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          
          th {
            background: #1e293b;
            color: white;
            padding: 8px 6px;
            text-align: left;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          th:first-child { border-radius: 6px 0 0 0; }
          th:last-child { border-radius: 0 6px 0 0; }
          
          td {
            padding: 6px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          
          tr:nth-child(even) {
            background: #f8fafc;
          }
          
          tr.urgent {
            background: #fef2f2 !important;
          }
          
          tr.urgent td:first-child {
            border-left: 3px solid #dc2626;
          }
          
          .patient-cell {
            font-weight: 600;
          }
          
          .patient-meta {
            font-size: 8px;
            color: #64748b;
            font-weight: 400;
          }
          
          .test-name {
            font-weight: 500;
          }
          
          .test-code {
            font-size: 8px;
            color: #94a3b8;
            font-family: monospace;
          }
          
          .result-box {
            width: 100%;
            height: 24px;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
            background: white;
          }
          
          .summary {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            page-break-inside: avoid;
          }
          
          .summary h3 {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
          }
          
          .summary-item {
            background: white;
            padding: 8px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          
          .summary-item .name {
            font-size: 9px;
            color: #64748b;
            margin-bottom: 2px;
          }
          
          .summary-item .count {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
          }
          
          .summary-item .total {
            font-size: 9px;
            color: #64748b;
          }
          
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            color: #94a3b8;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .page {
              padding: 10mm;
            }
            
            .result-box {
              border: 1px solid #000;
            }
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
        `}</style>
      </head>
      <body>
        <div className="page">
          <div className="header">
            <div className="header-left">
              <h1>Fiche de Paillasse</h1>
              <p>Centre de Santé de Services de Base - Laboratoire</p>
            </div>
            <div className="header-right">
              <div className="date-box">
                {format(new Date(date), 'EEEE dd MMMM yyyy', { locale: fr })}
              </div>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <span>Analyses</span> {data.totalAnalyses}
            </div>
            <div className="stat">
              <span>Tests</span> {data.totalResults}
            </div>
            <div className="stat">
              <span>Catégories</span> {Object.keys(data.summary).length}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style={{width: '25px'}}>#</th>
                <th style={{width: '60px'}}>ID Paill.</th>
                <th style={{width: '100px'}}>Patient</th>
                <th style={{width: '40px'}}>Âge/S</th>
                <th>Tests demandés</th>
                <th style={{width: '80px'}}>Résultat</th>
                <th style={{width: '40px'}}>Unité</th>
                <th style={{width: '70px'}}>Référence</th>
              </tr>
            </thead>
            <tbody>
              {data.analyses.map((analysis, idx) => (
                <>
                  {analysis.results.map((result, rIdx) => (
                    <tr key={result.id} className={analysis.isUrgent ? 'urgent' : ''}>
                      {rIdx === 0 && (
                        <>
                          <td rowSpan={analysis.results.length} className="patient-cell">{idx + 1}</td>
                          <td rowSpan={analysis.results.length}>
                            <strong>{analysis.dailyId || '-'}</strong>
                            {analysis.isUrgent && <span style={{color: '#dc2626', fontSize: '8px', display: 'block'}}>⚠ URGENT</span>}
                          </td>
                          <td rowSpan={analysis.results.length}>
                            <div>{analysis.patientFirstName} {analysis.patientLastName}</div>
                            <div className="patient-meta">{analysis.orderNumber}</div>
                          </td>
                          <td rowSpan={analysis.results.length}>
                            {analysis.patientAge || '?'}/{analysis.patientGender === 'M' ? 'H' : 'F'}
                          </td>
                        </>
                      )}
                      <td>
                        <div className="test-name">{result.test?.name || 'Test'}</div>
                        <div className="test-code">{result.test?.code}</div>
                      </td>
                      <td><div className="result-box"></div></td>
                      <td>{result.test?.unit || '-'}</td>
                      <td>
                        {result.test?.minValue !== null && result.test?.maxValue !== null
                          ? `${result.test.minValue} - ${result.test.maxValue}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>

          <div className="summary">
            <h3>Récapitulatif par catégorie</h3>
            <div className="summary-grid">
              {Object.entries(data.summary).map(([cat, stats]) => (
                <div key={cat} className="summary-item">
                  <div className="name">{cat}</div>
                  <div className="count">{stats.count}</div>
                  <div className="total">{stats.total.toFixed(2)} DA</div>
                </div>
              ))}
            </div>
          </div>

          <div className="footer">
            <div>Généré le {format(new Date(), "dd/MM/yyyy 'à' HH:mm")}</div>
            <div>Page 1/1</div>
          </div>
        </div>
      </body>
    </html>
  );
}
