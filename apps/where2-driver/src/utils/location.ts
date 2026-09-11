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

export type TouristPlace = {
  name: string;
  lat: number;
  lng: number;
  description: string;
  tag: string;
};

export const TOURIST_PLACES: TouristPlace[] = [
  { name: "Manjarabad Fort", lat: 13.0417, lng: 75.8106, description: "Star-shaped fort with panoramic views", tag: "Heritage" },
  { name: "Bisle Ghat Viewpoint", lat: 13.0689, lng: 75.8681, description: "Stunning valley viewpoint", tag: "Nature" },
  { name: "Hanbal Falls", lat: 13.012, lng: 75.845, description: "Scenic waterfall trek", tag: "Adventure" },
  { name: "Sakleshpura Lake", lat: 13.035, lng: 75.783, description: "Peaceful lakeside walk", tag: "Relax" },
  { name: "Kadambi Falls", lat: 13.053, lng: 75.832, description: "Multi-tier waterfall", tag: "Nature" },
  { name: "Bettabalerehundi Hill", lat: 13.02, lng: 75.77, description: "Sunrise trekking spot", tag: "Adventure" },
  { name: "Anekad Coffee Plantation", lat: 13.048, lng: 75.795, description: "Coffee estate tour", tag: "Culture" },
  { name: "Mallalli Falls", lat: 13.072, lng: 75.853, description: "Spectacular 200m waterfall", tag: "Nature" },
  { name: "Gateway of Sakleshpura", lat: 13.037, lng: 75.784, description: "Historic town center", tag: "Heritage" },
  { name: "Hemavathi Dam", lat: 13.005, lng: 75.76, description: "Reservoir with boating", tag: "Relax" },
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
