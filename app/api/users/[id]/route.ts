import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;


    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { action, name, role } = await request.json();

    if (action === 'toggle-active') {
      // Prevent deactivating self
      if (session.user.id === id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez pas désactiver votre propre compte.' },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      // Prevent deactivating the last admin
      if (user.role === 'ADMIN' && user.isActive) {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true },
        });

        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Vous ne pouvez pas désactiver le dernier administrateur.' },
            { status: 400 }
          );
        }
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
      });

      return NextResponse.json({ message: 'Statut mis à jour.' });
    }

    if (action === 'reset-password') {
      const hashedPassword = await bcrypt.hash('LabCare2024!', 12);
      await prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          mustChangePassword: true,
        },
      });

      return NextResponse.json({ message: 'Mot de passe réinitialisé.' });
    }

    if (action === 'update') {
      const validRoles = ['ADMIN', 'MEDECIN', 'TECHNICIEN', 'RECEPTIONNISTE'];
      if (role && !validRoles.includes(role)) {
        return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id },
        data: { name, role },
      });

      return NextResponse.json({ message: 'Informations mises à jour.' });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}