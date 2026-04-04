import { prisma } from '@/lib/prisma';

export async function resolveAnalysisTestIds(ids: string[]): Promise<string[]> {
  const allIds = new Set<string>();

  const fetchChildren = async (testId: string) => {
    if (allIds.has(testId)) return;
    allIds.add(testId);

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { children: true },
    });

    if (!test?.children) return;

    for (const child of test.children) {
      await fetchChildren(child.id);
    }
  };

  for (const testId of ids) {
    await fetchChildren(testId);
  }

  return Array.from(allIds);
}
