# MahaAdventure Pro 🏕️🧗‍♀️

**MahaAdventure Pro** is a production-ready, transactional booking marketplace designed to simplify weekend getaways in Maharashtra. The platform connects travelers with verified local adventure operators, handling discovery, real-time safety advisories, booking ledgers, and secure mock payments.

Built with an SDE-1 mindset, the platform moves beyond simple academic CRUD by implementing strict relational integrity, concurrent slot-locking database transactions, Edge-compatible JWT authentication, and interactive dashboards for all three system roles (Customer, Operator, Admin).

---

## 🚀 Key SDE-Grade Engineering Highlights

### 1. Concurrency & Slot-Locking Transactions
To prevent double-booking or overbooking of popular weekend slots, the booking route utilizes Prisma's transactional engine (`prisma.$transaction`). 
* When a booking request is made, the departure date is locked.
* The system computes `maxCapacity - bookedSlots`.
* If capacity is exceeded, the transaction rolls back instantly.
* If successful, the slots are reserved, traveler lists are written, and the departure capacity is incremented atomically.
* **Slot Replenishment**: If a customer cancels their booking, the slots are automatically released and returned to the pool.

### 2. Edge-Compatible JWT Authentication
Next.js middleware runs on the Vercel Edge runtime, which restricts standard Node.js APIs like `crypto` or `jsonwebtoken`.
* We implemented Edge-compliant JWT validation using the web-native `jose` library.
* Intercepts route requests on the fly to route users to the appropriate role-based dashboards (`/dashboard`, `/operator`, `/admin`).
* Role protection is enforced on the database level—registration forms strip out `ADMIN` claims, ensuring administrative accounts can only be seeded securely via command-line credentials.

### 3. Normalized Relational Database Schema
Rather than using stringified JSON blobs (which break database querying, indexing, and aggregations), the database utilizes a fully normalized SQLite schema:
* **Models**: `User`, `OperatorProfile`, `Adventure`, `Departure`, `Booking`, `TravelerDetail`, `ItineraryStep`, `Inclusion`, `Exclusion`, and `EssentialItem`.
* **Database Indexes**: Configured `@@index` on highly queried fields like `category`, `region`, `difficulty`, `status`, and `createdAt` to guarantee sub-millisecond query responses.

### 4. Dynamic Pricing Engine
Features an automated pricing utility (`src/lib/pricing.ts`) that computes price breakdowns based on:
* **Weekend Surcharge**: +15% for Saturday/Sunday departures (due to high logistics demand).
* **Group Discount**: -10% if booking for 4 or more travelers.
* **Promo Coupon**: Supports promotional codes (like `MAHA20` for an additional 20% off).

### 5. Live Weather Safety Alerts (Open-Meteo REST API)
* Programmatically requests coordinates of the selected trek/camping site.
* Connects to the public Open-Meteo REST service to retrieve temperature, precipitation, and wind speeds.
* Displays dynamic warning flags on the details page (e.g. warning about slippery Sahyadri trails during high rainfall or heavy wind).

### 6. Dynamic QR Boarding Tickets
* Generates printable PDF-friendly boarding passes on the Customer Dashboard.
* Integrates `qrcode.react` to render a unique SVG QR code containing booking reference numbers, date timestamps, coordinates, and passenger counts.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide Icons
* **Backend**: Next.js Server Actions & API Routes, Jose (JWT), Zod (Validation)
* **Database**: Prisma ORM, SQLite
* **Utilities**: Framer Motion (Transitions), qrcode.react (QR codes)

---

## 📦 Local Installation & Setup

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Database**:
   Configure and push the database schema:
   ```bash
   npx prisma db push
   ```

3. **Seed Database**:
   Seed the administrative accounts, operator profiles, 5 default adventure tours, departures, and reviews:
   ```bash
   npx prisma db seed
   ```

4. **Launch Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 👤 Verification Credentials

You can test the multi-tenant system using the following seeded accounts:

### 1. Customer Account
* **Email**: `rohan.patil@gmail.com`
* **Password**: `customer123`
* **Features**: Search with autocomplete, region filters, compare modal, checkout payment flip cards, cancellation triggers, 100% refund receipt sheets, printable QR passes.

### 2. Operator Account
* **Email**: `op.sahyadri@adventurehub.pro`
* **Password**: `operator123`
* **Features**: Programmatic SVG revenue charts, upcoming departures calendars, guest list tracking, and new tour listing submissions.

### 3. Admin Account
* **Email**: `admin@adventurehub.pro`
* **Password**: `admin123`
* **Features**: Operator approval queue, adventure verification toggle switches, platform revenue monitors, and booking ledger logs.
