import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 1. GET: Fetch user's wishlist
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
    
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: decoded.userId },
      include: {
        adventure: {
          include: {
            reviews: { select: { rating: true } }
          }
        }
      }
    });
    
    // Format to include average rating
    const formatted = wishlist.map(item => {
      const adv = item.adventure;
      const totalReviews = adv.reviews.length;
      const averageRating = totalReviews > 0
        ? parseFloat((adv.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;
      
      const { reviews, ...rest } = adv;
      return {
        id: item.id,
        adventure: {
          ...rest,
          averageRating,
          totalReviews
        }
      };
    });
    
    return NextResponse.json({ wishlist: formatted }, { status: 200 });
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST: Toggle wishlist (Add if not present, remove if present)
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
    const { adventureId } = body;
    
    if (!adventureId) {
      return NextResponse.json({ error: 'Missing adventureId' }, { status: 400 });
    }
    
    // Check if item already exists in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_adventureId: {
          userId: decoded.userId,
          adventureId
        }
      }
    });
    
    if (existing) {
      // Remove it
      await prisma.wishlist.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ message: 'Removed from wishlist', isWishlisted: false }, { status: 200 });
    } else {
      // Add it
      const newItem = await prisma.wishlist.create({
        data: {
          userId: decoded.userId,
          adventureId
        }
      });
      return NextResponse.json({ message: 'Added to wishlist', isWishlisted: true, wishlist: newItem }, { status: 201 });
    }
    
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
