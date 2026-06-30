# 🏕️ MahaAdventure Pro
### Transactional Adventure Marketplace & Operator Ledger

---

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Prisma-v6.0-123C5E?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/JWT_Auth-Jose-blueviolet?style=for-the-badge&logo=json-web-tokens&logoColor=white" alt="JWT" />
</p>

---

## 🌟 The Vision
Maharashtra's outdoor adventure ecosystem (trekking, camping, rafting) is highly fragmented. Booking a trip usually means sending manual UPI transaction screenshots to local operators over WhatsApp, with no real-time slot checking, weather safety auditing, or guaranteed refund processes. 

**MahaAdventure Pro** solves this by delivering a **fully transactional weekend getaway booking marketplace**. It connects travelers with verified operator guides through a reliable database architecture, securing transactions while providing real-time slots and interactive dashboards.

---

## 📂 System Architecture Overview

```text
                  ┌──────────────────────────────────────────┐
                  │          CUSTOMER ENTRY POINT            │
                  │  (Discovery, SVGs Map, Live Weather API) │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │      EDGE JWT MIDDLEWARE ROUTE GUARD     │
                  │  (Verifies Role Claims & Session Cookie) │
                  └──────┬─────────────┬─────────────┬───────┘
                         │             │             │
        ┌────────────────┘             │             └────────────────┐
        ▼                              ▼                              ▼
 ┌──────────────┐               ┌──────────────┐               ┌──────────────┐
 │ CUSTOMER PORT│               │ OPERATOR LEDG│               │ ADMIN PANEL  │
 │  - Timelines │               │  - SVG Charts│               │  - Verify Ops│
 │  - QR Passes │               │  - Calendars │               │  - Approve   │
 │  - Refund UI │               │  - Guest List│               │    Listings  │
 └──────┬───────┘               └──────┬───────┘               └──────┬───────┘
        │                              │                              │
        └────────────────┐             │             ┌────────────────┘
                         ▼             ▼             ▼
                  ┌──────────────────────────────────────────┐
                  │            TRANSACTION ENGINE            │
                  │   (Prisma Slots Lock & Capacity Control) │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │             RELATIONAL SQLITE            │
                  │       (100% Normalized Schema)           │
                  └──────────────────────────────────────────┘
```

---

## ✨ Primary Features

### 🎒 The Traveler Experience
* **Autocomplete & Map Search**: Search destinations with a fuzzy suggestion engine or filter by clicking regions on an interactive SVG map of Maharashtra.
* **Weather & Safety Warnings**: Integration with the Open-Meteo REST API feeds real-time coordinate-based weather advisories directly to travelers before checkout.
* **Boarding Passes & QR Codes**: Dynamically generated tickets that encode booking references, coordinates, and emergency phone numbers for printing.
* **Cancellations & 100% Refunds**: Immediate customer self-cancellation that releases seats and returns a clear refund summary.

### 💼 The Operator Experience
* **SVG Analytics**: Programmatically generated, responsive charts representing monthly bookings and earnings without relying on bulky libraries.
* **Departure Ledger**: An operational calendar showing seats occupied, maximum capacity thresholds, and participant registers.
* **Listing Submissions**: A modal listing builder to submit new packages for admin verification.

### 🛡️ The Platform Admin Experience
* **Verification Queue**: A central registry to approve operator profiles and review submitted tour details.
* **Global Booking Audit**: Read-only access to all transaction statuses and platform-wide metrics.

---

## 🧠 SDE-Grade Technical Deep-Dives

<details>
<summary><b>1. Transactional Slot-Locking & Concurrency Control</b> <i>(Click to Expand)</i></summary>
<br>

To prevent double-bookings during peak hours, we wrap slots validation and customer writes in a database transaction block:
```typescript
const updatedBooking = await prisma.$transaction(async (tx) => {
  // 1. Fetch departure details and lock the row
  const departure = await tx.departure.findUnique({
    where: { id: departureId }
  });

  // 2. Compute current capacity
  const slotsRemaining = departure.maxCapacity - departure.bookedSlots;
  if (slotsRemaining < travelersCount) {
    throw new Error("CAPACITY_EXCEEDED");
  }

  // 3. Increment booked count and save booking details
  await tx.departure.update({
    where: { id: departureId },
    data: { bookedSlots: departure.bookedSlots + travelersCount }
  });

  return await tx.booking.create({ ... });
});
```
This guarantees atomic consistency, preventing race conditions.
</details>

<details>
<summary><b>2. Edge-Compatible Cryptographic Session Guards</b> <i>(Click to Expand)</i></summary>
<br>

Next.js Middleware intercepts routing on the Edge runtime, where standard Node dependencies like `jsonwebtoken` and `crypto` are unavailable. We resolved this constraint by utilizing the web-native `jose` library to sign and verify JSON Web Tokens:
```typescript
import { jwtVerify } from 'jose';
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}
```
This enables secure session decoding directly within routing middleware.
</details>

<details>
<summary><b>3. Relational Schema Normalization vs. Opaque Blobs</b> <i>(Click to Expand)</i></summary>
<br>

Many standard hackathon projects store traveler names, itinerary checklists, and essential item lists as stringified JSON strings inside single columns. This breaks database query filtering and indexing. 

Our schema is fully normalized:
- **`Departure`**: Handles capacities and dates.
- **`TravelerDetail`**: Maps age, emergency contacts, and references.
- **`Review`**: Enforces uniqueness using `@@unique([userId, adventureId])` to prevent spamming.
</details>

---

## 👤 Verification Credentials

You can test the system using the pre-seeded accounts below:

| Account Type | Email / Username | Password | Access Path | Core Verification Feature |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | `rohan.patil@gmail.com` | `customer123` | `/login` | Checkout wizard, Credit Card CVV flip animations, QR Boarding passes, cancellation receipt summaries. |
| **Operator** | `op.sahyadri@adventurehub.pro` | `operator123` | `/login` | Programmatic SVG earnings chart, passenger list tables, and listing drafts. |
| **Admin** | `admin@adventurehub.pro` | `admin123` | `/login` | Operator verification controls, new adventure approval logs, global stats. |

---

## 🛠️ Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Database Schema**:
   ```bash
   npx prisma db push
   ```

3. **Execute Seeds Script**:
   ```bash
   npx prisma db seed
   ```

4. **Boot Local Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to run the project.
