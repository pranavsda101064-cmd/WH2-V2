// Sakleshpura service area boundary (roughly 20km radius)
// Bounding box: lat 12.93–13.14, lng 75.68–75.88
const BOUNDS = {
  minLat: 12.93,
  maxLat: 13.14,
  minLng: 75.68,
  maxLng: 75.88,
};

export function isWithinServiceArea(lat: number, lng: number): boolean {
  return lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "User-Agent": "Where2App/1.0" } },
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export type TouristPlace = {
  name: string;
  lat: number;
  lng: number;
  description: string;
  tag: string;
};

export const TOURIST_PLACES: TouristPlace[] = [
  // Heritage
  { name: "Manjarabad Fort", lat: 13.0417, lng: 75.8106, description: "Star-shaped fort built by Tipu Sultan", tag: "Heritage" },
  { name: "Sakleshwara Swamy Temple", lat: 13.036, lng: 75.782, description: "Ancient Hoysala-era Shiva temple", tag: "Heritage" },
  { name: "Settihalli Church", lat: 13.01, lng: 75.755, description: "The floating church in Hemavathi reservoir", tag: "Heritage" },
  { name: "Gateway of Sakleshpura", lat: 13.037, lng: 75.784, description: "Historic town center", tag: "Heritage" },
  { name: "Bettada Bhairaveshwara Temple", lat: 13.05, lng: 75.81, description: "600-year-old hilltop temple", tag: "Heritage" },
  // Nature
  { name: "Bisle Ghat Viewpoint", lat: 13.0689, lng: 75.8681, description: "Stunning Western Ghats viewpoint", tag: "Nature" },
  { name: "Kadambi Falls", lat: 13.053, lng: 75.832, description: "Multi-tier waterfall in forest", tag: "Nature" },
  { name: "Mallalli Falls", lat: 13.072, lng: 75.853, description: "Spectacular 200m waterfall", tag: "Nature" },
  { name: "Patla Betta", lat: 13.065, lng: 75.865, description: "Hilltop viewpoint, jeep access only", tag: "Nature" },
  { name: "Jenukal Gudda", lat: 13.07, lng: 75.84, description: "Honey-stone hill trek", tag: "Nature" },
  { name: "Pandavar Gudda", lat: 13.055, lng: 75.82, description: "Hill with panoramic views", tag: "Nature" },
  { name: "Sakleshpura Lake", lat: 13.035, lng: 75.783, description: "Peaceful lakeside walk", tag: "Nature" },
  { name: "Hemavathi Dam", lat: 13.005, lng: 75.76, description: "Reservoir with boating", tag: "Nature" },
  // Adventure
  { name: "Magajahalli Falls", lat: 13.012, lng: 75.845, description: "21ft waterfall, great for trekking", tag: "Adventure" },
  { name: "Agni Gudda Hill", lat: 13.058, lng: 75.798, description: "Volcanic hill, camping & trekking", tag: "Adventure" },
  { name: "Bettabalerehundi Hill", lat: 13.02, lng: 75.77, description: "Sunrise trekking spot", tag: "Adventure" },
  { name: "Green Route Trek", lat: 13.04, lng: 75.82, description: "Railway track trek through tunnels", tag: "Adventure" },
  // Culture
  { name: "Anekad Coffee Plantation", lat: 13.048, lng: 75.795, description: "Coffee estate walk & tasting", tag: "Culture" },
  { name: "Kukke Subramanya Temple", lat: 12.66, lng: 75.617, description: "Famous Naga temple near Sakleshpur", tag: "Culture" },
  // Food
  { name: "Mythri Restaurant", lat: 13.037, lng: 75.783, description: "Popular South Indian restaurant", tag: "Food" },
  { name: "Ossoor Restaurant", lat: 13.038, lng: 75.785, description: "Authentic local cuisine", tag: "Food" },
  { name: "Green Pastures", lat: 13.039, lng: 75.781, description: "Continental & multi-cuisine", tag: "Food" },
  { name: "Hanbal Chikki Factory", lat: 13.015, lng: 75.84, description: "Local sweet shop", tag: "Food" },
  // Stay
  { name: "Machaan Plantation Resort", lat: 13.044, lng: 75.797, description: "Treehouse stays in coffee estate", tag: "Stay" },
  { name: "Mookanana Resort", lat: 12.781, lng: 75.709, description: "Deep forest resort", tag: "Stay" },
  { name: "Eka Resort", lat: 13.043, lng: 75.804, description: "Near Manjarabad Fort", tag: "Stay" },
  { name: "Rosetta Sakleshpur", lat: 13.042, lng: 75.79, description: "Heritage resort & spa", tag: "Stay" },
];

// Parse Google Maps URLs and extract lat/lng
export function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  try {
    // Pattern 1: @lat,lng,zoomz
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

    // Pattern 2: ?q=lat,lng or ?ll=lat,lng
    const qMatch = url.match(/[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

    // Pattern 3: /place/Name/@lat,lng
    const placeMatch = url.match(/place\/[^@]*@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };

    // Pattern 4: Google Plus Code or direct coordinates
    const coordMatch = url.match(/(-?\d{1,3}\.\d{2,7})\s*[,/]\s*(-?\d{1,3}\.\d{2,7})/);
    if (coordMatch) return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };

    return null;
  } catch {
    return null;
  }
}

// Resolve shortened Google Maps URLs
export async function resolveGoogleMapsUrl(url: string): Promise<string> {
  if (!url.includes("maps.app.goo.gl") && !url.includes("goo.gl/maps") && !url.includes("maps.google")) {
    return url;
  }
  try {
    const res = await fetch(url, { redirect: "follow" });
    return res.url;
  } catch {
    return url;
  }
}
