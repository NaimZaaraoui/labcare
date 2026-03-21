import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const ROLES = {
  ADMIN: 'ADMIN',
  TECHNICIEN: 'TECHNICIEN',
  RECEPTIONNISTE: 'RECEPTIONNISTE',
  MEDECIN: 'MEDECIN',
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  BIOLOGISTE: ['*'],
  TECHNICIEN: [
    '/',
    '/analyses',
    '/analyses/nouvelle',
    '/analyses/:id',
    '/dashboard/patients',
    '/dashboard/documents',
  ],
  RECEPTIONNISTE: [
    '/',
    '/analyses',
    '/analyses/nouvelle',
    '/dashboard/patients',
    '/dashboard/documents',
  ],
  MEDECIN: [
    '/',
    '/analyses',
    '/dashboard/documents',
  ],
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
});