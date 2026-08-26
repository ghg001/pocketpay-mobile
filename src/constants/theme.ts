export const DARK_COLORS = {
  // Premium Dark Mode Palette
  background: '#0B0D17', // Deep Navy
  surface: '#15192B', // Slightly lighter navy for cards
  surfaceLight: '#1E243D',

  // Accents
  primary: '#00E5FF', // Electric Teal / Cyan
  primaryDark: '#00B8CC',
  secondary: '#7B61FF', // Vibrant Purple

  // Status
  success: '#00E676',
  error: '#FF3D00',
  warning: '#FFC400',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AABF',
  textMuted: '#637087',
  // Borders
  border: '#2A314A',
};

export const LIGHT_COLORS = {
  // Premium Light Mode Palette — same accent language as dark, inverted surfaces
  background: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceLight: '#EDF0F7',

  // Accents
  primary: '#0092A6', // Darker teal for AA contrast on light surfaces
  primaryDark: '#00707F',
  secondary: '#5B3FE0',

  // Status
  success: '#0C9950',
  error: '#D6320F',
  warning: '#A66A00',

  // Text
  textPrimary: '#111524',
  textSecondary: '#4A5268',
  textMuted: '#7C879C',

  // Borders
  border: '#DDE2ED',
};

export const COLORS = {
  ...DARK_COLORS,
};

export type ThemeColors = typeof DARK_COLORS;

export function getColors(isDark: boolean): ThemeColors {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const FONTS = {
  regular: 'System', // Will use system font (San Francisco on iOS, Roboto on Android) which looks clean
  medium: 'System',
  bold: 'System',
};
