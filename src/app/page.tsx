'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MaharashtraMap from '@/components/MaharashtraMap';
import { Compass, Search, MapPin, Star, Calendar, Clock, ChevronRight, Award, Users, ThumbsUp, ShieldCheck } from 'lucide-react';

interface Adventure {
  id: string;
  title: string;
  category: string;
  region: string;
  difficulty: string;
  durationDays: number;
  basePrice: number;
  imageUrl: string;
  averageRating: number;
  totalReviews: number;
}

export default function HomePage() {
  const router = useRouter();
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const suggestionRef = useRef<HTMLFormElement>(null);
  
  // Map and Listing filter states
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TRENDING' | 'MOST_BOOKED' | 'WEEKEND_PICKS' | 'FAMILY_FRIENDLY'>('TRENDING');

  // Click outside suggestions close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/adventures/suggest?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchSuggestions();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch adventures
  useEffect(() => {
    const fetchAdventures = async () => {
      setLoading(true);
      try {
        let url = '/api/adventures';
        const params = [];
        if (selectedRegion !== 'ALL') {
          params.push(`region=${selectedRegion}`);
        }
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setAdventures(data.adventures);
        }
      } catch (err) {
        console.error('Failed to fetch adventures:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdventures();
  }, [selectedRegion]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/adventures?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/adventures');
    }
  };

  const handleSuggestionClick = (val: string) => {
    setSearchQuery(val);
    setSuggestionsOpen(false);
    router.push(`/adventures?search=${encodeURIComponent(val)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setSuggestionsOpen(false);
    }
  };

  // Helper to filter adventures for the active tab (mock logic on client based on seeded data)
  const getFilteredAdventures = () => {
    if (activeTab === 'TRENDING') {
      // Return highest rated
      return [...adventures].sort((a, b) => b.averageRating - a.averageRating).slice(0, 4);
    }
    if (activeTab === 'MOST_BOOKED') {
      // Sort by reviews count
      return [...adventures].sort((a, b) => b.totalReviews - a.totalReviews).slice(0, 4);
    }
    if (activeTab === 'WEEKEND_PICKS') {
      // Return 1 day trips or moderate difficulty
      return adventures.filter(a => a.durationDays === 1).slice(0, 4);
    }
    if (activeTab === 'FAMILY_FRIENDLY') {
      // Return EASY difficulty
      return adventures.filter(a => a.difficulty === 'EASY').slice(0, 4);
    }
    return adventures.slice(0, 4);
  };

  const currentTabAdventures = getFilteredAdventures();

  return (
    <div className="flex-grow pb-16">
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background contours */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-primary">
            <Compass className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            Discover Maharashtra Outdoors
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] animate-slide-up">
            Uncover Maharashtra's <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Greatest Weekend Getaways
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-medium">
            Book verified adventures from local guides. Trek the tallest Sahyadri peaks, camp by sparkling lakes, and ride the rapids of Kundalika.
          </p>

          {/* Autocomplete Search Form */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mt-8 relative" ref={suggestionRef}>
            <div className="relative flex items-center bg-card rounded-2xl border border-border shadow-lg p-2.5 overflow-hidden text-card-foreground">
              <Search className="h-5 w-5 text-muted ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search 'Kalsubai Trek', 'Kolad Rafting' or 'Camping'..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSuggestionsOpen(true);
                  setActiveSuggestionIndex(-1);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none placeholder-muted font-medium text-foreground"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-sm transition-colors text-sm cursor-pointer"
              >
                Search
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {suggestionsOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-card text-card-foreground border border-border rounded-xl shadow-2xl z-30 text-left overflow-hidden py-1 animate-slide-up">
                {suggestions.map((item, idx) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSuggestionClick(item)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-secondary hover:bg-muted-light border-b border-border last:border-0 text-left cursor-pointer ${
                      activeSuggestionIndex === idx ? 'bg-muted-light text-primary font-bold' : ''
                    }`}
                  >
                    <Compass className="h-4 w-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Hero Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-800/60 max-w-3xl mx-auto text-center">
            <div>
              <div className="text-3xl font-extrabold text-white">250+</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Experiences</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">45+</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Verified Operators</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">12K+</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Happy Travelers</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white flex justify-center items-center gap-1">
                4.9<Star className="h-4.5 w-4.5 fill-accent stroke-accent" />
              </div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Top Activities</span>
          <h2 className="text-3xl font-bold tracking-tight text-secondary">Choose Your Adventure Type</h2>
          <p className="text-muted text-sm max-w-md mx-auto">
            From scaling cliff faces to diving deep into clear waters, filter by your favorite outdoor sport:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { cat: 'TREKKING', label: 'Trekking & Hiking', icon: '🧗', desc: 'Climb peaks & ridges', color: 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10' },
            { cat: 'CAMPING', label: 'Lakeside Camping', icon: '⛺', desc: 'Stargaze under tents', color: 'border-amber-200 bg-amber-50/30 dark:bg-amber-950/10' },
            { cat: 'WATER_SPORTS', label: 'Rafting & Scuba', icon: '🚣', desc: 'River rapids & ocean dives', color: 'border-sky-200 bg-sky-50/30 dark:bg-sky-950/10' },
            { cat: 'WILDLIFE', label: 'Wildlife Safaris', icon: '🐅', desc: 'Jungle safaris & birds', color: 'border-green-200 bg-green-50/30 dark:bg-green-950/10' },
            { cat: 'PARAGLIDING', label: 'Paragliding', icon: '🪂', desc: 'Sore above scenic hills', color: 'border-purple-200 bg-purple-50/30 dark:bg-purple-950/10' },
          ].map((item) => (
            <Link
              key={item.cat}
              href={`/adventures?category=${item.cat}`}
              className={`flex flex-col items-center text-center p-6 rounded-2xl border border-border hover-lift cursor-pointer ${item.color}`}
            >
              <span className="text-4xl mb-3">{item.icon}</span>
              <h3 className="font-bold text-sm text-secondary">{item.label}</h3>
              <p className="text-[11px] text-muted mt-1 leading-tight">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Interactive Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <MaharashtraMap activeRegion={selectedRegion} onSelectRegion={setSelectedRegion} />
      </section>

      {/* 4. Filtered Adventures Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {selectedRegion === 'ALL' ? 'Maharashtra Wide' : `${selectedRegion} Region`} Listings
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-secondary">
              {selectedRegion === 'ALL' ? 'Featured Getaways' : `Adventures in ${selectedRegion}`}
            </h2>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex bg-muted-light/65 border border-border p-1 rounded-xl w-max overflow-x-auto no-scrollbar">
            {[
              { id: 'TRENDING', label: '🔥 Trending' },
              { id: 'MOST_BOOKED', label: '📈 Most Booked' },
              { id: 'WEEKEND_PICKS', label: '🎒 1-Day Picks' },
              { id: 'FAMILY_FRIENDLY', label: '☘️ Easy/Family' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-card text-primary shadow-sm font-bold'
                    : 'text-muted hover:text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Display */}
        {loading ? (
          /* Skeletons rendering */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm flex flex-col h-[380px]">
                <div className="w-full h-44 shimmer"></div>
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-16 h-4 rounded shimmer"></div>
                    <div className="w-full h-5 rounded shimmer"></div>
                    <div className="w-2/3 h-5 rounded shimmer"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="w-12 h-4 rounded shimmer"></div>
                      <div className="w-16 h-4 rounded shimmer"></div>
                    </div>
                    <div className="w-full h-9 rounded-xl shimmer"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : currentTabAdventures.length === 0 ? (
          /* Empty state rendering */
          <div className="text-center py-16 border border-border bg-card rounded-2xl shadow-sm max-w-xl mx-auto space-y-4">
            <span className="text-4xl">🏕️</span>
            <h3 className="font-bold text-lg text-secondary">No adventures found in this zone</h3>
            <p className="text-muted text-sm max-w-xs mx-auto">
              We don't have any listings approved in the {selectedRegion.toLowerCase()} region yet.
            </p>
            <button
              onClick={() => setSelectedRegion('ALL')}
              className="px-4 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors text-xs cursor-pointer"
            >
              Browse All Maharashtra
            </button>
          </div>
        ) : (
          /* Cards Grid rendering */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentTabAdventures.map((adv) => (
              <div
                key={adv.id}
                className="group border border-border bg-card text-card-foreground rounded-2xl overflow-hidden shadow-sm hover-lift flex flex-col h-[400px] relative"
              >
                {/* Badge Category */}
                <span className="absolute top-3 left-3 z-10 text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-slate-800 dark:bg-slate-900/95 dark:text-white px-2 py-0.5 rounded-full shadow-sm">
                  {adv.category.replace('_', ' ')}
                </span>
                
                {/* Image */}
                <div className="relative w-full h-44 overflow-hidden bg-muted-light">
                  <img
                    src={adv.imageUrl}
                    alt={adv.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Region & Difficulty */}
                    <div className="flex items-center justify-between text-xs text-muted font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        {adv.region.charAt(0) + adv.region.slice(1).toLowerCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        adv.difficulty === 'EASY'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/10 dark:text-emerald-400'
                          : adv.difficulty === 'MODERATE'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/10 dark:text-amber-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/10 dark:text-red-400'
                      }`}>
                        {adv.difficulty}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-base text-secondary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {adv.title}
                    </h3>
                  </div>

                  {/* Pricing and Reviews */}
                  <div className="space-y-4 pt-3 border-t border-border">
                    {/* Time & Rating */}
                    <div className="flex items-center justify-between text-xs text-muted font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {adv.durationDays} {adv.durationDays === 1 ? 'Day' : 'Days'}
                      </span>
                      
                      {adv.totalReviews > 0 ? (
                        <span className="flex items-center gap-0.5 font-bold text-secondary">
                          <Star className="h-3.5 w-3.5 fill-accent stroke-accent" />
                          {adv.averageRating}
                          <span className="font-normal text-muted">({adv.totalReviews})</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-muted-light text-muted px-1.5 py-0.5 rounded font-bold">New</span>
                      )}
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted block leading-none">Starting from</span>
                        <span className="text-lg font-extrabold text-secondary">₹{adv.basePrice}</span>
                        <span className="text-[10px] text-muted">/person</span>
                      </div>
                      
                      <Link
                        href={`/adventures/${adv.id}`}
                        className="p-2.5 rounded-xl bg-primary-light text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200 cursor-pointer"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Trust / Safety Features */}
      <section className="bg-muted-light/25 border-y border-border py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-2 mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Adventure Safety Hub</span>
            <h2 className="text-3xl font-bold tracking-tight text-secondary">Why Book With Us?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-primary w-max rounded-xl">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-secondary">Verified Local Guides</h3>
              <p className="text-muted text-sm leading-relaxed">
                All operator profiles undergo verification checks and MTDC certification approvals before listings are approved.
              </p>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-primary w-max rounded-xl">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-secondary">Capacity Lock</h3>
              <p className="text-muted text-sm leading-relaxed">
                Our transaction-safe engine secures your slots immediately. Real-time calendar availability prevents overbookings.
              </p>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-primary w-max rounded-xl">
                <ThumbsUp className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-secondary">Dynamic Cost breaks</h3>
              <p className="text-muted text-sm leading-relaxed">
                Server-side pricing adjusts based on traveler size, coupon codes, and lead times, giving you the best rates.
              </p>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-primary w-max rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-secondary">On-Ground Essentials</h3>
              <p className="text-muted text-sm leading-relaxed">
                Every detail sheet lists emergency police/hospital contacts, packing lists, coordinates, and live weather advisories.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
