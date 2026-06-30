import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// PUT: Approve/Update operator profile (Admin only)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // This is the OperatorProfile ID
    
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
    
    const body = await req.json();
    const { isApproved } = body;
    
    if (typeof isApproved !== 'boolean') {
      return NextResponse.json({ error: 'Missing parameter isApproved' }, { status: 400 });
    }
    
    const updatedProfile = await prisma.operatorProfile.update({
      where: { id },
      data: { isApproved }
    });
    
    return NextResponse.json({
      message: `Operator profile isApproved status updated to ${isApproved}`,
      profile: updatedProfile
    }, { status: 200 });
    
  } catch (error) {
    console.error('Update operator profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
