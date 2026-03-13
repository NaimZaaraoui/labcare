import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseDiatronFile } from '@/lib/parsers/diatron';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Contenu manquant' }, { status: 400 });
    }

    const diatronResults = parseDiatronFile(content);
    if (diatronResults.length === 0) {
      return NextResponse.json({ error: 'Aucun résultat trouvé dans le fichier' }, { status: 400 });
    }

    const { selectedIndex } = body;

    // If no index is selected, return the list of available results for preview
    if (selectedIndex === undefined) {
      return NextResponse.json({
        preview: true,
        records: diatronResults.map((r, index) => ({
          index,
          sampleId: r.sampleId,
          date: r.date,
          time: r.time,
        }))
      });
    }

    const selectedRecord = diatronResults[selectedIndex];
    if (!selectedRecord) {
      return NextResponse.json({ error: 'Index de résultat invalide' }, { status: 400 });
    }

    // Get the analysis tests to map results correctly
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        results: {
          include: {
            test: true
          }
        }
      }
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analyse non trouvée' }, { status: 404 });
    }

    // Update results based on mapping
    const resultUpdates = analysis.results
      .map(res => {
        const value = selectedRecord.results[res.test?.code || ''];
        if (value) {
          return prisma.result.update({
            where: { id: res.id },
            data: { value }
          });
        }
        return null;
      })
      .filter((update): update is any => update !== null);

    // Combine with histogram data update if present
    const finalUpdates: any[] = [...resultUpdates];
    if (selectedRecord.histograms) {
      finalUpdates.push(
        prisma.analysis.update({
          where: { id },
          data: {
            histogramData: JSON.stringify(selectedRecord.histograms)
          }
        })
      );
    }

    if (finalUpdates.length > 0) {
      await prisma.$transaction(finalUpdates);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${resultUpdates.length} résultats importés`,
      recordInfo: {
        sampleId: selectedRecord.sampleId,
        date: selectedRecord.date,
        time: selectedRecord.time
      }
    });

  } catch (error: any) {
    console.error('Error importing Diatron data:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'importation',
      details: error.message 
    }, { status: 500 });
  }
}
