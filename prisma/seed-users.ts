import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@nexlab.local' },
  });

  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  const hashed = await bcrypt.hash('NexLab2026!', 12);

  await prisma.user.create({
    data: {
      name: 'Administrateur',
      email: 'admin@nexlab.local',
      password: hashed,
      role: 'ADMIN',
      mustChangePassword: true,
    },
  });

  console.log('✅ Admin user created');
  console.log('   Email: admin@nexlab.local');
  console.log('   Password: NexLab2026!');
  console.log('   ⚠️  Change this password after first login!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
