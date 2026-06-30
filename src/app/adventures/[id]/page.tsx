'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { calculatePrice, PriceBreakdown } from '@/lib/pricing';
import { 
  MapPin, Star, Calendar, Clock, ShieldAlert, Check, X, Shield, 
  Heart, Share2, Users, Tent, Sparkles, Phone, Compass, Info, Thermometer
} from 'lucide-react';

interface ItineraryStep {
  id: string;
  day: number;
  title: string;
  description: string;
}

interface Inclusion {
  id: string;
  text: string;
}

interface Exclusion {
  id: string;
  text: string;
}

interface EssentialItem {
  id: string;
  text: string;
}

interface Departure {
  id: string;
  date: string;
  maxCapacity: number;
  bookedSlots: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    username: string;
  };
}

interface Adventure {
  id: string;
  title: string;
  category: string;
  region: string;
  difficulty: string;
  durationDays: number;
  basePrice: number;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  fitnessLevel: number;
  bestSeason: string;
  meetingPoint: string;
  emergencyHospital: string;
  emergencyPolice: string;
  averageRating: number;
  totalReviews: number;
  itinerary: ItineraryStep[];
  inclusions: Inclusion[];
  exclusions: Exclusion[];
  essentials: EssentialItem[];
  departures: Departure[];
  reviews: Review[];
  operator: {
    companyName: string;
  };
}

interface WeatherData {
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
  weatherText: string;
  windSpeed: number;
  safetyAlert?: string;
  icon: string;
}

export default function AdventureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuth();
  
  // Data states
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Booking Form states
  const [selectedDepartureId, setSelectedDepartureId] = useState('');
  const [travelerCount, setTravelerCount] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  // Pricing states
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);

  // Fetch adventure details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/adventures/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAdventure(data.adventure);
          
          // Check if adventure is wishlisted by fetching user wishlist
          if (user && user.role === 'CUSTOMER') {
            const wlRes = await fetch('/api/wishlist');
            if (wlRes.ok) {
              const wlData = await wlRes.json();
              const isWish = wlData.wishlist.some((item: any) => item.adventure.id === id);
              setWishlisted(isWish);
            }
          }
        } else {
          router.push('/adventures');
        }
      } catch (err) {
        console.error('Failed to fetch adventure detail:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [id, user]);

  // Fetch live weather once adventure details are loaded
  useEffect(() => {
    if (!adventure) return;
    
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?lat=${adventure.latitude}&lon=${adventure.longitude}&category=${adventure.category}`);
        if (res.ok) {
          const data = await res.json();
          setWeather(data.weather);
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err);
      } finally {
        setWeatherLoading(false);
      }
    };
    
    fetchWeather();
  }, [adventure]);

  // Calculate pricing whenever inputs change
  useEffect(() => {
    if (!adventure || !selectedDepartureId) {
      setPricing(null);
      return;
    }
    
    const departure = adventure.departures.find(d => d.id === selectedDepartureId);
    if (!departure) return;
    
    const calculated = calculatePrice(
      adventure.basePrice,
      travelerCount,
      new Date(departure.date),
      couponApplied ? couponCode : undefined
    );
    
    setPricing(calculated);
  }, [adventure, selectedDepartureId, travelerCount, couponApplied]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    
    if (code === 'MAHA20' || code === 'ADVENTURE10' || code === 'WELCOME500') {
      setCouponApplied(true);
    } else {
      setCouponError('Invalid promo code');
      setCouponApplied(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    if (user.role !== 'CUSTOMER') {
      alert('Wishlist is only available for customer accounts.');
      return;
    }
    
    setWishlistLoading(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adventureId: id }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setWishlisted(data.isWishlisted);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    
    if (user.role !== 'CUSTOMER') {
      alert('Only Customer accounts can book adventure packages.');
      return;
    }
    
    if (!selectedDepartureId) {
      alert('Please select a departure date.');
      return;
    }
    
    // Redirect to checkout wizard with params
    const params = new URLSearchParams({
      departureId: selectedDepartureId,
      travelerCount: travelerCount.toString(),
    });
    if (couponApplied) {
      params.append('coupon', couponCode.toUpperCase().trim());
    }
    
    router.push(`/checkout?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-20">
        <Compass className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!adventure) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-20 space-y-4">
        <ShieldAlert className="h-12 w-12 text-danger" />
        <h2 className="text-xl font-bold text-secondary">Adventure Not Found</h2>
        <Link href="/adventures" className="text-primary font-bold hover:underline">
          Return to Explore
        </Link>
      </div>
    );
  }

  const selectedDeparture = adventure.departures.find(d => d.id === selectedDepartureId);
  const slotsRemaining = selectedDeparture ? selectedDeparture.maxCapacity - selectedDeparture.bookedSlots : 0;

  return (
    <div className="flex-grow bg-background text-foreground pb-20">
      
      {/* 1. Header Banner & Title */}
      <section className="relative w-full h-[65vh] bg-slate-950 overflow-hidden">
        <img src={adventure.imageUrl} className="w-full h-full object-cover opacity-60" alt={adventure.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        
        {/* Banner Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white uppercase tracking-wider">
              {adventure.category.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-white border border-white/20">
              📍 {adventure.region.charAt(0) + adventure.region.slice(1).toLowerCase()}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-white border border-white/20">
              🧗 {adventure.difficulty}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-4xl">
            {adventure.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="h-4.5 w-4.5 text-primary" />
              Duration: {adventure.durationDays} {adventure.durationDays === 1 ? 'Day' : 'Days'}
            </span>
            {adventure.totalReviews > 0 ? (
              <span className="flex items-center gap-1">
                <Star className="h-4.5 w-4.5 fill-accent stroke-accent" />
                {adventure.averageRating} ({adventure.totalReviews} Reviews)
              </span>
            ) : (
              <span className="text-primary font-bold">★ New Adventure</span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-primary" />
              Organized by: <span className="text-white font-bold">{adventure.operator.companyName}</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Page Content: Left info columns, Right booking card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Adventures info, itinerary, etc.) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Overview text */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-secondary border-b border-border pb-3">
              Expedition Overview
            </h2>
            <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">
              {adventure.description}
            </p>
          </div>

          {/* Live Weather Widget */}
          <div className="border border-border bg-card text-card-foreground p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-secondary flex items-center gap-2 text-base">
                <Thermometer className="h-5 w-5 text-primary" />
                Live Weather & Safety Checklist
              </h3>
              <span className="text-[10px] font-bold text-muted bg-muted-light px-2 py-0.5 rounded-full">
                Powered by Open-Meteo
              </span>
            </div>

            {weatherLoading ? (
              <div className="flex items-center justify-center py-4">
                <Clock className="h-5 w-5 text-muted animate-spin" />
              </div>
            ) : weather ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2.5 p-3 bg-muted-light/35 rounded-xl border border-border">
                    <span className="text-3xl shrink-0">{weather.icon}</span>
                    <div>
                      <span className="text-[10px] text-muted block leading-none">Condition</span>
                      <span className="text-xs font-bold text-secondary">{weather.weatherText}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-muted-light/35 rounded-xl border border-border">
                    <span className="text-[10px] text-muted block leading-none">Temperature</span>
                    <span className="text-sm font-extrabold text-secondary">{weather.temperature}°C</span>
                    <span className="text-[9px] text-muted block">Feels like: {weather.apparentTemperature}°C</span>
                  </div>

                  <div className="p-3 bg-muted-light/35 rounded-xl border border-border">
                    <span className="text-[10px] text-muted block leading-none">Rain Level</span>
                    <span className="text-sm font-extrabold text-secondary">{weather.precipitation} mm</span>
                  </div>

                  <div className="p-3 bg-muted-light/35 rounded-xl border border-border">
                    <span className="text-[10px] text-muted block leading-none">Wind Velocity</span>
                    <span className="text-sm font-extrabold text-secondary">{weather.windSpeed} km/h</span>
                  </div>
                </div>

                {/* Weather safety alert box */}
                {weather.safetyAlert && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex gap-2">
                    <span className="shrink-0 text-base">⚠️</span>
                    <p className="leading-relaxed font-semibold">{weather.safetyAlert}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted">Weather data temporarily unavailable.</p>
            )}
          </div>

          {/* Trip Essentials (Packing list, Emergency numbers, meeting details) */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-secondary border-b border-border pb-3">
              Trip Essentials
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* packing checklist */}
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3.5">
                <h3 className="font-bold text-secondary text-sm flex items-center gap-1.5">
                  <Tent className="h-4.5 w-4.5 text-primary" />
                  What to Carry (Packing List)
                </h3>
                {adventure.essentials.length > 0 ? (
                  <ul className="space-y-2 text-xs text-muted">
                    {adventure.essentials.map((item) => (
                      <li key={item.id} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted italic">Standard camping/trekking gear.</p>
                )}
              </div>

              {/* logistics, best season, emergencies */}
              <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-secondary text-sm flex items-center gap-1.5">
                  <Shield className="h-4.5 w-4.5 text-primary" />
                  Logistics & Safety Guides
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-secondary block">Best Season to Visit:</span>
                    <span className="text-muted">{adventure.bestSeason}</span>
                  </div>
                  <div>
                    <span className="font-bold text-secondary block">Physical Fitness Required:</span>
                    <div className="text-accent font-bold mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < adventure.fitnessLevel ? 'text-accent' : 'text-slate-200'}>
                          ★
                        </span>
                      ))}
                      <span className="text-muted font-normal text-[10px] ml-1">({adventure.fitnessLevel}/5 difficulty rating)</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-secondary block">Assemble Meeting Location:</span>
                    <span className="text-muted flex items-center gap-0.5 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      {adventure.meetingPoint}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border space-y-2">
                    <span className="font-bold text-secondary block text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400">Emergency Contacts</span>
                    <div className="space-y-1 text-[11px] text-muted">
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-red-500 shrink-0" />
                        Hospital: {adventure.emergencyHospital}
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-red-500 shrink-0" />
                        Police Beat: {adventure.emergencyPolice}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Itinerary steps */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-secondary border-b border-border pb-3">
              Itinerary Schedule
            </h2>
            <div className="relative border-l border-border pl-6 ml-4 space-y-8">
              {adventure.itinerary.map((step) => (
                <div key={step.id} className="relative">
                  {/* Timeline Bubble icon */}
                  <span className="absolute -left-[35px] top-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold shadow-sm">
                    {step.day}
                  </span>
                  <div className="space-y-1">
                    <h4 className="font-bold text-secondary text-sm">{step.title}</h4>
                    <p className="text-muted text-xs leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inclusions and Exclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold text-secondary text-sm flex items-center gap-1">
                <Check className="h-4.5 w-4.5 text-primary" /> Included Costs
              </h4>
              <ul className="space-y-2 text-xs text-muted">
                {adventure.inclusions.map((inc) => (
                  <li key={inc.id} className="flex items-start gap-2">
                    <span className="text-primary shrink-0">✔</span>
                    <span>{inc.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-secondary text-sm flex items-center gap-1">
                <X className="h-4.5 w-4.5 text-red-500" /> Excluded Costs
              </h4>
              <ul className="space-y-2 text-xs text-muted">
                {adventure.exclusions.map((exc) => (
                  <li key={exc.id} className="flex items-start gap-2">
                    <span className="text-red-500 shrink-0">✖</span>
                    <span>{exc.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-secondary border-b border-border pb-3">
              Customer Feedbacks & Reviews
            </h2>

            {adventure.reviews.length === 0 ? (
              <div className="text-center py-8 border border-border bg-card rounded-2xl text-muted text-xs italic">
                No reviews posted yet for this package. Have you booked it? Be the first to review once completed!
              </div>
            ) : (
              <div className="space-y-4">
                {adventure.reviews.map((rev) => (
                  <div key={rev.id} className="border border-border bg-card p-5 rounded-2xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center">
                          {rev.user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-secondary text-xs">{rev.user.username}</span>
                          <span className="text-[10px] text-muted block">
                            Reviewed on: {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-accent text-sm font-bold">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < rev.rating ? 'text-accent' : 'text-slate-200'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-secondary text-xs leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Columns (Sticky Booking widget) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 border border-border bg-card text-card-foreground p-6 rounded-2xl shadow-md space-y-6">
            
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] text-muted block leading-none">Tour Price</span>
                <span className="text-2xl font-extrabold text-secondary">₹{adventure.basePrice}</span>
                <span className="text-xs text-muted">/ person</span>
              </div>
              
              {/* Wishlist Button */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`p-2.5 rounded-xl border border-border transition-colors cursor-pointer ${
                  wishlisted 
                    ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                    : 'bg-card hover:bg-muted-light text-muted hover:text-secondary'
                }`}
              >
                <Heart className={`h-5 w-5 ${wishlisted ? 'fill-red-500' : ''}`} />
              </button>
            </div>

            {/* Booking Form widget */}
            <form onSubmit={handleBookSubmit} className="space-y-4">
              
              {/* Select Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                  Select Departure Date
                </label>
                <select
                  required
                  value={selectedDepartureId}
                  onChange={(e) => setSelectedDepartureId(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-3 text-xs text-secondary font-semibold focus:outline-none"
                >
                  <option value="">-- Choose Weekend Date --</option>
                  {adventure.departures.map((dep) => {
                    const date = new Date(dep.date);
                    const slotsLeft = dep.maxCapacity - dep.bookedSlots;
                    return (
                      <option key={dep.id} value={dep.id} disabled={slotsLeft <= 0}>
                        {date.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        {slotsLeft <= 0 ? ' (FULLY BOOKED)' : ` (${slotsLeft} slots remaining)`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Number of Travelers */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                  Travelers Size
                </label>
                <div className="flex items-center border border-border rounded-xl bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTravelerCount(prev => Math.max(1, prev - 1))}
                    className="p-3 text-secondary font-extrabold hover:bg-muted-light border-r border-border text-center w-12 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="flex-grow text-center font-bold text-xs text-secondary">
                    {travelerCount} {travelerCount === 1 ? 'Traveler' : 'Travelers'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDepartureId && travelerCount >= slotsRemaining) {
                        alert(`Only ${slotsRemaining} slots available on this departure date.`);
                        return;
                      }
                      setTravelerCount(prev => prev + 1);
                    }}
                    className="p-3 text-secondary font-extrabold hover:bg-muted-light border-l border-border text-center w-12 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                  Promo / Coupon Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. MAHA20, WELCOME500"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponApplied(false);
                      setCouponError('');
                    }}
                    className="flex-grow bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <span className="text-[10px] font-bold text-primary block">
                    ✔ Promo code applied successfully!
                  </span>
                )}
                {couponError && (
                  <span className="text-[10px] font-bold text-red-600 block">
                    ❌ {couponError}
                  </span>
                )}
              </div>

              {/* Live Cost breakdown receipts */}
              {pricing && (
                <div className="p-4 bg-muted-light/35 border border-border rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-secondary border-b border-border pb-1">Receipt Breakdown</h4>
                  <div className="flex justify-between text-muted">
                    <span>Base Price ({travelerCount} Person):</span>
                    <span>₹{pricing.subtotal}</span>
                  </div>
                  {pricing.weekendSurge > 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold">
                      <span className="flex items-center gap-0.5">Weekend Surcharge (+15%) <span title="Weekend dates experience increased logistics costs"><Info className="h-3 w-3" /></span></span>
                      <span>+₹{pricing.weekendSurge}</span>
                    </div>
                  )}
                  {pricing.groupDiscount > 0 && (
                    <div className="flex justify-between text-primary font-semibold">
                      <span>Group Discount (-10%):</span>
                      <span>-₹{pricing.groupDiscount}</span>
                    </div>
                  )}
                  {pricing.earlyBirdDiscount > 0 && (
                    <div className="flex justify-between text-primary font-semibold">
                      <span>Early Bird Discount (-5%):</span>
                      <span>-₹{pricing.earlyBirdDiscount}</span>
                    </div>
                  )}
                  {pricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-primary font-semibold">
                      <span>Promo Coupon Discount:</span>
                      <span>-₹{pricing.couponDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-secondary border-t border-border pt-2 mt-2">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{pricing.total}</span>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                type="submit"
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="h-4 w-4 animate-pulse" />
                Book Adventure Now
              </button>
            </form>

            {/* Safety badge summary */}
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-primary rounded-xl text-xs font-medium">
              <Shield className="h-5 w-5 shrink-0" />
              <p>Locked dates. Full refund if cancelled 48 hours prior. Verified local guide.</p>
            </div>

          </div>
        </div>

      </section>

    </div>
  );
}
