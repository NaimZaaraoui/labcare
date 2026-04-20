/**
 * E2E Test Database Seeding
 * Creates test data for E2E workflow testing
 */


import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';


async function seed() {
  console.log('🌱 Starting E2E test database seed...');

  try {
    // Clean existing test data
    await prisma.result.deleteMany({});
    await prisma.analysis.deleteMany({});
    await prisma.test.deleteMany({});
    await prisma.patient.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    console.log('👥 Creating test users...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.lab',
        password: adminPassword,
        name: 'Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });

    const techPassword = await bcrypt.hash('tech123', 10);
    const technicien = await prisma.user.create({
      data: {
        email: 'tech@test.lab',
        password: techPassword,
        name: 'Technician',
        role: 'TECHNICIEN',
        isActive: true,
      },
    });

    const receptionPassword = await bcrypt.hash('reception123', 10);
    const receptionist = await prisma.user.create({
      data: {
        email: 'reception@test.lab',
        password: receptionPassword,
        name: 'Receptionist',
        role: 'RECEPTIONNISTE',
        isActive: true,
      },
    });

    const doctorPassword = await bcrypt.hash('doctor123', 10);
    const doctor = await prisma.user.create({
      data: {
        email: 'doctor@test.lab',
        password: doctorPassword,
        name: 'Doctor',
        role: 'MEDECIN',
        isActive: true,
      },
    });

    // Create test patients
    console.log('🏥 Creating test patients...');

    const patient1 = await prisma.patient.create({
      data: {
        firstName: 'Jean',
        lastName: 'Dupont',
        birthDate: new Date('1985-05-15'),
        gender: 'M',
        phone: '0612345678',
        email: 'jean@example.com',
        address: '123 Rue de Paris',
        createdAt: new Date(),
      },
    });

    const patient2 = await prisma.patient.create({
      data: {
        firstName: 'Marie',
        lastName: 'Martin',
        birthDate: new Date('1990-03-20'),
        gender: 'F',
        phone: '0687654321',
        email: 'marie@example.com',
        address: '456 Avenue des Champs',
        createdAt: new Date(),
      },
    });

    // Create test definitions (hematology panel)
    console.log('🧬 Creating test definitions...');

    const gbTest = await prisma.test.create({
      data: {
        code: 'GB',
        name: 'Globules Blancs',
        category: 'HEMATOLOGIE',
        unit: '10³/µL',
        minValue: 4.0,
        maxValue: 10.0,
        decimalPlaces: 1,
        referenceRangeMin: 4.0,
        referenceRangeMax: 10.0,
      },
    });

    const hgbTest = await prisma.test.create({
      data: {
        code: 'HGB',
        name: 'Hémoglobine',
        category: 'HEMATOLOGIE',
        unit: 'g/dL',
        minValue: 10.0,
        maxValue: 20.0,
        decimalPlaces: 1,
        referenceRangeMin: 13.0,
        referenceRangeMax: 17.0,
      },
    });

    const pltTest = await prisma.test.create({
      data: {
        code: 'PLT',
        name: 'Plaquettes',
        category: 'HEMATOLOGIE',
        unit: '10³/µL',
        minValue: 100,
        maxValue: 600,
        decimalPlaces: 0,
        referenceRangeMin: 150,
        referenceRangeMax: 450,
      },
    });

    // Create test analysis
    console.log('📊 Creating test analysis...');

    const analysis = await prisma.analysis.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        patientId: patient1.id,
        status: 'pending',
        results: {
          create: [
            {
              testId: gbTest.id,
              value: '7.5',
              unit: '10³/µL',
              abnormal: false,
            },
            {
              testId: hgbTest.id,
              value: '14.5',
              unit: 'g/dL',
              abnormal: false,
            },
            {
              testId: pltTest.id,
              value: '250',
              unit: '10³/µL',
              abnormal: false,
            },
          ],
        },
      },
      include: { results: true },
    });

    console.log('✅ Seed data created successfully');
    console.log('\n📋 Test Credentials:');
    console.log('-------------------');
    console.log('Admin:      admin@test.lab / admin123');
    console.log('Technicien: tech@test.lab / tech123');
    console.log('Receptionist: reception@test.lab / reception123');
    console.log('Doctor:     doctor@test.lab / doctor123');
    console.log('\n👤 Test Patients:');
    console.log('-------------------');
    console.log(`Patient 1: ${patient1.firstName} ${patient1.lastName} (ID: ${patient1.id})`);
    console.log(`Patient 2: ${patient2.firstName} ${patient2.lastName} (ID: ${patient2.id})`);

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
