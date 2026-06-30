import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data to prevent duplicate primary keys on re-seeding
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.travelerDetail.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.departure.deleteMany();
  await prisma.itineraryStep.deleteMany();
  await prisma.inclusion.deleteMany();
  await prisma.exclusion.deleteMany();
  await prisma.essentialItem.deleteMany();
  await prisma.adventure.deleteMany();
  await prisma.operatorProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash Password helper
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const operatorPassword = await bcrypt.hash('operator123', salt);
  const customerPassword = await bcrypt.hash('customer123', salt);

  // 3. Create Users
  console.log('👤 Creating users...');
  
  // Create Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@adventurehub.pro',
      username: 'MahaAdmin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create Operators
  const opUser1 = await prisma.user.create({
    data: {
      email: 'op.sahyadri@adventurehub.pro',
      username: 'sahyadri_adventures',
      password: operatorPassword,
      role: 'OPERATOR',
    },
  });

  const opUser2 = await prisma.user.create({
    data: {
      email: 'op.konkan@adventurehub.pro',
      username: 'konkan_watersports',
      password: operatorPassword,
      role: 'OPERATOR',
    },
  });

  // Create Customers
  const custUser1 = await prisma.user.create({
    data: {
      email: 'rohan.patil@gmail.com',
      username: 'rohan_patil',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });

  const custUser2 = await prisma.user.create({
    data: {
      email: 'sneha.deshmukh@gmail.com',
      username: 'sneha_d',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });

  // 4. Create Operator Profiles
  console.log('💼 Creating operator profiles...');
  const sahyadriProfile = await prisma.operatorProfile.create({
    data: {
      userId: opUser1.id,
      companyName: 'Sahyadri Mountaineering Club',
      isApproved: true,
    },
  });

  const konkanProfile = await prisma.operatorProfile.create({
    data: {
      userId: opUser2.id,
      companyName: 'Konkan Scuba & Adventure Academy',
      isApproved: true,
    },
  });

  // Define future dates for departures
  const getWeekend = (weeksAhead: number, day: 'Sat' | 'Sun') => {
    const date = new Date();
    date.setDate(date.getDate() + (weeksAhead * 7) + (day === 'Sat' ? (6 - date.getDay()) : (7 - date.getDay())));
    date.setHours(6, 0, 0, 0); // 6 AM start
    return date;
  };

  // 5. Create Adventures
  console.log('🏕️ Creating adventures...');

  // Listing 1: Kalsubai Peak Trek
  const kalsubai = await prisma.adventure.create({
    data: {
      title: 'Kalsubai Peak Trek: The Everest of Maharashtra',
      category: 'TREKKING',
      region: 'NASHIK',
      difficulty: 'MODERATE',
      durationDays: 1,
      basePrice: 1299.00,
      description: 'Conquer the highest point in Maharashtra at 5,400 ft (1,646 meters). Trek through lush green fields, climb vertical iron ladders attached to rock faces, and stand above the clouds at the summit temple. The panoramic views of the Bhandardara backwaters are truly breathtaking.',
      imageUrl: '/assets/kalsubai_trek.png',
      latitude: 19.6015,
      longitude: 73.7820,
      fitnessLevel: 3,
      bestSeason: 'June - October (Monsoons)',
      meetingPoint: 'Kasara Railway Station, Ticket Counter (04:00 AM)',
      emergencyHospital: 'Rural Hospital, Ghoti (Cell: +91 2553 220202)',
      emergencyPolice: 'Bari Police Beat Station, Bari (Cell: +91 2553 250100)',
      isApproved: true,
      operatorId: sahyadriProfile.id,
      itinerary: {
        create: [
          { day: 1, title: 'Early Morning Assembly & Travel', description: 'Assemble at Kasara Station by 4:00 AM. Board our private vehicles to Bari village, the base point. Enjoy a hot local Maharashtrian breakfast.' },
          { day: 1, title: 'The Ascent', description: 'Start the trek from Bari by 6:30 AM. Cross streams and fields, and tackle the famous ladder sections. Reach the peak by 10:30 AM.' },
          { day: 1, title: 'Summit Exploration & Descent', description: 'Explore the Kalsubai temple at the summit. Click pictures above the clouds. Begin descending back to Bari by 12:00 PM.' },
          { day: 1, title: 'Lunch & Return', description: 'Relish a homemade organic lunch at a villager’s home in Bari at 3:00 PM. Travel back to Kasara, reaching by 6:00 PM.' }
        ]
      },
      inclusions: {
        create: [
          { text: 'Travel from Kasara to Bari and back' },
          { text: 'Local breakfast & unlimited village-style lunch' },
          { text: 'Certified mountain guides & safety gear' },
          { text: 'First aid assistance & forest entry fees' }
        ]
      },
      exclusions: {
        create: [
          { text: 'Mineral water & personal beverages' },
          { text: 'Anything not mentioned in the inclusions' }
        ]
      },
      essentials: {
        create: [
          { text: 'Trekking shoes with good grip (Mandatory)' },
          { text: '2-3 liters of drinking water' },
          { text: 'Rainwear (poncho or raincoat)' },
          { text: 'Personal medicines' },
          { text: 'Energy bars and electoral powder' }
        ]
      },
      departures: {
        create: [
          { date: getWeekend(1, 'Sat'), maxCapacity: 20, bookedSlots: 0 },
          { date: getWeekend(2, 'Sat'), maxCapacity: 20, bookedSlots: 0 },
          { date: getWeekend(3, 'Sat'), maxCapacity: 25, bookedSlots: 0 }
        ]
      }
    }
  });

  // Listing 2: White Water Rafting in Kolad
  const kolad = await prisma.adventure.create({
    data: {
      title: 'Kundalika River White Water Rafting',
      category: 'WATER_SPORTS',
      region: 'PUNE',
      difficulty: 'MODERATE',
      durationDays: 1,
      basePrice: 1999.00,
      description: 'Experience the rush of 12 km of wild rapids on the Kundalika River in Kolad. Nestled in the Sahyadris, Kundalika is the only river in Western India offering white water rafting. Tackle Grade II and III rapids under the supervision of professional river guides.',
      imageUrl: '/assets/kolad_rafting.png',
      latitude: 18.4357,
      longitude: 73.2382,
      fitnessLevel: 3,
      bestSeason: 'June - March (Monsoon/Winter)',
      meetingPoint: 'Sutarwadi Rafting Start Point, Kolad (08:00 AM)',
      emergencyHospital: 'Government Hospital, Roha (Cell: +91 2194 222080)',
      emergencyPolice: 'Kolad Police Station, Kolad (Cell: +91 2194 256030)',
      isApproved: true,
      operatorId: sahyadriProfile.id,
      itinerary: {
        create: [
          { day: 1, title: 'Briefing & Gear Up', description: 'Report at Sutarwadi start point by 8:00 AM. Wear life jackets, helmets, and listen to the mandatory safety briefing by certified instructors.' },
          { day: 1, title: 'Rafting Expedition', description: 'Enter the river as water is released from the Bhira dam. Ride Grade II & III rapids (Johnny Walker, Rajdhani Express) for 2.5 hours.' },
          { day: 1, title: 'Body Surfing & Finish', description: 'Enjoy swimming and body surfing in the calmer stretches of the river. Reach the end point by 12:30 PM.' },
          { day: 1, title: 'Lunch & Departure', description: 'Change into dry clothes and have a hot buffet lunch at the campsite. Depart by 2:30 PM.' }
        ]
      },
      inclusions: {
        create: [
          { text: 'Rafting equipment rental (rafts, paddles, life-jackets, helmets)' },
          { text: 'Certified rafting guide on every boat' },
          { text: 'Veg/Non-veg buffet lunch at campsite' },
          { text: 'Shower facilities at the rafting endpoint' }
        ]
      },
      exclusions: {
        create: [
          { text: 'Local transport from endpoint back to start point (auto rickshaws easily available)' },
          { text: 'GoPro photography charges (Optional)' }
        ]
      },
      essentials: {
        create: [
          { text: 'Quick-dry clothes (T-shirt and shorts)' },
          { text: 'Strapped sandals or old sneakers (No flip-flops)' },
          { text: 'Complete set of dry clothes & towel' },
          { text: 'Sunscreen lotion & insect repellent' }
        ]
      },
      departures: {
        create: [
          { date: getWeekend(1, 'Sun'), maxCapacity: 15, bookedSlots: 0 },
          { date: getWeekend(2, 'Sun'), maxCapacity: 15, bookedSlots: 0 }
        ]
      }
    }
  });

  // Listing 3: Bhandardara Lakeside Camping
  const bhandardara = await prisma.adventure.create({
    data: {
      title: 'Stargazing Lakeside Camping at Bhandardara',
      category: 'CAMPING',
      region: 'NASHIK',
      difficulty: 'EASY',
      durationDays: 2,
      basePrice: 1499.00,
      description: 'Spend your weekend by the pristine waters of Arthur Lake in Bhandardara. Pitch your tents under a canopy of stars, enjoy an acoustic music session, BBQ around the bonfire, and wake up to a mist-laden morning overlooking the majestic Sahyadri mountain ranges.',
      imageUrl: '/assets/bhandardara_camping.png',
      latitude: 19.5398,
      longitude: 73.7661,
      fitnessLevel: 1,
      bestSeason: 'October - May (Winter & Summers)',
      meetingPoint: 'Bhandardara Lake Camping Site, Shendi (04:00 PM)',
      emergencyHospital: 'Rural Hospital, Rajur (Cell: +91 2424 251102)',
      emergencyPolice: 'Akole Police Station, Akole (Cell: +91 2424 221333)',
      isApproved: true,
      operatorId: sahyadriProfile.id,
      itinerary: {
        create: [
          { day: 1, title: 'Campsite Arrival & Tea', description: 'Arrive at the lake-facing campsite by 4:00 PM. Have tea and hot snacks, and choose your tents.' },
          { day: 1, title: 'Lakeside Sunset & Games', description: 'Watch a beautiful sunset over the lake. Participate in archery, boating, or simply relax by the water.' },
          { day: 1, title: 'Bonfire, BBQ & Acoustic Night', description: 'Sit around the bonfire by 8:00 PM. Enjoy barbecued appetizers, light music, and stargazing.' },
          { day: 1, title: 'Dinner & Star Trails', description: 'Have a delicious village-cooked dinner by 10:00 PM. Campers can sleep or join the midnight star trail photo session.' },
          { day: 2, title: 'Sunrise Boating & Breakfast', description: 'Wake up to the cool morning air at 6:30 AM. Go boating on the calm waters. Enjoy hot breakfast (Poha & Tea) at 8:30 AM.' },
          { day: 2, title: 'Checkout & Departure', description: 'Pack up and bid goodbye to Arthur Lake. Checkout of the campsite by 10:00 AM.' }
        ]
      },
      inclusions: {
        create: [
          { text: 'Double/Triple sharing tents with mattresses, blankets, and pillows' },
          { text: 'Evening high tea, dinner (local Maharashtrian style), and morning breakfast' },
          { text: 'Bonfire & limited BBQ starters' },
          { text: 'Boating and arching/board games equipment' }
        ]
      },
      exclusions: {
        create: [
          { text: 'Travel to and from Bhandardara campsite' },
          { text: 'Personal toiletries and medicines' }
        ]
      },
      essentials: {
        create: [
          { text: 'Warm clothing (sweaters/jackets for winter nights)' },
          { text: 'Torch/Flashlight with extra batteries' },
          { text: 'Personal toiletries (toothbrush, towels, hand sanitizer)' },
          { text: 'Power bank for charging mobile phones' }
        ]
      },
      departures: {
        create: [
          { date: getWeekend(1, 'Sat'), maxCapacity: 30, bookedSlots: 0 },
          { date: getWeekend(2, 'Sat'), maxCapacity: 30, bookedSlots: 0 }
        ]
      }
    }
  });

  // Listing 4: Scuba Diving in Malvan & Tarkarli
  const malvan = await prisma.adventure.create({
    data: {
      title: 'Scuba Diving & Water Sports in Malvan',
      category: 'WATER_SPORTS',
      region: 'KONKAN',
      difficulty: 'EASY',
      durationDays: 2,
      basePrice: 3499.00,
      description: 'Explore the thriving marine life under the crystal clear waters of Tarkarli and Malvan. Dive beside the historic Sindhudurg Fort, witness colorful coral reefs, and experience water sports including Jet Ski rides, Banana boat rides, and Parasailing.',
      imageUrl: '/assets/malvan_scuba.png',
      latitude: 16.0631,
      longitude: 73.4682,
      fitnessLevel: 2,
      bestSeason: 'October - May (Clear water season)',
      meetingPoint: 'Malvan Jetty, Malvan Port (07:30 AM)',
      emergencyHospital: 'Rural Hospital, Malvan (Cell: +91 2365 252024)',
      emergencyPolice: 'Malvan Police Station, Malvan (Cell: +91 2365 252033)',
      isApproved: true,
      operatorId: konkanProfile.id,
      itinerary: {
        create: [
          { day: 1, title: 'Boat Ride to Dive Site', description: 'Assemble at Malvan jetty at 7:30 AM. Board our custom boat towards Sindhudurg Fort waters. Detailed scuba breathing briefing by PADI instructors.' },
          { day: 1, title: 'Scuba Dive Session', description: 'Perform your 20-minute dive. Record underwater photos and videos with exotic fish and corals.' },
          { day: 1, title: 'Konkan Feast & Rest', description: 'Return to shore for a traditional Malvani seafood lunch (or veg alternative). Check into the beachside hotel.' },
          { day: 2, title: 'Water Sports Extravaganza', description: 'Reach Chivla Beach by 8:30 AM. Enjoy parasailing, jet-ski rides, banana rides, and bumper rides.' },
          { day: 2, title: 'Sindhudurg Fort Visit', description: 'Take a ferry ride to explore the historic 17th-century sea fort Sindhudurg. Checkout and leave by 4:00 PM.' }
        ]
      },
      inclusions: {
        create: [
          { text: 'One introductory scuba dive with professional PADI diver' },
          { text: 'Under-water high-definition video & photo capture' },
          { text: '5 core beach water sports (Parasailing, Jet-Ski, Banana, Bumper, Speedboat)' },
          { text: 'Traditional Malvani lunch on Day 1' },
          { text: '1-night accommodation in a budget AC room near the beach' }
        ]
      },
      exclusions: {
        create: [
          { text: 'Travel expenses to reach Malvan' },
          { text: 'Dinners and breakfast meals' }
        ]
      },
      essentials: {
        create: [
          { text: 'Swimwear or synthetic clothes' },
          { text: 'Extra set of dry clothes and towel' },
          { text: 'Sun protection glasses and hats' },
          { text: 'Personal medications' }
        ]
      },
      departures: {
        create: [
          { date: getWeekend(1, 'Sat'), maxCapacity: 12, bookedSlots: 0 },
          { date: getWeekend(2, 'Sat'), maxCapacity: 12, bookedSlots: 0 }
        ]
      }
    }
  });

  // Listing 5: Devkund Waterfall Trek
  const devkund = await prisma.adventure.create({
    data: {
      title: 'Devkund Waterfall Trek: Maharashtra’s Secret Lagoon',
      category: 'TREKKING',
      region: 'PUNE',
      difficulty: 'MODERATE',
      durationDays: 1,
      basePrice: 1199.00,
      description: 'Trek into the dense forests of the Bhira Dam backwaters to find Devkund, a spectacular 150-ft waterfall emptying into a crystal blue-green rock pool. Known as the "Pond of the Gods", this monsoon forest trail is one of the most scenic day treks near Pune and Mumbai.',
      imageUrl: '/assets/devkund_waterfall.png',
      latitude: 18.4239,
      longitude: 73.2982,
      fitnessLevel: 3,
      bestSeason: 'July - January (Post-monsoon is best)',
      meetingPoint: 'Bhira Village Base Camp, Patnus (07:00 AM)',
      emergencyHospital: 'Pali Municipal Hospital, Pali (Cell: +91 2192 269033)',
      emergencyPolice: 'Mangaon Police Station, Mangaon (Cell: +91 2193 252033)',
      isApproved: false, // Seeded as unapproved so operators can see it in operator portal and admin has something to approve!
      operatorId: sahyadriProfile.id,
      itinerary: {
        create: [
          { day: 1, title: 'Arrival & Breakfast', description: 'Arrive at Patnus village base camp by 7:00 AM. Fill up on breakfast (Misal Pav and Tea).' },
          { day: 1, title: 'Jungle Trail Trek', description: 'Enter the dense forest guided by local scouts. Hike along the river bank, cross two river beds, and climb rocky slopes for 2 hours.' },
          { day: 1, title: 'The Sacred Pool', description: 'Reach Devkund waterfall at 10:30 AM. Witness the massive water stream. Dive into the designated safe swimming zone.' },
          { day: 1, title: 'Descent & Lunch', description: 'Trek back to the base camp by 1:30 PM. Enjoy a traditional home-cooked Maharashtrian lunch. Depart by 3:30 PM.' }
        ]
      },
      inclusions: {
        create: [
          { text: 'Local guide charges and forest entry permits' },
          { text: 'Misal pav breakfast & hot village lunch' },
          { text: 'First aid and emergency evacuation team' }
        ]
      },
      exclusions: {
        create: [
          { text: 'Transport to Bhira base village' },
          { text: 'Personal dry snacks' }
        ]
      },
      essentials: {
        create: [
          { text: 'Extra pair of clothes (trek gets wet/muddy)' },
          { text: 'Ziplock bags to protect cameras/phones' },
          { text: 'At least 2 liters of water' },
          { text: 'Sports shoes or boots (strict policy against sandals)' }
        ]
      },
      departures: {
        create: [
          { date: getWeekend(1, 'Sat'), maxCapacity: 25, bookedSlots: 0 },
          { date: getWeekend(2, 'Sat'), maxCapacity: 25, bookedSlots: 0 }
        ]
      }
    }
  });

  // 6. Create Booking and Reviews
  console.log('📝 Creating bookings and reviews...');

  // Get departure references
  const kalsubaiDep = await prisma.departure.findFirst({
    where: { adventureId: kalsubai.id },
  });

  const bhandardaraDep = await prisma.departure.findFirst({
    where: { adventureId: bhandardara.id },
  });

  if (kalsubaiDep && bhandardaraDep) {
    // Booking 1
    const booking1 = await prisma.booking.create({
      data: {
        bookingNumber: 'ADVH-2026-0001',
        userId: custUser1.id,
        adventureId: kalsubai.id,
        departureId: kalsubaiDep.id,
        totalPrice: 2598.00, // 2 travelers * 1299
        status: 'CONFIRMED',
        paymentId: 'ch_stripe_mock_112233',
        travelers: {
          create: [
            { name: 'Rohan Patil', age: 26, emergencyContact: '9876543210' },
            { name: 'Amit Patil', age: 24, emergencyContact: '9876543210' }
          ]
        }
      }
    });

    // Update slots
    await prisma.departure.update({
      where: { id: kalsubaiDep.id },
      data: { bookedSlots: 2 }
    });

    // Booking 2
    const booking2 = await prisma.booking.create({
      data: {
        bookingNumber: 'ADVH-2026-0002',
        userId: custUser2.id,
        adventureId: bhandardara.id,
        departureId: bhandardaraDep.id,
        totalPrice: 4497.00, // 3 travelers * 1499
        status: 'PENDING',
        paymentId: null,
        travelers: {
          create: [
            { name: 'Sneha Deshmukh', age: 25, emergencyContact: '8888777766' },
            { name: 'Priya Joshi', age: 25, emergencyContact: '8888777766' },
            { name: 'Rahul Rane', age: 26, emergencyContact: '9999000011' }
          ]
        }
      }
    });

    // Update slots
    await prisma.departure.update({
      where: { id: bhandardaraDep.id },
      data: { bookedSlots: 3 }
    });
  }

  // Create Reviews
  await prisma.review.create({
    data: {
      userId: custUser1.id,
      adventureId: kalsubai.id,
      rating: 5,
      comment: 'An amazing experience! The guide was very knowledgeable, and climbing the ladders was challenging but safe. The village-style lunch at the end was delicious.'
    }
  });

  await prisma.review.create({
    data: {
      userId: custUser2.id,
      adventureId: bhandardara.id,
      rating: 4,
      comment: 'Great getaway from the city. The tents were spacious and neat. Bonfire acoustic session was the highlight. Wish the boating session was slightly longer.'
    }
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
