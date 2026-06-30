'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react'; // qrcode.react exports QRCodeSVG
import { 
  Compass, Ticket, Heart, Star, Calendar, Clock, MapPin, 
  ChevronRight, ClipboardList, CheckCircle2, AlertCircle, Printer, X, Loader2, XCircle
} from 'lucide-react';

interface Traveler {
  id: string;
  name: string;
  age: number;
  emergencyContact: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  adventureId: string;
  departureId: string;
  adventure: {
    title: string;
    region: string;
    imageUrl: string;
    meetingPoint: string;
    bestSeason: string;
    emergencyHospital: string;
    emergencyPolice: string;
    operator: {
      companyName: string;
    }
  };
  departure: {
    date: string;
  };
  travelers: Traveler[];
}

interface WishlistItem {
  id: string;
  adventure: {
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
  };
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'wishlist'>('bookings');
  
  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  
  // Review inputs
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      const bkRes = await fetch('/api/bookings');
      if (bkRes.ok) {
        const bkData = await bkRes.json();
        setBookings(bkData.bookings || []);
      }

      // Fetch wishlist
      const wlRes = await fetch('/api/wishlist');
      if (wlRes.ok) {
        const wlData = await wlRes.json();
        setWishlist(wlData.wishlist || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePrintTicket = () => {
    window.print();
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    
    setReviewSubmitting(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adventureId: reviewBooking.adventureId,
          rating,
          comment
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccess('Review posted successfully! Thank you.');
        setComment('');
        setRating(5);
        setTimeout(() => {
          setReviewBooking(null);
          setReviewSuccess('');
          fetchDashboardData(); // Refresh list to update ratings
        }, 1500);
      } else {
        setReviewError(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      setReviewError('Unexpected network error.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This will release your reserved slots.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('Your booking has been cancelled successfully. Slots are released.');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to cancel booking.');
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      alert('An unexpected error occurred.');
    }
  };

  const getStatusStep = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PENDING') return 1;
    if (s === 'CONFIRMED') return 2;
    // For demo purposes, we define upcoming/completed based on dates, or status claims
    if (s === 'COMPLETED') return 4;
    return 3; // Upcoming default
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-20">
        <Compass className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-muted-light/20 pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Summary */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-secondary tracking-tight">
              Welcome Back, {user?.username}!
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Review your upcoming adventures, print tickets, and save getaways in your wishlist.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-card text-muted border-border hover:bg-muted-light'
              }`}
            >
              My Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-card text-muted border-border hover:bg-muted-light'
              }`}
            >
              Wishlist ({wishlist.length})
            </button>
          </div>
        </div>

        {/* Tab content 1: BOOKINGS LIST */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {bookings.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl shadow-sm max-w-xl mx-auto space-y-4">
                <span className="text-4xl">🏕️</span>
                <h3 className="font-bold text-lg text-secondary">No adventures booked yet</h3>
                <p className="text-muted text-xs max-w-xs mx-auto">
                  You haven't booked any weekend getaways yet. Explore our approved adventures and lock your slots!
                </p>
                <Link
                  href="/adventures"
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md inline-block"
                >
                  Explore Weekend Trips
                </Link>
              </div>
            ) : (
              bookings.map((booking) => {
                const step = getStatusStep(booking.status);
                const depDate = new Date(booking.departure.date);
                const isPast = depDate.getTime() < new Date().getTime();
                
                return (
                  <div key={booking.id} className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 hover:border-muted transition-colors">
                    
                    {/* Adventure Photo and title info */}
                    <div className="lg:col-span-3 flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted-light border border-border shrink-0">
                        <img src={booking.adventure.imageUrl} className="w-full h-full object-cover" alt="Adventure Preview" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] font-extrabold uppercase bg-primary-light text-primary px-2 py-0.5 rounded-full">
                            {booking.adventure.region}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                              : booking.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/20'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-secondary leading-snug line-clamp-2">
                          {booking.adventure.title}
                        </h3>
                        <p className="text-[10px] text-muted font-medium">
                          Ref: <span className="font-bold text-secondary">{booking.bookingNumber}</span>
                        </p>
                      </div>
                    </div>

                    {/* Booking dates and travelers */}
                    <div className="lg:col-span-2 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted font-medium">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          Date: <span className="text-secondary font-bold">
                            {depDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted font-medium">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>
                          Travelers: <span className="text-secondary font-bold">{booking.travelers.length} Persons</span>
                        </span>
                      </div>
                      <div className="text-[10px] text-muted bg-muted-light/60 p-2 rounded-lg">
                        <span className="font-semibold block text-[9px] text-secondary">Travelers List:</span>
                        {booking.travelers.map(t => t.name).join(', ')}
                      </div>
                    </div>

                    {/* Booking Status Timeline */}
                    <div className="lg:col-span-3 flex flex-col justify-center space-y-4">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Booking Status Journey</span>
                      
                      {booking.status === 'CANCELLED' ? (
                        <div className="space-y-2">
                          <div className="p-3 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300 rounded-xl text-[10px] font-semibold flex items-center gap-1.5">
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                            <span>Booking Cancelled. Slots released.</span>
                          </div>
                          <div className="p-3 bg-muted-light/20 border border-border rounded-xl text-[10px] space-y-1.5">
                            <span className="font-bold text-secondary uppercase block tracking-wider">Refund Summary</span>
                            <div className="flex justify-between">
                              <span className="text-muted">Refund Amount:</span>
                              <span className="font-bold text-secondary">₹{booking.totalPrice}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted">Refund Status:</span>
                              <span className="font-black text-emerald-600 uppercase">Processed (100% Refund)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted">Method:</span>
                              <span className="font-medium text-secondary">Original Source (UPI/Card)</span>
                            </div>
                            <div className="flex justify-between text-[9px] border-t border-border pt-1 mt-1">
                              <span className="text-muted">Reference:</span>
                              <span className="font-mono text-secondary">REF-{booking.bookingNumber}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center w-full">
                          {/* Circle 1: Pending */}
                          <div className="flex flex-col items-center">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              step >= 1 ? 'bg-primary text-white' : 'bg-border text-muted'
                            }`}>
                              ✓
                            </span>
                            <span className="text-[8px] font-bold text-muted mt-1 uppercase">Pending</span>
                          </div>
                          <div className={`flex-grow h-0.5 mx-1 ${step >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
                          
                          {/* Circle 2: Confirmed */}
                          <div className="flex flex-col items-center">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              step >= 2 ? 'bg-primary text-white' : 'bg-border text-muted'
                            }`}>
                              {step >= 2 ? '✓' : '2'}
                            </span>
                            <span className="text-[8px] font-bold text-muted mt-1 uppercase">Confirmed</span>
                          </div>
                          <div className={`flex-grow h-0.5 mx-1 ${step >= 3 ? 'bg-primary' : 'bg-border'}`}></div>

                          {/* Circle 3: Upcoming */}
                          <div className="flex flex-col items-center">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              step >= 3 ? 'bg-primary text-white' : 'bg-border text-muted'
                            }`}>
                              {step >= 3 ? '✓' : '3'}
                            </span>
                            <span className="text-[8px] font-bold text-muted mt-1 uppercase">Upcoming</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons (Price / Print / Review) */}
                    <div className="lg:col-span-4 flex flex-col justify-between items-end gap-4 border-l border-border pl-6 lg:border-l lg:pl-6 border-t pt-4 lg:border-t-0 lg:pt-0">
                      <div className="text-right">
                        <span className="text-[9px] text-muted block leading-none">Paid Amount</span>
                        <span className="text-lg font-black text-primary">₹{booking.totalPrice}</span>
                        <span className="text-[8px] text-muted block mt-0.5">Payment Verified</span>
                      </div>

                      <div className="flex gap-2 w-full lg:w-max flex-wrap justify-end">
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setSelectedTicket(booking)}
                            className="flex-grow lg:flex-grow-0 px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover flex items-center justify-center gap-1 cursor-pointer shadow-sm animate-slide-up"
                          >
                            <Ticket className="h-4 w-4" />
                            Get Ticket
                          </button>
                        )}
                        
                        {/* Write a review (simulated past trip or review trigger) */}
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setReviewBooking(booking)}
                            className="flex-grow lg:flex-grow-0 px-3 py-2 border border-border text-secondary text-xs font-bold rounded-xl hover:bg-muted-light flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Star className="h-4 w-4 text-accent fill-accent" />
                            Review
                          </button>
                        )}

                        {/* Cancel booking option */}
                        {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="flex-grow lg:flex-grow-0 px-3 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab content 2: WISHLIST GRID */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlist.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl shadow-sm max-w-xl mx-auto space-y-4">
                <span className="text-4xl">❤️</span>
                <h3 className="font-bold text-lg text-secondary">Your wishlist is empty</h3>
                <p className="text-muted text-xs max-w-xs mx-auto">
                  Save your favorite weekend packages here. Make comparisons and book them when ready!
                </p>
                <Link
                  href="/adventures"
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md inline-block"
                >
                  Browse Getaways
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map((item) => {
                  const adv = item.adventure;
                  return (
                    <div
                      key={item.id}
                      className="group border border-border bg-card text-card-foreground rounded-2xl overflow-hidden shadow-sm hover-lift flex flex-col h-[380px] relative"
                    >
                      <img src={adv.imageUrl} className="w-full h-40 object-cover" alt={adv.title} />
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-muted font-bold">
                            <span>📍 {adv.region}</span>
                            <span className="bg-primary-light text-primary px-1.5 py-0.5 rounded">{adv.difficulty}</span>
                          </div>
                          <h3 className="font-bold text-xs text-secondary leading-snug line-clamp-2">
                            {adv.title}
                          </h3>
                        </div>

                        <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                          <div>
                            <span className="text-[8px] text-muted block">Starts from</span>
                            <span className="font-extrabold text-sm text-secondary">₹{adv.basePrice}</span>
                          </div>
                          <Link
                            href={`/adventures/${adv.id}`}
                            className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-hover flex items-center gap-0.5"
                          >
                            Book <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL 1: Boarding Pass printable ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:p-0 print:bg-white print:relative print:z-0">
          <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:border-0 print:max-h-none print:w-full">
            
            {/* Modal Header (Hidden on print) */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted-light/20 print:hidden">
              <h3 className="font-bold text-secondary text-sm flex items-center gap-1.5">
                <Ticket className="h-4.5 w-4.5 text-primary" />
                Boarding Ticket boarding pass
              </h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 border border-border text-muted hover:text-secondary rounded-lg hover:bg-muted-light transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Boarding Pass layout */}
            <div className="p-6 overflow-y-auto flex-grow space-y-6 print:p-0">
              
              {/* Ticket Envelope header */}
              <div className="border border-dashed border-primary bg-primary-light/40 dark:bg-emerald-950/20 p-5 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest block">Maharashtra Adventure Boarding Pass</span>
                <h2 className="text-xl font-black text-secondary leading-snug">{selectedTicket.adventure.title}</h2>
                <p className="text-[10px] text-muted">Organized by: {selectedTicket.adventure.operator.companyName}</p>
              </div>

              {/* Ticket Details Grid */}
              <div className="grid grid-cols-2 gap-4 border border-border p-4 rounded-xl text-xs bg-muted-light/10">
                <div>
                  <span className="text-[9px] text-muted block uppercase">Booking Reference</span>
                  <span className="font-bold text-secondary text-sm tracking-wide">{selectedTicket.bookingNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] text-muted block uppercase">Departure Date</span>
                  <span className="font-bold text-secondary text-sm">
                    {new Date(selectedTicket.departure.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-muted block uppercase">Assembly Location</span>
                  <span className="font-semibold text-secondary leading-tight block">📍 {selectedTicket.adventure.meetingPoint}</span>
                </div>
                <div>
                  <span className="text-[9px] text-muted block uppercase">Best Season Guide</span>
                  <span className="font-semibold text-secondary block">☁️ {selectedTicket.adventure.bestSeason}</span>
                </div>
              </div>

              {/* QR Code and traveler details */}
              <div className="flex flex-col sm:flex-row items-center gap-6 border border-border p-4 rounded-xl">
                {/* QR code */}
                <div className="p-2 bg-white rounded-lg border border-border shrink-0">
                  <QRCodeSVG 
                    value={`booking_id:${selectedTicket.id};ref:${selectedTicket.bookingNumber};travelers:${selectedTicket.travelers.length}`} 
                    size={110} 
                  />
                </div>

                <div className="space-y-2 text-xs flex-grow w-full">
                  <span className="text-[9px] text-muted block uppercase font-bold">Registered Travelers Details</span>
                  <div className="max-h-[100px] overflow-y-auto space-y-1.5 border border-border/70 p-2 rounded-lg bg-muted-light/10">
                    {selectedTicket.travelers.map((t, idx) => (
                      <div key={t.id} className="flex justify-between border-b border-border/40 last:border-0 pb-1 text-[11px]">
                        <span className="font-bold text-secondary">{idx + 1}. {t.name} (Age: {t.age})</span>
                        <span className="text-muted text-[10px]">Emergency: {t.emergencyContact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Emergency info card footer */}
              <div className="p-3.5 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300 rounded-xl text-[10px] space-y-1.5">
                <span className="font-black uppercase block tracking-wider flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Operator On-Ground Safety Information
                </span>
                <p>Nearest Hospital: {selectedTicket.adventure.emergencyHospital}</p>
                <p>Nearest Police Beat: {selectedTicket.adventure.emergencyPolice}</p>
              </div>

            </div>

            {/* Modal Footer (Hidden on print) */}
            <div className="px-6 py-4 border-t border-border bg-muted-light/20 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 border border-border text-xs font-bold text-secondary rounded-xl hover:bg-muted-light cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handlePrintTicket}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Print Boarding Ticket
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Review submission Form */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted-light/20">
              <h3 className="font-bold text-secondary text-sm flex items-center gap-1.5">
                <Star className="h-4.5 w-4.5 text-accent fill-accent" />
                Write Adventure Review
              </h3>
              <button
                onClick={() => setReviewBooking(null)}
                className="p-1 border border-border text-muted hover:text-secondary rounded-lg hover:bg-muted-light transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
              {reviewSuccess && (
                <div className="p-3 bg-emerald-50 text-success border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  {reviewSuccess}
                </div>
              )}
              {reviewError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                  🚨 {reviewError}
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted block uppercase">Adventure Name</span>
                <span className="font-bold text-secondary text-xs">{reviewBooking.adventure.title}</span>
              </div>

              {/* Star Rating Select */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Rating Stars</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star className={`h-8 w-8 ${
                        starValue <= rating ? 'fill-accent text-accent' : 'text-slate-200'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Comment Feedback</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details of your experience: safety, guides, food, travel, views..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl p-3 text-xs text-secondary font-medium focus:outline-none"
                />
              </div>

              {/* Submit buttons */}
              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="px-4 py-2 border border-border text-xs font-bold text-secondary rounded-xl hover:bg-muted-light cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {reviewSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Feedback
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
