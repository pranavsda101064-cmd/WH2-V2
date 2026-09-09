// Design tokens — Uber-style dark palette
export const colors = {
  bg: "#000000",
  surface: "#111214",
  surfaceAlt: "#1A1B1E",
  border: "#26282C",
  borderStrong: "#3A3D42",
  text: "#FFFFFF",
  textMuted: "#9AA0A6",
  textDim: "#6B7075",
  accent: "#1E6BFF", // electric blue
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
  xl: 24,
  pill: 999,
};

export const font = {
  h1: 32,
  h2: 24,
  h3: 20,
  title: 22,
  subtitle: 16,
  body: 15,
  label: 14,
  caption: 12,
  small: 13,
  micro: 11,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 } as const,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 } as const,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 } as const,
  },
  accent: {
    shadowColor: "#1E6BFF",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 } as const,
  },
};
