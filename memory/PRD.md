# Sakleshpura Tourist Ride App — PRD

## Overview
UI-only mobile app (Expo/React Native) for a tourist ride-hailing service in Sakleshpura, Karnataka. Uber-style dark aesthetic, single accent color (electric blue). All data is mock; no backend or real auth. User will wire the backend separately.

## Screens Delivered
1. **Landing (`/`)** — Cinematic misty Western-Ghats background, "WHERE TO ?!" masked behind hills gradient, single Get-started CTA.
2. **Auth (`/auth`)** — Customer/Driver toggle, phone-number + OTP flow, subtle glass bottom-sheet.
3. **Home tab (`/home`)** — Auto-playing 30vh package carousel (10 tours), Plan Your Trip card, Track-live-ride shortcut, horizontal past-trips list.
4. **Trips tab (`/trips`)** — Full list of past rides with fare and status.
5. **Profile tab (`/profile`)** — Customer profile, stats, settings rows (incl. "Switch to Driver").
6. **Driver (`/driver`)** — Online/offline glowing toggle → opens dashboard on tap, profile card, personal info, verified documents (Aadhaar, DL, permit), vehicle details.
7. **Driver Dashboard (`/driver-dashboard`)** — Online toggle, today's earnings/trips/hours, live incoming ride requests with rider info, fare, route, accept/decline actions.
8. **Plan trip (`/plan`)** — Mock SVG map with 3 pins & blue route line, destination input, reorderable stops list.
9. **Vehicles (`/vehicles`)** — Sedan / SUV / Traveller / Premium with fares & selected-state blue border.
10. **Checkout (`/checkout`)** — Trip recap, fare breakdown, Card + UPI only (no cash), Pay CTA → routes to ride tracking.
11. **Ride in Progress (`/ride`)** — Live SVG map with animated blue pulsing car pin, phased state (arriving → onboard → arrived), driver card with call/message, trip step progress, Safety & Cancel actions.
12. **Rating (`/rating`)** — Driver info, 5-star selector, contextual compliment chips, note field, tip presets (0/50/100/200), Submit + Tip CTA.

## Navigation Flows
- Customer: Landing → Auth → Home → Plan → Vehicles → Checkout → Ride → Rating → Home
- Driver: Auth → Driver profile → Driver Dashboard → Accept request → Ride

## Design System
- Pure dark theme (#000 base, #111 surface).
- Single accent: electric blue `#1E6BFF` — used only on CTAs, toggle glow, selected border, route line, active tab, animated car pulse.
- Blur used lightly only on auth sheet.
- Bottom fixed nav (Home / Trips / Profile).
- Safe-area handled everywhere via `react-native-safe-area-context`.
- All interactive elements have kebab-case `testID`s.

## Mock Data
- 10 tour packages with Unsplash imagery
- 4 past trips
- 4 vehicles
- 1 driver profile
- 3 incoming ride requests

## Tech
- Expo Router (file-based), Reanimated, expo-blur, expo-linear-gradient, react-native-svg.
- No backend, no auth, no payment gateway — pure UI ready to be wired.
