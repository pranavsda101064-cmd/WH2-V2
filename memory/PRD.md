# Sakleshpura Tourist Ride App — PRD

## Overview
UI-only mobile app (Expo/React Native) for a tourist ride-hailing service in Sakleshpura, Karnataka. Uber-style dark aesthetic, single accent color (electric blue). All data is mock; no backend or real auth. User will wire the backend separately.

## Screens Delivered
1. **Landing (`/`)** — Cinematic misty Western-Ghats background, "WHERE TO ?!" masked behind hills gradient, single Get-started CTA.
2. **Auth (`/auth`)** — Customer/Driver toggle, phone-number + OTP flow, subtle glass bottom-sheet.
3. **Home tab (`/home`)** — Auto-playing 30vh package carousel (10 tours), Plan Your Trip card, Saved places, horizontal past-trips list.
4. **Trips tab (`/trips`)** — Full list of past rides with fare and status.
5. **Profile tab (`/profile`)** — Customer profile, stats, settings rows (incl. "Switch to Driver").
6. **Driver (`/driver`)** — Online/offline glowing toggle, profile card, personal info, verified documents (Aadhaar, DL, permit), vehicle details.
7. **Plan trip (`/plan`)** — Mock SVG map with 3 pins & blue route line, destination input, reorderable stops list.
8. **Vehicles (`/vehicles`)** — Sedan / SUV / Traveller / Premium with fares & selected-state blue border.
9. **Checkout (`/checkout`)** — Trip recap, fare breakdown, Card + UPI only (no cash), Pay CTA, success confirmation.

## Design System
- Pure dark theme (#000 base, #111 surface).
- Single accent: electric blue `#1E6BFF` — used only on CTAs, toggle glow, selected border, route line, active tab.
- Blur used lightly only on auth sheet.
- Bottom fixed nav (Home / Trips / Profile).
- Safe-area handled everywhere via `react-native-safe-area-context`.

## Mock Data
- 10 tour packages with Unsplash imagery
- 4 past trips
- 4 vehicles
- 1 driver profile

## Tech
- Expo Router (file-based), Reanimated, expo-blur, expo-linear-gradient, react-native-svg.
- All navigation flows are wired: landing → auth → home → plan → vehicles → checkout → home (loop).
