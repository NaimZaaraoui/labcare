
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_ONLY = ['/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_MEDECIN = ['/analyses/nouvelle', '/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_RECEPTIONNISTE = ['/dashboard/settings', '/dashboard/users', '/tests'];

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const role = token.role as string;

  if (role === 'MEDECIN' && BLOCKED_MEDECIN.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (role === 'RECEPTIONNISTE' && BLOCKED_RECEPTIONNISTE.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (role !== 'ADMIN' && ADMIN_ONLY.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};