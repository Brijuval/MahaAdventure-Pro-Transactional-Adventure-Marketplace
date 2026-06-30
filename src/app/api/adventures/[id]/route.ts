import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 1. GET: Fetch a single adventure details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const adventure = await prisma.adventure.findUnique({
      where: { id },
      include: {
        itinerary: { orderBy: { day: 'asc' } },
        inclusions: true,
        exclusions: true,
        essentials: true,
        departures: {
          orderBy: { date: 'asc' }
        },
        reviews: {
          include: {
            user: {
              select: {
                username: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        operator: {
          select: {
            companyName: true,
            isApproved: true,
          }
        }
      }
    });
    
    if (!adventure) {
      return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
    }
    
    // Calculate aggregate ratings
    const totalReviews = adventure.reviews.length;
    const averageRating = totalReviews > 0
      ? parseFloat((adventure.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
      : 0;
      
    return NextResponse.json(
      { 
        adventure: {
          ...adventure,
          averageRating,
          totalReviews
        } 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch adventure details error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

// 2. PUT: Update an adventure listing (Operator owner or Admin only)
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
    if (!decoded || (decoded.role !== 'OPERATOR' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Operator access required' }, { status: 403 });
    }
    
    // Fetch adventure to check ownership
    const adventure = await prisma.adventure.findUnique({
      where: { id },
      include: { operator: true }
    });
    
    if (!adventure) {
      return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
    }
    
    // Check if operator owns it (or is admin)
    if (decoded.role !== 'ADMIN') {
      const operatorProfile = await prisma.operatorProfile.findUnique({
        where: { userId: decoded.userId }
      });
      if (!operatorProfile || adventure.operatorId !== operatorProfile.id) {
        return NextResponse.json({ error: 'Forbidden: You do not own this adventure listing' }, { status: 403 });
      }
    }
    
    const body = await req.json();
    const {
      title,
      category,
      region,
      difficulty,
      durationDays,
      basePrice,
      description,
      imageUrl,
      latitude,
      longitude,
      fitnessLevel,
      bestSeason,
      meetingPoint,
      emergencyHospital,
      emergencyPolice,
      isApproved // Only Admin can toggle approval
    } = body;
    
    const updateData: any = {};
    if (title) updateData.title = title;
    if (category) updateData.category = category;
    if (region) updateData.region = region;
    if (difficulty) updateData.difficulty = difficulty;
    if (durationDays) updateData.durationDays = parseInt(durationDays);
    if (basePrice) updateData.basePrice = parseFloat(basePrice);
    if (description) updateData.description = description;
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (latitude) updateData.latitude = parseFloat(latitude);
    if (longitude) updateData.longitude = parseFloat(longitude);
    if (fitnessLevel) updateData.fitnessLevel = parseInt(fitnessLevel);
    if (bestSeason) updateData.bestSeason = bestSeason;
    if (meetingPoint) updateData.meetingPoint = meetingPoint;
    if (emergencyHospital) updateData.emergencyHospital = emergencyHospital;
    if (emergencyPolice) updateData.emergencyPolice = emergencyPolice;
    
    // Guard Admin toggles
    if (decoded.role === 'ADMIN' && typeof isApproved === 'boolean') {
      updateData.isApproved = isApproved;
    }
    
    const updated = await prisma.adventure.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({ message: 'Adventure updated successfully', adventure: updated }, { status: 200 });
  } catch (error) {
    console.error('Update adventure error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 3. DELETE: Remove an adventure listing (Operator owner or Admin only)
export async function DELETE(
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
    if (!decoded || (decoded.role !== 'OPERATOR' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Access restricted' }, { status: 403 });
    }
    
    // Fetch adventure to check ownership
    const adventure = await prisma.adventure.findUnique({
      where: { id },
      include: { operator: true }
    });
    
    if (!adventure) {
      return NextResponse.json({ error: 'Adventure not found' }, { status: 404 });
    }
    
    // Check if operator owns it (or is admin)
    if (decoded.role !== 'ADMIN') {
      const operatorProfile = await prisma.operatorProfile.findUnique({
        where: { userId: decoded.userId }
      });
      if (!operatorProfile || adventure.operatorId !== operatorProfile.id) {
        return NextResponse.json({ error: 'Forbidden: You do not own this adventure listing' }, { status: 403 });
      }
    }
    
    await prisma.adventure.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Adventure deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete adventure error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
