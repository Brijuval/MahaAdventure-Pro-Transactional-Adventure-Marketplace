import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Auth Check
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => c.trim().split('='))
    );
    const token = cookies['token'];
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }
    
    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Fetch all stats
    const usersCount = await prisma.user.count();
    const customerCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const operatorCount = await prisma.user.count({ where: { role: 'OPERATOR' } });
    
    // Fetch Operator Profiles needing approval
    const operatorProfiles = await prisma.operatorProfile.findMany({
      include: {
        user: { select: { username: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Fetch Adventures (both approved and pending)
    const adventures = await prisma.adventure.findMany({
      include: {
        operator: { select: { companyName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Fetch Bookings
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { username: true, email: true } },
        adventure: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      stats: {
        usersCount,
        customerCount,
        operatorCount,
        bookingsCount: bookings.length,
        revenue: bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').reduce((s, b) => s + b.totalPrice, 0)
      },
      operators: operatorProfiles,
      adventures,
      bookings
    }, { status: 200 });
    
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
