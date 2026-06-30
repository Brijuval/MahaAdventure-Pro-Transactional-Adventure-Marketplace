import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    
    if (!q || q.trim().length < 2) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }
    
    const query = q.trim();
    
    // Fetch matching adventures (approved only)
    const adventures = await prisma.adventure.findMany({
      where: {
        isApproved: true,
        OR: [
          { title: { contains: query } },
          { region: { contains: query } },
          { category: { contains: query } }
        ]
      },
      select: {
        title: true,
        region: true,
        category: true
      },
      take: 8
    });
    
    // Aggregate unique suggestions
    const suggestionsSet = new Set<string>();
    
    adventures.forEach(adv => {
      // 1. Check title
      if (adv.title.toLowerCase().includes(query.toLowerCase())) {
        suggestionsSet.add(adv.title);
      }
      // 2. Check region
      if (adv.region.toLowerCase().includes(query.toLowerCase())) {
        suggestionsSet.add(adv.region.charAt(0) + adv.region.slice(1).toLowerCase());
      }
    });
    
    // Add custom helper badges if query matches categories
    const categories = ['TREKKING', 'CAMPING', 'WATER_SPORTS', 'WILDLIFE', 'PARAGLIDING'];
    categories.forEach(cat => {
      if (cat.toLowerCase().includes(query.toLowerCase())) {
        suggestionsSet.add(cat.replace('_', ' '));
      }
    });
    
    return NextResponse.json(
      { suggestions: Array.from(suggestionsSet).slice(0, 5) },
      { status: 200 }
    );
  } catch (error) {
    console.error('Suggest API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
