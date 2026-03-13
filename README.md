# 🏨 HotelWhiz — Hotel Booking & Management Platform

A full-featured hotel booking and management system built with Next.js. Guests can browse rooms, make reservations, and manage bookings — while hotel staff manage everything through an admin dashboard.

## Features

- **Room Browsing** — search by date, type, and availability
- **Online Booking** — reservation flow with confirmation emails
- **Guest Portal** — view and manage bookings
- **Admin Dashboard** — manage rooms, reservations, pricing, and guests
- **Payment Integration** — ready for Stripe / payment gateway
- **Multi-room Types** — standard, deluxe, suite configurations

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** NextAuth.js
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Pages

- `/` — Landing & room showcase
- `/rooms` — Browse all rooms with filters
- `/rooms/[id]` — Room detail & booking form
- `/dashboard` — Guest booking management
- `/admin` — Hotel management panel

## Setup

```bash
git clone https://github.com/devslotcy/hotelwhiz
cd hotelwhiz
npm install
cp .env.example .env.local
npx prisma migrate dev
npm run dev
```

---

Built by [Mucahit Tiglioglu](https://github.com/devslotcy)
