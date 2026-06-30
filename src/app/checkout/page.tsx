'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PriceBreakdown } from '@/lib/pricing';
import { Compass, User, CreditCard, Shield, QrCode, Smartphone, Loader2, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Ticket } from 'lucide-react';

interface TravelerInput {
  name: string;
  age: string;
  emergencyContact: string;
}

interface BookingDetails {
  id: string;
  bookingNumber: string;
  totalPrice: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  // Params
  const departureId = searchParams.get('departureId') || '';
  const travelerCountParam = parseInt(searchParams.get('travelerCount') || '1');
  const coupon = searchParams.get('coupon') || '';

  // Checkout Wizard steps
  // 1 = Traveler details entry, 2 = Payment processing, 3 = Success
  const [step, setStep] = useState(1);
  const [isSubmittingTravelers, setIsSubmittingTravelers] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Step 1: Traveler Details
  const [travelers, setTravelers] = useState<TravelerInput[]>(
    Array.from({ length: travelerCountParam }).map(() => ({ name: '', age: '', emergencyContact: '' }))
  );

  // Step 2: Payment Details
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI'>('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [upiId, setUpiId] = useState('');
  
  // Created Booking Ref
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);

  // Redirect if not logged in or missing parameters
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
    }
    if (!departureId) {
      router.push('/adventures');
    }
  }, [user, authLoading, departureId]);

  // Adjust travelers array if count changes
  useEffect(() => {
    setTravelers(
      Array.from({ length: travelerCountParam }).map(() => ({ name: '', age: '', emergencyContact: '' }))
    );
  }, [travelerCountParam]);

  const handleTravelerChange = (index: number, field: keyof TravelerInput, value: string) => {
    setTravelers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleTravelersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTravelers(true);
    
    try {
      // Validate age input
      for (const t of travelers) {
        if (!t.name || !t.age || !t.emergencyContact) {
          alert('Please fill in all traveler details.');
          setIsSubmittingTravelers(false);
          return;
        }
        if (isNaN(parseInt(t.age)) || parseInt(t.age) < 1 || parseInt(t.age) > 100) {
          alert('Please enter a valid age for all travelers.');
          setIsSubmittingTravelers(false);
          return;
        }
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureId,
          travelers: travelers.map(t => ({
            name: t.name,
            age: parseInt(t.age),
            emergencyContact: t.emergencyContact
          })),
          couponCode: coupon || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBooking(data.booking);
        setPricing(data.pricing);
        setStep(2); // Proceed to payment
      } else {
        alert(data.error || 'Failed to create booking slots. Please try another date.');
      }
    } catch (err) {
      console.error('Checkout traveler submit error:', err);
      alert('An unexpected network error occurred.');
    } finally {
      setIsSubmittingTravelers(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    
    setIsProcessingPayment(true);
    setPaymentError('');

    const paymentDetails = paymentMethod === 'CARD' 
      ? { cardNumber, cardName, cardExpiry, cardCvv }
      : { upiId };

    try {
      const res = await fetch('/api/bookings/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod,
          paymentDetails
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStep(3); // Success Screen
      } else {
        setPaymentError(data.error || 'Payment failed. Please check details.');
      }
    } catch (err) {
      console.error('Payment checkout processing error:', err);
      setPaymentError('Network authorization failed. Try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-20">
        <Compass className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-grow bg-muted-light/20 pb-24 pt-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Progress Bar Indicator */}
        <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-primary text-white' : 'bg-border text-muted'
            }`}>
              1
            </span>
            <span className="text-[10px] font-bold text-secondary mt-1.5 uppercase tracking-wider">Travelers</span>
          </div>
          <div className={`flex-grow h-0.5 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
          <div className="flex flex-col items-center">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-primary text-white' : 'bg-border text-muted'
            }`}>
              2
            </span>
            <span className="text-[10px] font-bold text-secondary mt-1.5 uppercase tracking-wider">Payment</span>
          </div>
          <div className={`flex-grow h-0.5 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-border'}`}></div>
          <div className="flex flex-col items-center">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 3 ? 'bg-primary text-white' : 'bg-border text-muted'
            }`}>
              3
            </span>
            <span className="text-[10px] font-bold text-secondary mt-1.5 uppercase tracking-wider">Ticket</span>
          </div>
        </div>

        {/* STEP 1: Traveler Registration Form */}
        {step === 1 && (
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-md p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-secondary">Traveler Registration</h2>
              <p className="text-muted text-xs mt-1">
                Enter details for each traveler joining this weekend getaway experience:
              </p>
            </div>

            <form onSubmit={handleTravelersSubmit} className="space-y-6">
              {travelers.map((traveler, idx) => (
                <div key={idx} className="p-4 bg-muted-light/25 border border-border rounded-xl space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-border pb-2 text-xs font-bold text-primary">
                    <User className="h-4 w-4" />
                    Traveler #{idx + 1}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="First & Last Name"
                        value={traveler.name}
                        onChange={(e) => handleTravelerChange(idx, 'name', e.target.value)}
                        className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Age</label>
                      <input
                        type="number"
                        required
                        placeholder="Age"
                        value={traveler.age}
                        onChange={(e) => handleTravelerChange(idx, 'age', e.target.value)}
                        className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Emergency Contact</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit Phone"
                        value={traveler.emergencyContact}
                        onChange={(e) => handleTravelerChange(idx, 'emergencyContact', e.target.value)}
                        className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-xs font-bold text-secondary border border-border rounded-xl hover:bg-muted-light cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTravelers}
                  className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTravelers ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Payment Gateway Selection & Inputs */}
        {step === 2 && booking && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Price Overview panel (Left column) */}
            <div className="md:col-span-1 border border-border bg-card p-5 rounded-2xl shadow-sm h-max space-y-4 text-xs">
              <h3 className="font-bold text-secondary border-b border-border pb-2 text-sm">Booking Overview</h3>
              <div className="space-y-2 text-muted">
                <p>
                  <span className="font-semibold text-secondary block">Booking Code:</span>
                  {booking.bookingNumber}
                </p>
                <p>
                  <span className="font-semibold text-secondary block">Travelers Size:</span>
                  {travelerCountParam} {travelerCountParam === 1 ? 'Person' : 'People'}
                </p>
              </div>

              {pricing && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span>Base Fare:</span>
                    <span>₹{pricing.subtotal}</span>
                  </div>
                  {pricing.weekendSurge > 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold">
                      <span>Weekend Surcharge (+15%):</span>
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
                      <span>Coupon Discount:</span>
                      <span>-₹{pricing.couponDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-secondary text-sm border-t border-border pt-2">
                    <span>Grand Total:</span>
                    <span className="text-primary">₹{pricing.total}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sandbox Payment Forms (Right column) */}
            <div className="md:col-span-2 border border-border bg-card p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h2 className="text-lg font-bold text-secondary flex items-center gap-1.5">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Secure Checkout
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded">
                  Sandbox Test Mode
                </span>
              </div>

              {/* Selector Tabs */}
              <div className="flex border border-border rounded-xl p-1 bg-muted-light/40">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex-grow py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'CARD' 
                      ? 'bg-card text-primary shadow-sm' 
                      : 'text-muted hover:text-secondary'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Credit / Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex-grow py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'UPI' 
                      ? 'bg-card text-primary shadow-sm' 
                      : 'text-muted hover:text-secondary'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  UPI QR / ID Scan
                </button>
              </div>

              {paymentError && (
                <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                  🚨 {paymentError}
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                
                {/* Method 1: Credit Card details */}
                {paymentMethod === 'CARD' && (
                  <div className="space-y-4">
                    {/* Interactive Mock Card Display */}
                    <div className="relative w-full max-w-[320px] h-48 mx-auto rounded-2xl shadow-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-6 flex flex-col justify-between overflow-hidden transition-all duration-500 perspective-[1000px] border border-emerald-500/30">
                      
                      {!cardFlipped ? (
                        /* Front side of card */
                        <div className="h-full flex flex-col justify-between select-none">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-extrabold tracking-wider uppercase">Sandbox Card</span>
                            <Compass className="h-6 w-6 stroke-1.5" />
                          </div>
                          
                          <div className="text-xl font-bold tracking-widest py-3">
                            {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                          </div>

                          <div className="flex justify-between items-end text-xs">
                            <div>
                              <span className="text-[8px] text-emerald-200 block uppercase font-medium">Cardholder</span>
                              <span className="font-bold tracking-wide uppercase">{cardName || 'YOUR FULL NAME'}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-emerald-200 block uppercase font-medium">Expires</span>
                              <span className="font-bold">{cardExpiry || 'MM/YY'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Back side of card */
                        <div className="h-full flex flex-col justify-between py-2 select-none">
                          <div className="w-full h-8 bg-slate-900 -mx-6 mt-1"></div>
                          
                          <div className="flex items-center justify-end gap-2 bg-white/10 p-1.5 rounded-lg border border-white/20">
                            <span className="text-[8px] text-emerald-200 uppercase">CVV Code</span>
                            <span className="text-sm font-bold text-accent tracking-widest">{cardCvv || '•••'}</span>
                          </div>

                          <div className="text-[8px] text-emerald-200 leading-tight">
                            This is an simulated card configuration for testing. Cardholder details are kept inside local sandbox environments.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Inputs Card Form */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Card Number</label>
                        <input
                          type="text"
                          required
                          maxLength={16}
                          placeholder="4000 1234 5678 9010"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                          onFocus={() => setCardFlipped(false)}
                          className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          placeholder="As printed on card"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          onFocus={() => setCardFlipped(false)}
                          className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none uppercase"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          onFocus={() => setCardFlipped(false)}
                          className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Security CVV</label>
                        <input
                          type="password"
                          required
                          maxLength={3}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          onFocus={() => setCardFlipped(true)}
                          onBlur={() => setCardFlipped(false)}
                          className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-secondary font-medium focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Method 2: UPI details */}
                {paymentMethod === 'UPI' && (
                  <div className="space-y-4 flex flex-col items-center text-center">
                    
                    {/* Simulated QR Code Scan */}
                    <div className="border border-border bg-muted-light/20 p-5 rounded-2xl w-max flex flex-col items-center gap-3">
                      <div className="p-4 bg-white rounded-xl border border-border">
                        <Smartphone className="h-32 w-32 text-slate-800 stroke-1" />
                      </div>
                      <div className="text-xs font-bold text-secondary flex items-center gap-1.5">
                        <QrCode className="h-4.5 w-4.5 text-primary" />
                        Scan QR code using UPI apps
                      </div>
                      <span className="text-[9px] text-muted max-w-[160px] leading-tight">
                        Supported: GPay, PhonePe, Paytm, BHIM, and bank apps
                      </span>
                    </div>

                    <div className="w-full text-xs font-semibold text-muted max-w-[280px]">
                      <span>or Pay using UPI ID</span>
                      <div className="relative flex items-center bg-card border border-border rounded-xl p-2.5 mt-2">
                        <input
                          type="text"
                          placeholder="username@okaxis"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full bg-transparent text-xs text-secondary font-medium focus:outline-none placeholder-muted"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Checkout submit button */}
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-border text-xs font-bold text-secondary rounded-xl hover:bg-muted-light cursor-pointer"
                  >
                    Edit Travelers
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying Sandbox...
                      </>
                    ) : (
                      <>
                        Complete Safe Payment
                        <ShieldCheck className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP 3: Payment Success screen */}
        {step === 3 && (
          <div className="max-w-md mx-auto bg-card text-card-foreground border border-border rounded-2xl shadow-xl p-8 text-center space-y-6 animate-slide-up">
            <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/20 text-success rounded-full border border-emerald-100 dark:border-emerald-900/40">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-secondary tracking-tight">Booking Confirmed!</h2>
              <p className="text-muted text-xs leading-relaxed">
                Thank you for choosing AdventureHub Pro. Your payment was verified successfully in sandbox mode, and your slots are locked.
              </p>
            </div>

            <div className="p-4 bg-muted-light/35 border border-border rounded-xl space-y-1.5 text-xs text-left">
              <p className="flex justify-between">
                <span className="text-muted">Transaction ID:</span>
                <span className="font-semibold text-secondary">TX_SANDBOX_{Math.random().toString(36).substring(2, 9).toUpperCase()}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted">Booking Reference:</span>
                <span className="font-semibold text-primary">{booking?.bookingNumber}</span>
              </p>
            </div>

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard"
                className="flex-grow py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Ticket className="h-4 w-4" />
                Go to Dashboard & Get QR Ticket
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Wrap in Suspense boundary to read searchParams safely on client
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-20">
        <Compass className="h-10 w-10 text-primary animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
