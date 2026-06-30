import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 1. GET: Fetch list of adventures with advanced filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const region = searchParams.get('region');
    const difficulty = searchParams.get('difficulty');
    const query = searchParams.get('query') || searchParams.get('search') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const includeUnapproved = searchParams.get('includeUnapproved') === 'true'; // For operator/admin dashboards

    const where: any = {};

    // By default, hide unapproved adventures unless explicitly requested (e.g. by operator/admin)
    if (!includeUnapproved) {
      where.isApproved = true;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (region && region !== 'ALL') {
      where.region = region;
    }
    if (difficulty && difficulty !== 'ALL') {
      where.difficulty = difficulty;
    }

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
    }

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { region: { contains: query } },
      ];
    }

    const adventures = await prisma.adventure.findMany({
      where,
      include: {
        operator: {
          select: {
            companyName: true,
            isApproved: true,
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map to include average rating
    const formattedAdventures = adventures.map(adv => {
      const totalReviews = adv.reviews.length;
      const averageRating = totalReviews > 0
        ? parseFloat((adv.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;
      
      // Remove raw reviews from object to save payload size
      const { reviews, ...rest } = adv;
      return {
        ...rest,
        averageRating,
        totalReviews
      };
    });

    return NextResponse.json({ adventures: formattedAdventures }, { status: 200 });
  } catch (error) {
    console.error('Fetch adventures error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}

// 2. POST: Create a new adventure listing (Operator only, requires approval profile)
export async function POST(req: Request) {
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
    if (!decoded || (decoded.role !== 'OPERATOR' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Operator access required' }, { status: 403 });
    }
    
    // Check if operator profile exists and is approved
    const operatorProfile = await prisma.operatorProfile.findUnique({
      where: { userId: decoded.userId }
    });
    
    if (!operatorProfile) {
      return NextResponse.json({ error: 'Forbidden: Operator profile not found' }, { status: 403 });
    }
    
    if (!operatorProfile.isApproved && decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Your operator account is pending admin approval. You cannot list adventures yet.' }, 
        { status: 403 }
      );
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
      itinerary,   // Array of {day: number, title: string, description: string}
      inclusions,  // Array of string
      exclusions,  // Array of string
      essentials,  // Array of string
      departures   // Array of Date strings or Dates
    } = body;
    
    // Basic Input Validations
    if (!title || !category || !region || !difficulty || !basePrice || !description) {
      return NextResponse.json({ error: 'Missing required adventure fields' }, { status: 400 });
    }
    
    // Transactional creation
    const newAdventure = await prisma.$transaction(async (tx) => {
      const adventure = await tx.adventure.create({
        data: {
          title,
          category,
          region,
          difficulty,
          durationDays: parseInt(durationDays) || 1,
          basePrice: parseFloat(basePrice),
          description,
          imageUrl: imageUrl || '/assets/default_adventure.png',
          latitude: parseFloat(latitude) || 19.0,
          longitude: parseFloat(longitude) || 73.0,
          fitnessLevel: parseInt(fitnessLevel) || 3,
          bestSeason: bestSeason || 'Year-round',
          meetingPoint: meetingPoint || 'To be shared by operator',
          emergencyHospital: emergencyHospital || 'Local District Hospital',
          emergencyPolice: emergencyPolice || 'Local Police Beat Station',
          operatorId: operatorProfile.id,
          isApproved: decoded.role === 'ADMIN', // Auto-approved if created by admin
          
          itinerary: {
            create: (itinerary || []).map((step: any) => ({
              day: parseInt(step.day),
              title: step.title,
              description: step.description,
            }))
          },
          inclusions: {
            create: (inclusions || []).map((text: string) => ({ text }))
          },
          exclusions: {
            create: (exclusions || []).map((text: string) => ({ text }))
          },
          essentials: {
            create: (essentials || []).map((text: string) => ({ text }))
          },
          departures: {
            create: (departures || []).map((dateStr: string) => ({
              date: new Date(dateStr),
              maxCapacity: 20, // default capacity
              bookedSlots: 0
            }))
          }
        }
      });
      
      return adventure;
    });
    
    return NextResponse.json(
      { 
        message: 'Adventure listing created successfully. Awaiting administrator verification.', 
        adventure: newAdventure 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Create adventure error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
