// Lightweight API client with mock fallback.
// If the backend is unreachable or returns an error, the frontend
// silently falls back to bundled mock data so the UI never breaks.

import {
  driverProfile as mockDriver,
  packages as mockPackages,
  pastTrips as mockPastTrips,
  vehicles as mockVehicles,
} from "@/src/data/mock";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function req<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  if (!BASE) return fallback as T;
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    if (fallback !== undefined) return fallback;
    throw e;
  }
}

// ---- Types ----
export type Package = (typeof mockPackages)[number];
export type Vehicle = (typeof mockVehicles)[number] & { icon: string };

export type RideStop = { label: string; sub?: string };

export type Ride = {
  id: string;
  user_id: string;
  vehicle_id: string;
  stops: RideStop[];
  fare: number;
  payment_method: "card" | "upi";
  tip: number;
  status: "arriving" | "onboard" | "arrived" | "completed" | "cancelled";
  created_at: string;
};

export type DriverRequest = {
  id: string;
  pickup: string;
  drop: string;
  distance: string;
  duration: string;
  fare: number;
  rider: string;
  rating: number;
  tag: string;
};

export type DriverStats = { earnings: number; trips: number; hours: number };

// ---- Endpoints ----
export const api = {
  listPackages: () =>
    req<Package[]>("/packages", undefined, mockPackages as unknown as Package[]),
  listVehicles: () =>
    req<Vehicle[]>("/vehicles", undefined, mockVehicles as unknown as Vehicle[]),
  createRide: (body: {
    vehicle_id: string;
    stops: RideStop[];
    fare: number;
    payment_method: "card" | "upi";
    tip?: number;
  }) =>
    req<Ride>(
      "/rides",
      { method: "POST", body: JSON.stringify(body) },
      {
        id: "mock-" + Date.now(),
        user_id: "explorer",
        vehicle_id: body.vehicle_id,
        stops: body.stops,
        fare: body.fare,
        payment_method: body.payment_method,
        tip: body.tip ?? 0,
        status: "arriving",
        created_at: new Date().toISOString(),
      },
    ),
  listRides: () =>
    req<Ride[]>(
      "/rides",
      undefined,
      mockPastTrips.map((t) => ({
        id: t.id,
        user_id: "explorer",
        vehicle_id: "v1",
        stops: [{ label: t.title }],
        fare: t.fare,
        payment_method: "card" as const,
        tip: 0,
        status: "completed" as const,
        created_at: t.date,
      })),
    ),
  updateRideStatus: (id: string, status: Ride["status"]) =>
    req<Ride>(`/rides/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  submitRating: (body: {
    ride_id: string;
    stars: number;
    tags?: string[];
    note?: string;
    tip?: number;
  }) =>
    req<{ id: string }>(
      "/ratings",
      { method: "POST", body: JSON.stringify(body) },
      { id: "mock-rating" },
    ),
  listDriverRequests: () =>
    req<DriverRequest[]>("/driver/requests", undefined, [
      { id: "r1", pickup: "Sakleshpura Bus Stand", drop: "Bisle Ghat Viewpoint", distance: "46 km", duration: "1h 40m", fare: 2199, rider: "Aditi S.", rating: 4.9, tag: "3 stops" },
      { id: "r2", pickup: "Green Route Homestay", drop: "Manjarabad Fort", distance: "12 km", duration: "22 min", fare: 899, rider: "Rohit K.", rating: 4.8, tag: "Direct" },
      { id: "r3", pickup: "Coffee Estate Retreat", drop: "Hanbal Falls", distance: "18 km", duration: "32 min", fare: 1499, rider: "Priya M.", rating: 5.0, tag: "2 stops" },
    ]),
  acceptRequest: (id: string) =>
    req<Ride>(`/driver/requests/${id}/accept`, { method: "POST" }),
  driverStats: () =>
    req<DriverStats>("/driver/stats", undefined, {
      earnings: 3420,
      trips: 6,
      hours: 7.4,
    }),
};

// Driver profile is still local (no auth yet).
export const driverProfile = mockDriver;
