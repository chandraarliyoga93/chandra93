import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get cookies set by syncUserSupabase
  const userId = request.cookies.get("user-id")?.value;
  const userRole = request.cookies.get("user-role")?.value;

  // 1. Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!userId || !userRole) {
      const url = new URL('/', request.url);
      url.searchParams.set('returnUrl', pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    // 2. Role-based redirection
    // Siswa cannot access /dashboard/guru
    if ((userRole === 'Siswa' || userRole === 'SISWA') && pathname.startsWith('/dashboard/guru')) {
      return NextResponse.redirect(new URL('/dashboard/siswa', request.url));
    }

    // Guru (ADMIN_GURU) cannot access /dashboard/siswa
    if ((userRole === 'Guru' || userRole === 'ADMIN_GURU') && pathname.startsWith('/dashboard/siswa')) {
      return NextResponse.redirect(new URL('/dashboard/guru', request.url));
    }
  }

  // Handle landing page redirect for authenticated users
  if (pathname === '/') {
    if (userId && userRole) {
      const dashboardPath = (userRole === 'Guru' || userRole === 'ADMIN_GURU') ? '/dashboard/guru' : '/dashboard/siswa';
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
};
