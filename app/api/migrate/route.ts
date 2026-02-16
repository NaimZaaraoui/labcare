import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🚀 Starting Category Migration via API...');

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
      
      let category = await prisma.category.findUnique({
        where: { name: catName }
      });

      if (!category) {
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

      const catTests = tests.filter(t => t.category === catName);
      
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

    const categoriesCount = await prisma.category.count();

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      stats: {
        testsMigrated: tests.length,
        categoriesCreated: categoriesCount,
        testsRemaining: remaining
      }
    });

  } catch (error) {
    console.error('[API /migrate] Error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
