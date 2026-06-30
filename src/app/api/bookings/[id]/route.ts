import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }
    
    const body = await req.json();
    const { status } = body; // CONFIRMED, COMPLETED, CANCELLED
    
    if (!status || !['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status parameter' }, { status: 400 });
    }
    
    // Fetch booking to verify owner
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        adventure: true,
        travelers: true
      }
    });
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking record not found' }, { status: 404 });
    }
    
    // Role-based auth verification
    if (decoded.role === 'CUSTOMER') {
      // Customers can only cancel their own bookings
      if (booking.userId !== decoded.userId) {
        return NextResponse.json({ error: 'Forbidden: You do not own this booking' }, { status: 403 });
      }
      // Customers can ONLY transition their booking to CANCELLED state
      if (status !== 'CANCELLED') {
        return NextResponse.json({ error: 'Forbidden: Customers can only transition bookings to CANCELLED' }, { status: 403 });
      }
    } else if (decoded.role === 'OPERATOR') {
      // Operators must own the adventure of this booking
      const operatorProfile = await prisma.operatorProfile.findUnique({
        where: { userId: decoded.userId }
      });
      
      if (!operatorProfile || booking.adventure.operatorId !== operatorProfile.id) {
        return NextResponse.json({ error: 'Forbidden: You do not own the adventure for this booking' }, { status: 403 });
      }
    }
    
    // Transactional status update
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // If status is transitioning to CANCELLED, we must decrement bookedSlots on departure
      if (status === 'CANCELLED' && booking.status !== 'CANCELLED') {
        const departure = await tx.departure.findUnique({
          where: { id: booking.departureId }
        });
        
        if (departure) {
          const slotsToFree = booking.travelers.length;
          await tx.departure.update({
            where: { id: booking.departureId },
            data: {
              bookedSlots: Math.max(0, departure.bookedSlots - slotsToFree)
            }
          });
        }
      }
      
      // If status is transitioning from CANCELLED back to CONFIRMED/PENDING, we must re-increment slots
      if (booking.status === 'CANCELLED' && status !== 'CANCELLED') {
        const departure = await tx.departure.findUnique({
          where: { id: booking.departureId }
        });
        
        if (departure) {
          const slotsToBook = booking.travelers.length;
          if (departure.bookedSlots + slotsToBook > departure.maxCapacity) {
            throw new Error('CAPACITY_EXCEEDED_ON_REINSTATE');
          }
          await tx.departure.update({
            where: { id: booking.departureId },
            data: {
              bookedSlots: departure.bookedSlots + slotsToBook
            }
          });
        }
      }
      
      // Update Booking status
      return await tx.booking.update({
        where: { id },
        data: { status },
        include: { travelers: true }
      });
    });
    
    return NextResponse.json({
      message: `Booking status updated to ${status}`,
      booking: updatedBooking
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Update booking status error:', error);
    if (error.message === 'CAPACITY_EXCEEDED_ON_REINSTATE') {
      return NextResponse.json({ 
        error: 'Cannot reinstate booking. The departure capacity limit is now fully occupied.' 
      }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
