
import { PrismaClient } from './app/generated/prisma';

async function checkAnalyses() {
  const prisma = new PrismaClient();
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const count = await prisma.analysis.count({
        where: {
            creationDate: {
                gte: today
            }
        }
    });
    console.log("Count for today:", count);

    const latest = await prisma.analysis.findMany({
        orderBy: { creationDate: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, creationDate: true }
    });
    console.log("Latest 5 analyses:", JSON.stringify(latest, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkAnalyses();
