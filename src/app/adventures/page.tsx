'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Star, Clock, Filter, ArrowRight, ArrowUpDown, Layers, X, Info, Compass } from 'lucide-react';

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
  fitnessLevel: number;
  bestSeason: string;
}

function AdventuresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters from URL
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialRegion = searchParams.get('region') || 'ALL';
  const initialDifficulty = searchParams.get('difficulty') || 'ALL';

  // Filters state
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [region, setRegion] = useState(initialRegion);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [maxPrice, setMaxPrice] = useState<number>(5000);

  // Data states
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Comparison state
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Fetch adventures on filter changes
  useEffect(() => {
    const fetchFilteredData = async () => {
      setLoading(true);
      try {
        const queryParams = [];
        if (search) queryParams.push(`query=${encodeURIComponent(search)}`);
        if (category !== 'ALL') queryParams.push(`category=${category}`);
        if (region !== 'ALL') queryParams.push(`region=${region}`);
        if (difficulty !== 'ALL') queryParams.push(`difficulty=${difficulty}`);
        if (maxPrice) queryParams.push(`maxPrice=${maxPrice}`);

        let url = '/api/adventures';
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setAdventures(data.adventures);
        }
      } catch (err) {
        console.error('Failed fetching adventures:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredData();
  }, [search, category, region, difficulty, maxPrice]);

  // Sync inputs with URL params if they change externally
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || 'ALL');
    setRegion(searchParams.get('region') || 'ALL');
    setDifficulty(searchParams.get('difficulty') || 'ALL');
  }, [searchParams]);

  const handleToggleCompare = (id: string) => {
    setComparedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 adventures at a time.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('ALL');
    setRegion('ALL');
    setDifficulty('ALL');
    setMaxPrice(5000);
    router.push('/adventures');
  };

  const comparedAdventures = adventures.filter(a => comparedIds.includes(a.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow flex flex-col">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-secondary">
          Find Your Perfect Getaway
        </h1>
        <p className="text-muted text-sm mt-1">
          Explore and compare adventure packages, treks, and beach campings. Check live availability and pricing.
        </p>
      </div>

      {/* Grid: Filters Sidebar + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-grow">
        
        {/* Filters Sidebar */}
        <div className="space-y-6 lg:col-span-1 border border-border bg-card p-6 rounded-2xl shadow-sm h-max">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h3 className="font-bold text-secondary flex items-center gap-1.5 text-base">
              <Filter className="h-4.5 w-4.5 text-primary" />
              Advanced Filters
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Reset All
            </button>
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider">Search Keyword</label>
            <div className="relative flex items-center bg-muted-light/50 border border-border rounded-xl p-2.5 text-secondary">
              <Search className="h-4 w-4 text-muted mr-2" />
              <input
                type="text"
                placeholder="Trek, rafting, camping..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none placeholder-muted font-medium"
              />
            </div>
          </div>

          {/* Category Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block">Activity Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none"
            >
              <option value="ALL">All Activities</option>
              <option value="TREKKING">🧗 Trekking & Hiking</option>
              <option value="CAMPING">⛺ Lakeside Camping</option>
              <option value="WATER_SPORTS">🚣 Rafting & Scuba</option>
              <option value="WILDLIFE">🐅 Wildlife Safari</option>
              <option value="PARAGLIDING">🪂 Paragliding</option>
            </select>
          </div>

          {/* Region Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block">Zone Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none"
            >
              <option value="ALL">All Regions</option>
              <option value="PUNE">Pune & Sahyadri</option>
              <option value="MUMBAI">Mumbai & Lonavala</option>
              <option value="NASHIK">Nashik & Bhandardara</option>
              <option value="KONKAN">Konkan & Malvan</option>
              <option value="MAHABALESHWAR">Mahabaleshwar & Satara</option>
            </select>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none"
            >
              <option value="ALL">All Levels</option>
              <option value="EASY">☘️ Easy (Beginner-friendly)</option>
              <option value="MODERATE">⚡ Moderate (Requires basic fitness)</option>
              <option value="CHALLENGING">🔥 Challenging (Demanding trail)</option>
            </select>
          </div>

          {/* Price Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-secondary uppercase tracking-wider">
              <span>Max Budget</span>
              <span className="text-primary font-extrabold">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted font-bold">
              <span>₹500</span>
              <span>₹5000</span>
            </div>
          </div>
        </div>

        {/* Listings display (Grid of Cards) */}
        <div className="lg:col-span-3 flex flex-col">
          {loading ? (
            /* Skeleton Cards */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(idx => (
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
          ) : adventures.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center text-center py-20 border border-border bg-card rounded-2xl shadow-sm my-auto space-y-4">
              <span className="text-5xl">🧭</span>
              <h3 className="font-bold text-lg text-secondary">No adventures match your criteria</h3>
              <p className="text-muted text-sm max-w-xs mx-auto">
                Try widening your price range, resetting search keywords, or selecting another activity category.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover shadow-sm transition-colors text-xs cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            /* Grid Display */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {adventures.map((adv) => {
                const isCompared = comparedIds.includes(adv.id);
                return (
                  <div
                    key={adv.id}
                    className="group border border-border bg-card text-card-foreground rounded-2xl overflow-hidden shadow-sm hover-lift flex flex-col h-[400px] relative"
                  >
                    {/* Checkbox Compare absolute */}
                    <div className="absolute top-3 right-3 z-20 flex items-center bg-white/95 dark:bg-slate-900/95 border border-border px-2.5 py-1.5 rounded-lg shadow-sm">
                      <label className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-secondary cursor-pointer uppercase select-none">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => handleToggleCompare(adv.id)}
                          className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
                        />
                        Compare
                      </label>
                    </div>

                    {/* Image */}
                    <div className="relative w-full h-40 overflow-hidden bg-muted-light">
                      <img
                        src={adv.imageUrl}
                        alt={adv.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute bottom-3 left-3 text-[10px] font-extrabold uppercase bg-primary text-white px-2 py-0.5 rounded shadow-sm">
                        {adv.category.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-muted font-bold">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            {adv.region.charAt(0) + adv.region.slice(1).toLowerCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                            adv.difficulty === 'EASY'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/10'
                              : adv.difficulty === 'MODERATE'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/10'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/10'
                          }`}>
                            {adv.difficulty}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-secondary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {adv.title}
                        </h3>
                      </div>

                      <div className="space-y-3 pt-2.5 border-t border-border mt-3">
                        <div className="flex items-center justify-between text-xs text-muted font-semibold">
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
                            <span className="text-[9px] bg-muted-light text-muted px-1.5 py-0.5 rounded font-bold">New</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-muted block leading-none">Starting from</span>
                            <span className="text-base font-extrabold text-secondary">₹{adv.basePrice}</span>
                            <span className="text-[9px] text-muted">/person</span>
                          </div>
                          
                          <Link
                            href={`/adventures/${adv.id}`}
                            className="px-3.5 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary-hover flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            Details
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Bottom Bar & Modal */}
      {comparedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-2xl p-4 animate-slide-up">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-primary/10 text-primary rounded-lg hidden sm:block">
                <Layers className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-bold text-secondary text-sm">
                  Comparing Adventures ({comparedIds.length}/3)
                </h4>
                <p className="text-xs text-muted">
                  Compare prices, difficulty, region, and fitness ratings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setComparedIds([])}
                className="px-3 py-2 border border-border text-xs font-semibold text-secondary rounded-xl hover:bg-muted-light cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setCompareModalOpen(true)}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md transition-colors cursor-pointer"
              >
                Compare Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Overlay Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted-light/20">
              <h3 className="font-bold text-secondary text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Adventure Comparison Chart
              </h3>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="p-1.5 rounded-lg border border-border text-muted hover:text-secondary hover:bg-muted-light transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Table Layout */}
            <div className="p-6 overflow-y-auto flex-grow">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 text-xs font-bold text-muted uppercase tracking-wider w-1/4">Criteria</th>
                    {comparedAdventures.map((adv) => (
                      <th key={adv.id} className="py-3 px-4 text-sm font-bold text-secondary w-1/4">
                        {adv.title.substring(0, 45)}...
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border hover:bg-muted-light/10">
                    <td className="py-3.5 px-4 text-xs font-bold text-muted uppercase">Image</td>
                    {comparedAdventures.map((adv) => (
                      <td key={adv.id} className="py-3.5 px-4">
                        <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted-light border border-border">
                          <img src={adv.imageUrl} className="w-full h-full object-cover" alt="Adventure Preview" />
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted-light/10">
                    <td className="py-3.5 px-4 text-xs font-bold text-muted uppercase">Base Price</td>
                    {comparedAdventures.map((adv) => (
                      <td key={adv.id} className="py-3.5 px-4 text-base font-extrabold text-primary">
                        ₹{adv.basePrice} <span className="text-[10px] text-muted font-normal">/person</span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted-light/10">
                    <td className="py-3.5 px-4 text-xs font-bold text-muted uppercase">Category</td>
                    {comparedAdventures.map((adv) => (
                      <td key={adv.id} className="py-3.5 px-4 text-xs font-semibold text-secondary">
                        {adv.category.replace('_', ' ')}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted-light/10">
                    <td className="py-3.5 px-4 text-xs font-bold text-muted uppercase">Zone Region</td>
                    {comparedAdventures.map((adv) => (
                      <td key={adv.id} className="py-3.5 px-4 text-xs font-medium text-secondary">
                        {adv.region.charAt(0) + adv.region.slice(1).toLowerCase()}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted-light/10">
                    <td className="py-3.5 px-4 text-xs font-bold text-muted uppercase">Duration</td>
                    {comparedAdventures.map((adv) => (
                      <td key={adv.id} className="py-3.5 px-4 text-xs font-medium text-secondary">
                        {adv.durationDays} {adv.durationDays === 1 ? 'Day' : 'Days'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted-light/10">
                    <td className="py-3.5 px-4 text-xs font-bold text-muted uppercase">Difficulty</td>
                    {comparedAdventures.map((adv) => (
                      <td key={adv.id} className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          adv.difficulty === 'EASY'
                            ? 'bg-emerald-50 text-emerald-700'
                            : adv.difficulty === 'MODERATE'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {adv.difficulty}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted-light/10">
                    <td className="py-3.5 px-4 text-xs font-bold text-muted uppercase">Fitness Level</td>
                    {comparedAdventures.map((adv) => (
                      <td key={adv.id} className="py-3.5 px-4 text-xs text-secondary font-bold">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < adv.fitnessLevel ? 'text-accent' : 'text-slate-300'}>
                            ★
                          </span>
                        ))}
                        <span className="text-[10px] text-muted font-normal ml-1">({adv.fitnessLevel}/5)</span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border hover:bg-muted-light/10">
                    <td className="py-3.5 px-4 text-xs font-bold text-muted uppercase">Reviews Rating</td>
                    {comparedAdventures.map((adv) => (
                      <td key={adv.id} className="py-3.5 px-4">
                        {adv.totalReviews > 0 ? (
                          <span className="flex items-center gap-0.5 text-xs font-bold text-secondary">
                            <Star className="h-4 w-4 fill-accent stroke-accent" />
                            {adv.averageRating}
                            <span className="font-normal text-muted">({adv.totalReviews} reviews)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted italic">No ratings yet</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-4"></td>
                    {comparedAdventures.map((adv) => (
                      <td key={adv.id} className="py-4 px-4">
                        <Link
                          href={`/adventures/${adv.id}`}
                          onClick={() => setCompareModalOpen(false)}
                          className="block text-center py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-sm transition-colors cursor-pointer"
                        >
                          Book Experience
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted-light/20 flex justify-end">
              <button
                onClick={() => setCompareModalOpen(false)}
                className="px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Next.js requires searchParams reading to be inside a Suspense boundary if rendered on the server
export default function AdventuresPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-20">
        <Compass className="h-10 w-10 text-primary animate-spin" />
      </div>
    }>
      <AdventuresContent />
    </Suspense>
  );
}
