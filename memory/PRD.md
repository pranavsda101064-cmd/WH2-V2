# Sakleshpura Tourist Ride App — PRD

## Overview
Mobile ride-hailing app for tourists in Sakleshpura, Karnataka. Uber-style dark UI (Expo/React Native) + FastAPI/MongoDB backend. Frontend keeps mock data as automatic fallback whenever the backend is unreachable.

## Screens
1. **Landing (`/`)** — misty forest bg with "WHERE TO ?!" masked behind hills, Get-started CTA.
2. **Auth (`/auth`)** — Customer/Driver toggle, phone + OTP (mock).
3. **Home (`/home`)** — 30vh auto-playing package carousel (fetched from `/api/packages`), Plan Your Trip, Track live ride, previous trips (from `/api/rides`).
4. **Trips (`/trips`)** — full ride history (`/api/rides`).
5. **Profile (`/profile`)** — customer profile, "Switch to Driver".
6. **Driver (`/driver`)** — glowing online toggle opens dashboard, docs, vehicle info.
7. **Driver Dashboard (`/driver-dashboard`)** — earnings/trips/hours (`/api/driver/stats`), incoming requests (`/api/driver/requests`), accept → creates ride.
8. **Plan (`/plan`)** — SVG mock map, stops list, reorder.
9. **Vehicles (`/vehicles`)** — from `/api/vehicles`, selects → stores in local storage.
10. **Checkout (`/checkout`)** — fare breakdown, Card/UPI only, Pay creates a ride via `POST /api/rides`.
11. **Ride (`/ride`)** — animated blue pulsing car pin, phase auto-advances and pushes status via `PATCH /api/rides/{id}/status`.
12. **Rating (`/rating`)** — 5-star + compliments + tip, submits via `POST /api/ratings`, marks ride completed.

## Backend (FastAPI + MongoDB)
All routes under `/api`:
- `GET /packages` – list 10 tour packages (seeded)
- `GET /vehicles` – list vehicle types (seeded)
- `POST /rides` – create ride
- `GET /rides` – list rides (per user)
- `GET /rides/{id}` – fetch one
- `PATCH /rides/{id}/status` – arriving | onboard | arrived | completed | cancelled
- `POST /ratings` – submit rating + tip (also flips ride to completed)
- `GET /driver/requests` – incoming ride requests (seeded)
- `POST /driver/requests/{id}/accept` – accept → creates ride, removes from queue
- `GET /driver/stats` – earnings/trips/hours (aggregated from completed rides)

Collections: `packages`, `vehicles`, `rides`, `ratings`, `driver_requests`.
Idempotent seeding on startup — inserts only when a collection is empty.
No auth yet (kept out per original brief so the user can wire their own).
No real payment gateway — checkout records payment_method + fare only.

## Frontend API Client
`/app/frontend/src/api.ts` — a `fetch` wrapper (`api.listPackages`, `api.createRide`, `api.updateRideStatus`, …). Every call has a bundled mock fallback so the UI never breaks if the backend is down.

## Design System
Pure dark (#000 / #111 surfaces), single electric-blue accent `#1E6BFF` on CTAs, toggles, selected borders, route line, animated pulses, active tab. Glass/blur only on auth sheet. Fixed bottom nav, all safe-area aware, kebab-case `testID`s.
