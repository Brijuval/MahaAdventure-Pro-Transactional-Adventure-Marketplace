export interface PriceBreakdown {
  basePrice: number;
  travelerCount: number;
  subtotal: number;
  weekendSurge: number;
  groupDiscount: number;
  earlyBirdDiscount: number;
  couponDiscount: number;
  total: number;
}

export function calculatePrice(
  basePrice: number,
  travelerCount: number,
  departureDate: Date,
  couponCode?: string
): PriceBreakdown {
  const subtotal = basePrice * travelerCount;
  
  // 1. Weekend Surcharge (+15% if departure is Saturday or Sunday)
  const dayOfWeek = departureDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
  const weekendSurge = isWeekend ? Math.round(subtotal * 0.15) : 0;
  
  // 2. Group Discount (-10% if traveler count is 3 or more)
  const groupDiscount = travelerCount >= 3 ? Math.round(subtotal * 0.10) : 0;
  
  // 3. Early-Bird Discount (-10% if booking is made 14 days or more in advance)
  const today = new Date();
  const diffTime = Math.abs(departureDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const earlyBirdDiscount = diffDays >= 14 ? Math.round(subtotal * 0.05) : 0; // 5% early bird discount
  
  // 4. Coupon Discount
  let couponDiscount = 0;
  if (couponCode) {
    const code = couponCode.toUpperCase().trim();
    if (code === 'MAHA20') {
      couponDiscount = Math.round(subtotal * 0.20);
    } else if (code === 'ADVENTURE10') {
      couponDiscount = Math.round(subtotal * 0.10);
    } else if (code === 'WELCOME500') {
      couponDiscount = Math.min(500, subtotal);
    }
  }
  
  // 5. Total
  const total = Math.max(0, subtotal + weekendSurge - groupDiscount - earlyBirdDiscount - couponDiscount);
  
  return {
    basePrice,
    travelerCount,
    subtotal,
    weekendSurge,
    groupDiscount,
    earlyBirdDiscount,
    couponDiscount,
    total,
  };
}
