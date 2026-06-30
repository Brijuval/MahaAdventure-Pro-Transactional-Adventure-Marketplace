import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // 1. Retrieve token from request cookies
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => c.trim().split('='))
    );
    const token = cookies['token'];
    
    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 200 } // Return 200 with null user to make frontend checks easy
      );
    }
    
    // 2. Verify token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }
    
    // 3. Fetch user details from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        operator: {
          select: {
            id: true,
            companyName: true,
            isApproved: true,
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
