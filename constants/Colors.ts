export const Colors = {
  // Brand Primary
  burgundy: "#7B1D3F",
  burgundyDark: "#5C1530",
  burgundyLight: "#9B2C52",
  burgundySubtle: "#FDF2F4",

  // Accent & Highlights
  gold: "#C9A035",
  goldDark: "#9A7820",
  goldLight: "#F5E9C9",
  goldSubtle: "#FDFBF4",

  // Surfaces & Neutrals
  ivory: "#F7F3EC",
  ivoryDark: "#EFE8DC",
  white: "#FFFFFF",
  surfaceCard: "#FFFFFF",
  surfaceMuted: "#F4EFE6",

  // Typography & Dark
  navy: "#1C2B4A",
  navyLight: "#2D3E64",
  textPrimary: "#1C2B4A",
  textSecondary: "#4B5563",
  muted: "#6B7280",
  mutedLight: "#9CA3AF",

  // Borders & Dividers
  border: "#E2DACD",
  borderLight: "#EDE7DC",
  borderDark: "#C7BCAB",

  // Status Colors
  success: "#10B981",
  successSubtle: "#ECFDF5",
  successBorder: "#A7F3D0",
  warning: "#F59E0B",
  warningSubtle: "#FFFBEB",
  info: "#3B82F6",
  infoSubtle: "#EFF6FF",
  error: "#EF4444",
  errorSubtle: "#FEF2F2",

  // HK Special Theme
  hkRed: "#C8102E",
  verifiedBadge: "#059669",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    black: "800" as const,
  },
};

export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultra: 1440,
};

export default Colors;