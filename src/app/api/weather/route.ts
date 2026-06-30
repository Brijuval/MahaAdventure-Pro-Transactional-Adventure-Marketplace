import { NextResponse } from 'next/server';
import { fetchLiveWeather } from '@/lib/weather';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');
    const category = searchParams.get('category') || '';
    
    if (!latStr || !lonStr) {
      return NextResponse.json({ error: 'Missing coordinates (lat, lon)' }, { status: 400 });
    }
    
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    
    const weather = await fetchLiveWeather(lat, lon, category);
    
    if (!weather) {
      return NextResponse.json({ error: 'Failed to retrieve weather data' }, { status: 500 });
    }
    
    return NextResponse.json({ weather }, { status: 200 });
  } catch (error) {
    console.error('Weather API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
