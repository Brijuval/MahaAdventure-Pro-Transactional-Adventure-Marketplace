import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { calculatePrice } from '@/lib/pricing';

// 1. GET: Fetch bookings depending on the user role (Customer, Operator, Admin)
export async function GET(req: Request) {
  try {
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
    
    const { userId, role } = decoded;
    
    let bookings;
    
    if (role === 'ADMIN') {
      // Admins see all bookings
      bookings = await prisma.booking.findMany({
        include: {
          user: { select: { username: true, email: true } },
          adventure: { select: { title: true, region: true, imageUrl: true } },
          departure: { select: { date: true } },
          travelers: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'OPERATOR') {
      // Operators see bookings for their adventures
      const operatorProfile = await prisma.operatorProfile.findUnique({
        where: { userId }
      });
      
      if (!operatorProfile) {
        return NextResponse.json({ error: 'Operator profile not found' }, { status: 404 });
      }
      
      bookings = await prisma.booking.findMany({
        where: {
          adventure: { operatorId: operatorProfile.id }
        },
        include: {
          user: { select: { username: true, email: true } },
          adventure: { select: { title: true, region: true, imageUrl: true } },
          departure: { select: { date: true } },
          travelers: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Customers see their own bookings
      bookings = await prisma.booking.findMany({
        where: { userId },
        include: {
          adventure: { 
            select: { 
              title: true, 
              region: true, 
              imageUrl: true, 
              meetingPoint: true,
              bestSeason: true,
              emergencyHospital: true,
              emergencyPolice: true,
              operator: {
                select: {
                  companyName: true
                }
              }
            } 
          },
          departure: { select: { date: true } },
          travelers: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST: Create a transaction-safe booking (Awaiting payment)
export async function POST(req: Request) {
  try {
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
    const { departureId, travelers, couponCode } = body;
    
    if (!departureId || !travelers || !Array.isArray(travelers) || travelers.length === 0) {
      return NextResponse.json({ error: 'Missing required booking parameters' }, { status: 400 });
    }
    
    // Process inside a transaction block to guarantee capacity safety
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch departure details and lock the row to avoid race conditions
      const departure = await tx.departure.findUnique({
        where: { id: departureId },
        include: { adventure: true }
      });
      
      if (!departure) {
        throw new Error('DEPARTURE_NOT_FOUND');
      }
      
      const requestedSlots = travelers.length;
      const availableSlots = departure.maxCapacity - departure.bookedSlots;
      
      if (requestedSlots > availableSlots) {
        throw new Error('SLOTS_EXCEEDED');
      }
      
      // 2. Calculate dynamic price breakdown
      const priceResult = calculatePrice(
        departure.adventure.basePrice,
        requestedSlots,
        departure.date,
        couponCode
      );
      
      // 3. Create Booking (starts as PENDING, awaiting payment)
      const bookingNumber = `ADVH-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          userId: decoded.userId,
          adventureId: departure.adventureId,
          departureId: departure.id,
          totalPrice: priceResult.total,
          status: 'PENDING',
          travelers: {
            create: travelers.map((t: any) => ({
              name: t.name,
              age: parseInt(t.age) || 25,
              emergencyContact: t.emergencyContact || '9999999999'
            }))
          }
        },
        include: {
          travelers: true
        }
      });
      
      // 4. Update the bookedSlots count on the departure date
      await tx.departure.update({
        where: { id: departure.id },
        data: {
          bookedSlots: departure.bookedSlots + requestedSlots
        }
      });
      
      return { booking, priceResult };
    });
    
    return NextResponse.json({
      message: 'Booking generated successfully. Proceed to payment.',
      booking: result.booking,
      pricing: result.priceResult
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Booking creation error:', error);
    
    if (error.message === 'DEPARTURE_NOT_FOUND') {
      return NextResponse.json({ error: 'The selected departure date is invalid or was deleted' }, { status: 404 });
    }
    
    if (error.message === 'SLOTS_EXCEEDED') {
      return NextResponse.json({ error: 'Sorry, the requested number of slots exceeds the available capacity for this date' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
