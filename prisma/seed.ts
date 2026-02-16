import { PrismaClient } from "../app/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const connectionString = process.env.DATABASE_URL || 'file:./dev.db';

const adapter = new PrismaBetterSqlite3({ url: connectionString });

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    // Create 5 tests
    const tests = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
            prisma.test.create({
                data: {
                    name: `Test ${i + 1}`,
                    code: `TST${String(i + 1).padStart(3, "0")}`,
                },
            })
        )
    );

    // Create 5 analyses
    const analyses = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
            prisma.analysis.create({
                data: {
                    patientId: `PAT${String(i + 1).padStart(3, "0")}`,
                    orderNumber: `ORD${String(i + 1).padStart(3, "0")}`
                    
                },
            })
        )
    );

    // Create 5 results
    const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
            prisma.result.create({
                data: {
                    analysisId: analyses[i].id,
                    testId: tests[i].id,
                    value: `Value ${i + 1}`
                },
            })
        )
    );

    console.log("Seed data created successfully");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });