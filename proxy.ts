
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_ONLY = ['/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_MEDECIN = ['/analyses/nouvelle', '/dashboard/settings', '/dashboard/users', '/tests'];
const BLOCKED_RECEPTIONNISTE = ['/dashboard/settings', '/dashboard/users', '/tests'];

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // 1. Allow public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/notifications') ||
    pathname.includes('/export') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    pathname === '/logo.png' ||
    pathname === '/boxylab.jpg'
  ) {
    return NextResponse.next();
  }

  // 2. Get token and handle unauthenticated users
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 3. Force password change if required
  if (token.mustChangePassword && pathname !== '/changer-mot-de-passe') {
    return NextResponse.redirect(new URL('/changer-mot-de-passe', req.url));
  }

  // 4. Role-based Page Restrictions
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public|logo.png|boxylab.jpg).*)'],
};