// Real Unsplash imagery of Sakleshpura, Chikmagalur, and Western Ghats, Karnataka.
// Free under the Unsplash License — no API key needed.
export const packages = [
  {
    id: "p1",
    title: "Misty Coffee Estates",
    subtitle: "Full-day estate walk",
    price: 2499,
    duration: "8 hrs",
    stops: 4,
    image:
      "https://images.unsplash.com/photo-1750967613671-297f1b63038d?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "p2",
    title: "Bisle Ghat Viewpoint",
    subtitle: "Sunrise ridge drive",
    price: 1899,
    duration: "5 hrs",
    stops: 3,
    image:
      "https://images.unsplash.com/photo-dQ5spWYhQro?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "p3",
    title: "Manjarabad Fort",
    subtitle: "Star-shaped heritage",
    price: 1499,
    duration: "4 hrs",
    stops: 2,
    image:
      "https://images.unsplash.com/photo-vbE-OMJa3zI?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "p4",
    title: "Hills & Homestays",
    subtitle: "Overnight coffee stay",
    price: 4999,
    duration: "24 hrs",
    stops: 5,
    image:
      "https://images.unsplash.com/photo--Zt97RnOWJ8?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "p5",
    title: "Hanbal Waterfall Trail",
    subtitle: "Monsoon cascade",
    price: 1799,
    duration: "5 hrs",
    stops: 2,
    image:
      "https://images.unsplash.com/photo-3i-84-23-x8?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "p6",
    title: "Shanti Falls & Green Route",
    subtitle: "Rainforest loop",
    price: 2199,
    duration: "6 hrs",
    stops: 3,
    image:
      "https://images.unsplash.com/photo-iIse25psfGs?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "p7",
    title: "Kukke Subrahmanya Temple",
    subtitle: "Sacred hill drive",
    price: 2899,
    duration: "10 hrs",
    stops: 3,
    image:
      "https://images.unsplash.com/photo-2qYQylBLs_E?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "p8",
    title: "Mookanamane Falls",
    subtitle: "Off-road adventure",
    price: 2299,
    duration: "6 hrs",
    stops: 2,
    image:
      "https://images.unsplash.com/photo-KN_GIIJRe7Q?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "p9",
    title: "Sakleshpur Sunset Point",
    subtitle: "Golden hour ridge",
    price: 1299,
    duration: "3 hrs",
    stops: 1,
    image:
      "https://images.unsplash.com/photo-_Ien7zEYA1E?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "p10",
    title: "Green Route Railway Walk",
    subtitle: "Abandoned viaducts",
    price: 2599,
    duration: "7 hrs",
    stops: 4,
    image:
      "https://images.unsplash.com/photo-obnfVkzB650?auto=format&fit=crop&w=1200&q=70",
  },
];

export const pastTrips = [
  {
    id: "t1",
    title: "Bengaluru → Sakleshpura",
    date: "Apr 12, 2026",
    fare: 3200,
    image:
      "https://images.unsplash.com/photo-YPdcs99p3MY?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "t2",
    title: "Estate Tour",
    date: "Mar 03, 2026",
    fare: 2499,
    image:
      "https://images.unsplash.com/photo-1750967613671-297f1b63038d?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "t3",
    title: "Bisle Ghat Sunrise",
    date: "Feb 18, 2026",
    fare: 1899,
    image:
      "https://images.unsplash.com/photo-dQ5spWYhQro?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "t4",
    title: "Manjarabad Fort",
    date: "Jan 22, 2026",
    fare: 1499,
    image:
      "https://images.unsplash.com/photo-vbE-OMJa3zI?auto=format&fit=crop&w=800&q=70",
  },
];

export const vehicles = [
  {
    id: "v1",
    name: "Sedan",
    desc: "Comfortable, AC",
    seats: 4,
    fare: 2199,
    eta: "3 min",
    icon: "car-outline" as const,
  },
  {
    id: "v2",
    name: "SUV",
    desc: "Extra space, hill-ready",
    seats: 6,
    fare: 2899,
    eta: "5 min",
    icon: "car-sport-outline" as const,
  },
  {
    id: "v3",
    name: "Traveller",
    desc: "Group minivan",
    seats: 12,
    fare: 4499,
    eta: "8 min",
    icon: "bus-outline" as const,
  },
  {
    id: "v4",
    name: "Premium",
    desc: "Executive class",
    seats: 4,
    fare: 3499,
    eta: "6 min",
    icon: "car-outline" as const,
  },
];

export const driverProfile = {
  name: "Ravi Kumar",
  phone: "+91 98452 11298",
  address: "Hassan Road, Sakleshpura, KA 573134",
  aadhaar: "XXXX-XXXX-8721",
  license: "KA05 20180012345",
  permit: "TP-KA-2024-8891",
  vehicle: {
    type: "SUV",
    reg: "KA 13 X 4421",
    seats: 6,
  },
  rating: 4.87,
  trips: 1284,
};

export const stopsSeed = [
  { id: "s1", label: "Sakleshpura Bus Stand", sub: "Pickup point" },
  { id: "s2", label: "Manjarabad Fort", sub: "Stop 1 · 12 km" },
  { id: "s3", label: "Bisle Ghat Viewpoint", sub: "Stop 2 · 34 km" },
];
