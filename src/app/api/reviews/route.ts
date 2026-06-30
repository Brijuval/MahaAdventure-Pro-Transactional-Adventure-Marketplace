import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// POST: Submit a review for an adventure
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
    const { adventureId, rating, comment } = body;
    
    if (!adventureId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing review parameters' }, { status: 400 });
    }
    
    const parsedRating = parseInt(rating);
    if (parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }
    
    // Check if user has already reviewed this adventure
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_adventureId: {
          userId: decoded.userId,
          adventureId: adventureId
        }
      }
    });
    
    if (existingReview) {
      return NextResponse.json({ 
        error: 'You have already submitted a review for this adventure experience.' 
      }, { status: 409 });
    }
    
    // Check if user has booked this adventure (optional but shows real SDE depth: only allow people who have booked to review!)
    const booking = await prisma.booking.findFirst({
      where: {
        userId: decoded.userId,
        adventureId: adventureId,
        status: 'CONFIRMED' // Or COMPLETED
      }
    });
    
    if (!booking) {
      return NextResponse.json({ 
        error: 'You can only review adventures that you have successfully booked and paid for.' 
      }, { status: 403 });
    }
    
    // Create review
    const review = await prisma.review.create({
      data: {
        userId: decoded.userId,
        adventureId,
        rating: parsedRating,
        comment
      }
    });
    
    return NextResponse.json({
      message: 'Review submitted successfully. Thank you for your feedback!',
      review
    }, { status: 201 });
    
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
