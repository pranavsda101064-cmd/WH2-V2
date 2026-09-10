// Design tokens — Where2 Emerald Green visual palette
export const colors = {
  bg: "#F5F5F5",
  surface: "#FFFFFF",
  surfaceAlt: "#F8F9FA",
  surfaceTint: "#E0F2F1", // Light green tint for chips/badges
  border: "#E0E0E0",
  borderStrong: "#BDBDBD",
  text: "#1A1A1A",
  textMuted: "#757575",
  textDim: "#9E9E9E",
  accent: "#00897B", // Main Emerald Green
  accentDim: "#00695C",
  accentGlow: "rgba(0,137,123,0.35)",
  danger: "#E4483C",
  success: "#22C55E",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const font = {
  h1: 32,
  h2: 24,
  h3: 20,
  title: 22,
  body: 15,
  label: 14,
  caption: 12,
  small: 13,
  micro: 11,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 } as const,
  }),
};
