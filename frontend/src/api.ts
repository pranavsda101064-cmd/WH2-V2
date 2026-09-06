// Lightweight API client with mock fallback.
// If the backend is unreachable or returns an error, the frontend
// silently falls back to bundled mock data so the UI never breaks.

import {
  driverProfile as mockDriver,
  packages as mockPackages,
  pastTrips as mockPastTrips,
  vehicles as mockVehicles,
} from "@/src/data/mock";
import { storage } from "@/src/utils/storage";
import { getCached, setCache } from "@/src/utils/cache";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const TOKEN_KEY = "auth_token";
const USER_EMAIL_KEY = "auth_user_email";

// ---- Token helpers ----
export async function getToken(): Promise<string | null> {
  return storage.secureGet<string>(TOKEN_KEY, "");
}

export async function setToken(token: string): Promise<void> {
  await storage.secureSet(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
}

export async function getUserEmail(): Promise<string> {
  return (await storage.getItem<string>(USER_EMAIL_KEY, "")) || "";
}

export async function setUserEmail(email: string): Promise<void> {
  await storage.setItem(USER_EMAIL_KEY, email);
}

export async function clearUserEmail(): Promise<void> {
  await storage.removeItem(USER_EMAIL_KEY);
}

// ---- Internal request helper ----
async function req<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  if (!BASE) return fallback as T;
  try {
    const token = await getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> || {}),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE}/api${path}`, {
      ...init,
      headers,
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

export type RideStop = { label: string; sub?: string; lat?: number; lng?: number };

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

export type DriverProfile = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  dob: string | null;
  address: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
};

export type DriverDocument = {
  id: string;
  doc_type: string;
  file_path: string;
  verification_status: string;
  notes: string | null;
  created_at: string;
};

export type DriverVehicle = {
  id: string;
  driver_id: string;
  vehicle_type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  reg_number: string;
  seats: number;
  photo_url: string | null;
  created_at: string;
};

// ---- Endpoints ----
export const api = {
  // Auth
  register: async (email: string, password: string, role: "customer" | "driver" = "customer") => {
    const data = await req<{ access_token: string; user: { email: string; role: string } }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ email, password, role }) },
    );
    if (data?.access_token) {
      await setToken(data.access_token);
      await setUserEmail(email);
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await req<{ access_token: string; user: { email: string } }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    if (data?.access_token) {
      await setToken(data.access_token);
      await setUserEmail(email);
    }
    return data;
  },

  logout: async () => {
    await clearToken();
    await clearUserEmail();
  },

  googleAuth: async (idToken: string, role: "customer" | "driver" = "customer") => {
    const data = await req<{ access_token: string; user: { email: string; role: string } }>(
      "/auth/google",
      { method: "POST", body: JSON.stringify({ id_token: idToken, role }) },
    );
    if (data?.access_token) {
      await setToken(data.access_token);
      await setUserEmail(data.user.email);
    }
    return data;
  },

  // Packages
  listPackages: async () => {
    const cached = await getCached<Package[]>("packages");
    if (cached) return cached;
    const data = await req<Package[]>("/packages", undefined, mockPackages as unknown as Package[]);
    await setCache("packages", data);
    return data;
  },

  // Vehicles
  listVehicles: async () => {
    const cached = await getCached<Vehicle[]>("vehicles");
    if (cached) return cached;
    const data = await req<Vehicle[]>("/vehicles", undefined, mockVehicles as unknown as Vehicle[]);
    await setCache("vehicles", data);
    return data;
  },

  // Rides
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

  listRides: async () => {
    const cached = await getCached<Ride[]>("rides");
    if (cached) return cached;
    const data = await req<Ride[]>(
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
    );
    await setCache("rides", data);
    return data;
  },

  updateRideStatus: (id: string, status: Ride["status"]) =>
    req<Ride>(`/rides/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Ratings
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

  // Driver
  listDriverRequests: () =>
    req<DriverRequest[]>("/driver/requests", undefined, [
      { id: "r1", pickup: "Sakleshpura Bus Stand", drop: "Bisle Ghat Viewpoint", distance: "46 km", duration: "1h 40m", fare: 2199, rider: "Aditi S.", rating: 4.9, tag: "3 stops" },
      { id: "r2", pickup: "Green Route Homestay", drop: "Manjarabad Fort", distance: "12 km", duration: "22 min", fare: 899, rider: "Rohit K.", rating: 4.8, tag: "Direct" },
      { id: "r3", pickup: "Coffee Estate Retreat", drop: "Hanbal Falls", distance: "18 km", duration: "32 min", fare: 1499, rider: "Priya M.", rating: 5.0, tag: "2 stops" },
    ]),

  acceptRequest: (id: string) =>
    req<Ride>(`/driver/requests/${id}/accept`, { method: "POST" }),

  declineRequest: (id: string) =>
    req<{ status: string }>(`/driver/requests/${id}/decline`, { method: "POST" }),

  driverStats: () =>
    req<DriverStats>("/driver/stats", undefined, {
      earnings: 0,
      trips: 0,
      hours: 0,
    }),

  // Driver Onboarding
  createDriverProfile: (body: {
    full_name: string;
    phone: string;
    dob?: string;
    address?: string;
  }) =>
    req<DriverProfile>(
      "/driver/profile",
      { method: "POST", body: JSON.stringify(body) },
    ),

  getDriverProfile: () =>
    req<DriverProfile>("/driver/profile"),

  uploadDocument: async (docType: string, file: { uri: string; type: string; name: string }) => {
    const token = await getToken();
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);
    const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
    const res = await fetch(`${BASE}/api/driver/documents?doc_type=${docType}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json() as Promise<DriverDocument>;
  },

  listDocuments: () =>
    req<DriverDocument[]>("/driver/documents", undefined, []),

  createVehicle: (body: {
    vehicle_type: string;
    make?: string;
    model?: string;
    year?: number;
    reg_number: string;
    seats?: number;
  }) =>
    req<DriverVehicle>(
      "/driver/vehicles",
      { method: "POST", body: JSON.stringify(body) },
    ),

  listVehiclesDriver: () =>
    req<DriverVehicle[]>("/driver/vehicles", undefined, []),
};
