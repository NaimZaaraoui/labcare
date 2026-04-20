import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function isAlreadySetup(): Promise<boolean> {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  return adminCount > 0;
}

// GET — used by the wizard page to check if setup is needed
export async function GET() {
  try {
    const done = await isAlreadySetup();
    return NextResponse.json({ setupDone: done });
  } catch {
    return NextResponse.json({ setupDone: false });
  }
}

export async function POST(request: Request) {
  try {
    // 🔒 SECURITY: Block ALL setup actions if an admin already exists
    if (await isAlreadySetup()) {
      return NextResponse.json(
        { error: 'Ce système est déjà configuré. Accès refusé.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { labName, labSubtitle, labParent, labAddress1, labAddress2, labPhone, labEmail, labBioName, labBioTitle, adminName, adminEmail, adminPassword, includeDemo } = body;

    // Validate required fields
    if (!labName?.trim()) {
      return NextResponse.json({ error: 'Le nom du laboratoire est requis.' }, { status: 400 });
    }
    if (!adminEmail?.trim() || !adminName?.trim() || !adminPassword?.trim()) {
      return NextResponse.json({ error: 'Les informations du compte administrateur sont requises.' }, { status: 400 });
    }
    if (adminPassword.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // ✅ Single atomic transaction covering all setup operations
    await prisma.$transaction(async (tx) => {
      // 1. Lab settings
      const settings = [
        { key: 'lab_name', value: labName },
        { key: 'lab_subtitle', value: labSubtitle || 'Service de Laboratoire' },
        { key: 'lab_parent', value: labParent || '' },
        { key: 'lab_address_1', value: labAddress1 || '' },
        { key: 'lab_address_2', value: labAddress2 || '' },
        { key: 'lab_phone', value: labPhone || '' },
        { key: 'lab_email', value: labEmail || '' },
        { key: 'lab_bio_name', value: labBioName || '' },
        { key: 'lab_bio_title', value: labBioTitle || 'Docteur' },
        { key: 'lab_bio_onmpt', value: '' },
        { key: 'lab_footer_text', value: '' },
        { key: 'lab_stamp_image', value: '' },
        { key: 'lab_bio_signature', value: '' },
        { key: 'tat_warn', value: '45' },
        { key: 'tat_alert', value: '60' },
        { key: 'sample_types', value: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite' },
        { key: 'amount_unit', value: 'DA' },
      ];

      for (const s of settings) {
        await tx.setting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: s,
        });
      }

      // 2. Admin user
      await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail.toLowerCase().trim(),
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          mustChangePassword: true,
        },
      });

      // 3. Demo data (optional)
      if (includeDemo) {
        const hematoCat = await tx.category.upsert({
          where: { name: 'Hématologie' },
          update: { rank: 1, icon: 'droplets' },
          create: { name: 'Hématologie', rank: 1, icon: 'droplets' },
        });

        const bioCat = await tx.category.upsert({
          where: { name: 'Biochimie' },
          update: { rank: 2, icon: 'flask-conical' },
          create: { name: 'Biochimie', rank: 2, icon: 'flask-conical' },
        });

        const demoTests = [
          { code: 'NFS-HGB', name: 'Hémoglobine', categoryId: hematoCat.id, unit: 'g/dL', minValueM: 13, maxValueM: 17, minValueF: 12, maxValueF: 16, price: 8 },
          { code: 'NFS-WBC', name: 'Leucocytes', categoryId: hematoCat.id, unit: '10^3/uL', minValue: 4, maxValue: 10, price: 8 },
          { code: 'NFS-PLT', name: 'Plaquettes', categoryId: hematoCat.id, unit: '10^3/uL', minValue: 150, maxValue: 400, price: 8 },
          { code: 'BIO-GLU', name: 'Glycémie', categoryId: bioCat.id, unit: 'g/L', minValue: 0.7, maxValue: 1.1, price: 10 },
          { code: 'BIO-UREE', name: 'Urée', categoryId: bioCat.id, unit: 'g/L', minValue: 0.15, maxValue: 0.45, price: 10 },
          { code: 'BIO-CREA', name: 'Créatinine', categoryId: bioCat.id, unit: 'mg/L', minValueM: 7, maxValueM: 13, minValueF: 6, maxValueF: 11, price: 10 },
        ];

        for (const t of demoTests) {
          await tx.test.upsert({
            where: { code: t.code },
            update: { name: t.name, unit: t.unit, categoryId: t.categoryId, minValue: t.minValue ?? null, maxValue: t.maxValue ?? null, minValueM: t.minValueM ?? null, maxValueM: t.maxValueM ?? null, minValueF: t.minValueF ?? null, maxValueF: t.maxValueF ?? null, price: t.price },
            create: { name: t.name, code: t.code, unit: t.unit, categoryId: t.categoryId, minValue: t.minValue ?? null, maxValue: t.maxValue ?? null, minValueM: t.minValueM ?? null, maxValueM: t.maxValueM ?? null, minValueF: t.minValueF ?? null, maxValueF: t.maxValueF ?? null, price: t.price },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Setup API error:', error);
    return NextResponse.json({ error: 'La configuration a échoué. Veuillez réessayer.' }, { status: 500 });
  }
}