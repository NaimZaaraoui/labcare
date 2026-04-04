import { PrismaClient } from "../app/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'file:./dev.db';

const adapter = new PrismaBetterSqlite3({ url: connectionString });

const prisma = new PrismaClient({
    adapter,
});

const DEMO_CATEGORIES = [
  { name: 'Hématologie', rank: 1, icon: 'droplets' },
  { name: 'Biochimie', rank: 2, icon: 'flask-conical' },
] as const;

const DEMO_TESTS = [
  { code: 'NFS-HGB', name: 'Hémoglobine', category: 'Hématologie', unit: 'g/dL', minValueM: 13, maxValueM: 17, minValueF: 12, maxValueF: 16, price: 8 },
  { code: 'NFS-WBC', name: 'Leucocytes', category: 'Hématologie', unit: '10^3/uL', minValue: 4, maxValue: 10, price: 8 },
  { code: 'BIO-GLU', name: 'Glycémie', category: 'Biochimie', unit: 'g/L', minValue: 0.7, maxValue: 1.1, price: 10 },
  { code: 'BIO-UREE', name: 'Urée', category: 'Biochimie', unit: 'g/L', minValue: 0.15, maxValue: 0.45, price: 10 },
  { code: 'BIO-CREA', name: 'Créatinine', category: 'Biochimie', unit: 'mg/L', minValueM: 7, maxValueM: 13, minValueF: 6, maxValueF: 11, price: 10 },
] as const;

const DEMO_PATIENTS = [
  {
    firstName: 'Sami',
    lastName: 'Ben Salem',
    gender: 'M',
    birthDate: new Date('1989-04-12'),
    phoneNumber: '20000001',
    email: 'sami.demo@nexlab.local',
    address: 'Patient de démonstration 1',
  },
  {
    firstName: 'Amel',
    lastName: 'Trabelsi',
    gender: 'F',
    birthDate: new Date('1994-09-03'),
    phoneNumber: '20000002',
    email: 'amel.demo@nexlab.local',
    address: 'Patient de démonstration 2',
  },
] as const;

async function ensureDemoCatalog() {
  for (const category of DEMO_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        rank: category.rank,
        icon: category.icon,
      },
      create: {
        name: category.name,
        rank: category.rank,
        icon: category.icon,
      },
    });
  }

  const categories = await prisma.category.findMany({
    where: { name: { in: DEMO_CATEGORIES.map((item) => item.name) } },
    select: { id: true, name: true },
  });
  const categoryMap = new Map(categories.map((category) => [category.name, category.id]));

  for (const test of DEMO_TESTS) {
    await prisma.test.upsert({
      where: { code: test.code },
      update: {
        name: test.name,
        unit: test.unit,
        categoryId: categoryMap.get(test.category) ?? null,
        minValue: 'minValue' in test ? test.minValue ?? null : null,
        maxValue: 'maxValue' in test ? test.maxValue ?? null : null,
        minValueM: 'minValueM' in test ? test.minValueM ?? null : null,
        maxValueM: 'maxValueM' in test ? test.maxValueM ?? null : null,
        minValueF: 'minValueF' in test ? test.minValueF ?? null : null,
        maxValueF: 'maxValueF' in test ? test.maxValueF ?? null : null,
        price: test.price,
      },
      create: {
        name: test.name,
        code: test.code,
        unit: test.unit,
        categoryId: categoryMap.get(test.category) ?? null,
        minValue: 'minValue' in test ? test.minValue ?? null : null,
        maxValue: 'maxValue' in test ? test.maxValue ?? null : null,
        minValueM: 'minValueM' in test ? test.minValueM ?? null : null,
        maxValueM: 'maxValueM' in test ? test.maxValueM ?? null : null,
        minValueF: 'minValueF' in test ? test.minValueF ?? null : null,
        maxValueF: 'maxValueF' in test ? test.maxValueF ?? null : null,
        price: test.price,
      },
    });
  }
}

async function ensureDemoPatients() {
  const existingPatients = await prisma.patient.count();
  if (existingPatients > 0) {
    console.log('Patients already exist, skipping demo patients.');
    return await prisma.patient.findMany({
      take: 2,
      orderBy: { createdAt: 'asc' },
    });
  }

  await prisma.patient.createMany({
    data: DEMO_PATIENTS.map((patient) => ({
      ...patient,
    })),
  });

  console.log('Demo patients created.');

  return prisma.patient.findMany({
    take: 2,
    orderBy: { createdAt: 'asc' },
  });
}

async function ensureDemoAnalyses(adminName: string) {
  const analysesCount = await prisma.analysis.count();
  if (analysesCount > 0) {
    console.log('Analyses already exist, skipping demo analyses.');
    return;
  }

  const [patient1, patient2] = await prisma.patient.findMany({
    take: 2,
    orderBy: { createdAt: 'asc' },
  });
  const tests = await prisma.test.findMany({
    where: { code: { in: DEMO_TESTS.map((test) => test.code) } },
    select: { id: true, code: true, unit: true, price: true },
  });
  const testMap = new Map(tests.map((test) => [test.code, test]));

  if (!patient1 || !patient2 || tests.length < 5) {
    console.log('Demo analyses skipped: missing demo patients or tests.');
    return;
  }

  const analysis1CreatedAt = new Date();
  analysis1CreatedAt.setHours(8, 15, 0, 0);
  const analysis2CreatedAt = new Date();
  analysis2CreatedAt.setHours(9, 5, 0, 0);

  await prisma.analysis.create({
    data: {
      orderNumber: 'DEMO-0001',
      receiptNumber: 'Q900001',
      dailyId: 'D-001',
      patientId: patient1.id,
      patientFirstName: patient1.firstName,
      patientLastName: patient1.lastName,
      patientAge: new Date().getFullYear() - new Date(patient1.birthDate || new Date()).getFullYear(),
      patientGender: patient1.gender,
      provenance: 'Consultation externe',
      medecinPrescripteur: 'Dr Démo',
      status: 'validated_bio',
      creationDate: analysis1CreatedAt,
      createdAt: analysis1CreatedAt,
      totalPrice: (testMap.get('NFS-HGB')?.price || 0) + (testMap.get('NFS-WBC')?.price || 0) + (testMap.get('BIO-GLU')?.price || 0),
      amountPaid: (testMap.get('NFS-HGB')?.price || 0) + (testMap.get('NFS-WBC')?.price || 0) + (testMap.get('BIO-GLU')?.price || 0),
      paymentStatus: 'PAID',
      paymentMethod: 'Espèces',
      paidAt: new Date(analysis1CreatedAt.getTime() + 20 * 60 * 1000),
      validatedTechAt: new Date(analysis1CreatedAt.getTime() + 70 * 60 * 1000),
      validatedTechName: adminName,
      validatedBioAt: new Date(analysis1CreatedAt.getTime() + 95 * 60 * 1000),
      validatedBioName: adminName,
      results: {
        create: [
          { testId: testMap.get('NFS-HGB')!.id, value: '14.2', unit: testMap.get('NFS-HGB')!.unit, abnormal: false },
          { testId: testMap.get('NFS-WBC')!.id, value: '6.8', unit: testMap.get('NFS-WBC')!.unit, abnormal: false },
          { testId: testMap.get('BIO-GLU')!.id, value: '0.92', unit: testMap.get('BIO-GLU')!.unit, abnormal: false },
        ],
      },
    },
  });

  await prisma.analysis.create({
    data: {
      orderNumber: 'DEMO-0002',
      receiptNumber: 'Q900002',
      dailyId: 'D-002',
      patientId: patient2.id,
      patientFirstName: patient2.firstName,
      patientLastName: patient2.lastName,
      patientAge: new Date().getFullYear() - new Date(patient2.birthDate || new Date()).getFullYear(),
      patientGender: patient2.gender,
      provenance: 'Urgences',
      medecinPrescripteur: 'Dr Démo',
      isUrgent: true,
      status: 'in_progress',
      creationDate: analysis2CreatedAt,
      createdAt: analysis2CreatedAt,
      totalPrice: (testMap.get('BIO-UREE')?.price || 0) + (testMap.get('BIO-CREA')?.price || 0),
      amountPaid: 10,
      paymentStatus: 'PARTIAL',
      paymentMethod: 'Espèces',
      results: {
        create: [
          { testId: testMap.get('BIO-UREE')!.id, value: '0.51', unit: testMap.get('BIO-UREE')!.unit, abnormal: true, notes: 'À contrôler' },
          { testId: testMap.get('BIO-CREA')!.id, value: '12.4', unit: testMap.get('BIO-CREA')!.unit, abnormal: false },
        ],
      },
    },
  });

  console.log('Demo analyses created.');
}

async function main() {
    console.log("Checking for existing ADMIN user...");
    const adminExists = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });
    let adminName = adminExists?.name || 'Administrateur';

    if (adminExists) {
        console.log("Admin exists, skipping admin creation.");
    } else {
        const hashedPassword = await bcrypt.hash('NexLab2026!', 12);
        const admin = await prisma.user.create({
            data: {
                name: 'Administrateur',
                email: 'admin@nexlab.local',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true,
                mustChangePassword: true,
            }
        });
        adminName = admin.name;
        console.log("Admin account created:");
        console.log("Email: admin@nexlab.local");
        console.log("Password: NexLab2026!");
        console.log("IMPORTANT: Please change this password immediately after first login.");
    }

    // Keep existing seed logic for tests/analyses if needed, or remove it as per request
    // The user didn't say to remove existing ones, but the request was "Create prisma/seed.ts that: ..."
    // I'll keep them but focus on the admin.
    
    console.log("Seed data initialization complete.\n" +
      "Email: admin@nexlab.local\n" +
      "Password: NexLab2026!"
    );

    // Default settings
    const defaultSettings = [
        { key: 'lab_name',        value: 'CSSB GALLEL' },
        { key: 'lab_subtitle',    value: 'Service de Laboratoire' },
        { key: 'lab_parent',      value: 'Hôpital Menzel Bouzaïene' },
        { key: 'lab_address_1',   value: 'El Gallel, Menzel Bouzaïene' },
        { key: 'lab_address_2',   value: 'Sidi Bouzid' },
        { key: 'lab_phone',       value: '' },
        { key: 'lab_email',       value: '' },
        { key: 'lab_bio_name',    value: '' },
        { key: 'lab_bio_title',   value: 'Docteur' },
        { key: 'lab_bio_onmpt',   value: '' },
        { key: 'lab_footer_text', value: '' },
        { key: 'lab_stamp_image', value: '' },
        { key: 'lab_bio_signature', value: '' },
        { key: 'tat_warn',        value: '45' },
        { key: 'tat_alert',       value: '60' },
    ];

    for (const s of defaultSettings) {
        await prisma.setting.upsert({
            where:  { key: s.key },
            update: {},
            create: s,
        });
    }
    console.log('Default settings ensured.');

    await ensureDemoCatalog();
    await ensureDemoPatients();
    await ensureDemoAnalyses(adminName);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
