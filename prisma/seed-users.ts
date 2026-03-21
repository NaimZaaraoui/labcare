import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@labcare.local' },
  });

  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  const hashed = await bcrypt.hash('admin123', 12);

  await prisma.user.create({
    data: {
      name: 'Administrateur',
      email: 'admin@labcare.local',
      password: hashed,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created');
  console.log('   Email: admin@labcare.local');
  console.log('   Password: admin123');
  console.log('   ⚠️  Change this password after first login!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());