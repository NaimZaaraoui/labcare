
import { PrismaClient } from '../app/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
  console.log('Seeding Routine Checkup (Bilans de routine)...');

  // 1. Create the Group
  const routineGroup = await prisma.test.upsert({
    where: { code: 'ROUTINE' },
    update: {
      name: 'BILAN DE ROUTINE',
      category: 'Biochimie',
      isGroup: true,
      resultType: 'text',
    },
    create: {
      name: 'BILAN DE ROUTINE',
      code: 'ROUTINE',
      category: 'Biochimie',
      isGroup: true,
      resultType: 'text',
    },
  });

  const tests = [
    {
      name: 'Glycémie à jeun',
      code: 'GLY',
      unit: 'g/l',
      minValue: 0.70,
      maxValue: 1.10,
      category: 'Biochimie',
      parentId: routineGroup.id,
    },
    {
      name: 'Urée Sanguine',
      code: 'UREE',
      unit: 'g/l',
      minValue: 0.15,
      maxValue: 0.45,
      category: 'Biochimie',
      parentId: routineGroup.id,
    },
    {
      name: 'Créatinine',
      code: 'CREA',
      unit: 'mg/l',
      minValue: 7.0,
      maxValue: 13.0,
      category: 'Biochimie',
      parentId: routineGroup.id,
    },
    {
      name: 'Cholestérol Total',
      code: 'CHOL',
      unit: 'g/l',
      minValue: 1.50,
      maxValue: 2.00,
      category: 'Biochimie',
      parentId: routineGroup.id,
    },
    {
      name: 'Triglycérides',
      code: 'TRIG',
      unit: 'g/l',
      minValue: 0.35,
      maxValue: 1.50,
      category: 'Biochimie',
      parentId: routineGroup.id,
    },
    {
      name: 'Acide Urique',
      code: 'ACU',
      unit: 'mg/l',
      minValue: 35,
      maxValue: 70,
      category: 'Biochimie',
      parentId: routineGroup.id,
    },
  ];

  for (const test of tests) {
    await prisma.test.upsert({
      where: { code: test.code },
      update: test,
      create: test,
    });
  }

  console.log('Routine Checkup seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
