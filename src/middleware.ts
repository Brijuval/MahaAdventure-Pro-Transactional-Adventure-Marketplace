import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'adventurehub_super_secret_key_987654321_maha_tourism'
);

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Define route guard logic
  const isDashboardRoute = path.startsWith('/dashboard');
  const isOperatorRoute = path.startsWith('/operator');
  const isAdminRoute = path.startsWith('/admin');
  
  if (!isDashboardRoute && !isOperatorRoute && !isAdminRoute) {
    return NextResponse.next();
  }
  
  const token = req.cookies.get('token')?.value;
  
  // If no token exists, redirect to login page
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }
  
  try {
    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;
    
    // Guard Customer Dashboard
    if (isDashboardRoute && role !== 'CUSTOMER' && role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    // Guard Operator Dashboard
    if (isOperatorRoute && role !== 'OPERATOR' && role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    // Guard Admin Dashboard
    if (isAdminRoute && role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  } catch (error) {
    // Token verification failed (expired or invalid), redirect to login
    console.error('Middleware JWT verification failed:', error);
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/operator/:path*',
    '/admin/:path*',
  ],
};
