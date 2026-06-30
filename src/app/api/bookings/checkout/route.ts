import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1. Verify user session
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
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    
    const body = await req.json();
    const { bookingId, paymentMethod, paymentDetails } = body;
    
    if (!bookingId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing payment parameters' }, { status: 400 });
    }
    
    // 2. Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        adventure: true
      }
    });
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Check if the booking belongs to the current user
    if (booking.userId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Unauthorized access to this booking' }, { status: 403 });
    }
    
    // Make sure booking is not already processed
    if (booking.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `This booking is already processed. Current status is: ${booking.status}` 
      }, { status: 400 });
    }
    
    // 3. Sandbox Payment Gateway Simulation
    console.log(`Processing sandbox payment of ₹${booking.totalPrice} using ${paymentMethod}...`);
    
    // Simulate API delay (1.5 seconds network simulation)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock sandbox card/UPI rules:
    // If user enters 'fail' anywhere in the paymentDetails, reject the payment
    const detailsStr = JSON.stringify(paymentDetails || {}).toLowerCase();
    if (detailsStr.includes('fail') || detailsStr.includes('error') || detailsStr.includes('000000')) {
      return NextResponse.json({ 
        error: 'Payment declined: Transaction failed. Please check your card balance or UPI pin and try again.' 
      }, { status: 400 });
    }
    
    // 4. Generate Mock Payment ID
    const paymentId = `pay_sandbox_${paymentMethod.toLowerCase()}_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    
    // 5. Update Booking Status to CONFIRMED
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        paymentId: paymentId
      },
      include: {
        travelers: true,
        departure: true
      }
    });
    
    return NextResponse.json({
      message: 'Payment successfully processed in Sandbox Mode!',
      booking: updatedBooking,
      paymentId: paymentId
    }, { status: 200 });
    
  } catch (error) {
    console.error('Checkout processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
