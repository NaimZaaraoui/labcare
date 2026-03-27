import { prisma } from '../lib/prisma';

async function main() {
  console.log('🚀 Starting Category Migration...');

  // 1. Fetch all tests with a category string
  const tests = await prisma.test.findMany({
    where: {
      category: { not: null }
    }
  });

  console.log(`Found ${tests.length} tests to migrate.`);

  // 2. Identify unique categories
  const categoriesMap = new Set<string>();
  tests.forEach(t => {
    if (t.category) categoriesMap.add(t.category.trim());
  });

  console.log(`Found ${categoriesMap.size} unique categories.`);

  // 3. Create Categories and Link Tests
  const NFS_SORT_ORDER = [
    'GB', 'WBC', 'PNN', 'NEUT', 'PNNA', 'PNN_ABS', 'NEUTA',
    'LYM', 'LYMPH', 'LYMA', 'LYM_ABS', 'LYMPHA',
    'MONO', 'MONA', 'MONO_ABS', 'EOS', 'EOS_ABS',
    'BASO', 'BASA', 'BASO_ABS', 'GR', 'RBC', 'HB', 'HGB',
    'HT', 'HCT', 'VGM', 'CCMH', 'TCMH', 'PLT'
  ];

  for (const catName of categoriesMap) {
    console.log(`Processing category: ${catName}...`);
    
    // Create or find category
    let category = await prisma.category.findUnique({
      where: { name: catName }
    });

    if (!category) {
      // Default rank logic: NFS first, then others alphabetically ?
      // If we want NFS at top, give it rank 0, others rank 10, 20...
      // For now, let's keep simple (0 default)
      let defaultRank = 100;
      if (catName === 'NFS' || catName === 'Hématologie') defaultRank = 0;
      if (catName === 'Biochimie') defaultRank = 1;
      
      category = await prisma.category.create({
        data: { name: catName, rank: defaultRank }
      });
      console.log(`  Created category: ${catName}`);
    } else {
      console.log(`  Found existing category: ${catName}`);
    }

    // Find tests for this category
    const catTests = tests.filter(t => t.category === catName);
    
    // Update each test with rank
    for (const test of catTests) {
      let rank = 100;
      if (test.code && NFS_SORT_ORDER.includes(test.code)) {
        rank = NFS_SORT_ORDER.indexOf(test.code);
      }
      
      await prisma.test.update({
        where: { id: test.id },
        data: { 
          categoryId: category.id,
          rank: rank
        }
      });
    }
    
    console.log(`  Linked and ranked ${catTests.length} tests in category ${catName}.`);
  }

  // 4. Verification
  const remaining = await prisma.test.count({
    where: { 
      category: { not: null },
      categoryId: null
    }
  });

  if (remaining === 0) {
    console.log('✅ Migration successful! All tests have been linked to a Category.');
  } else {
    console.warn(`⚠️ Warning: ${remaining} tests still have category string but no categoryId.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
