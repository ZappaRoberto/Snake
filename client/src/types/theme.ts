/**
 * Theme tokens for the Snake Game UI.
 * Centralized color palette, gradients, shadows, and spacing design tokens.
 */

// Color Palette - Dark Theme with Modern Touches
export const COLORS = {
  // Backgrounds
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  surface: '#334155',

  // Snake Colors (Difficulty-based)
  snakeEasyHead: '#4ade80',    // Bright green
  snakeEasyBody: '#86efac',    // Light green
  snakeMediumHead: '#22c55e',  // Standard green
  snakeMediumBody: '#4ade80',
  snakeHardHead: '#f87171',    // Reddish
  snakeHardBody: '#fb923c',

  // Food Colors
  foodApple: '#ef4444',        // Red apple
  foodHighlight: '#ffffff',

  // UI Colors
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  accent: '#38bdf8',           // Sky blue
  success: '#22c55e',
  warning: '#fbbf24',
  danger: '#ef4444',

  // Gradients
  primaryGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
  secondaryGradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
  darkGradient: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',

  // Shadows
  shadowSoft: '0 2px 15px rgba(0, 0, 0, 0.3)',
  shadowMedium: '0 4px 25px rgba(0, 0, 0, 0.4)',
  shadowHard: '0 8px 40px rgba(0, 0, 0, 0.5)',
} as const;

// Typography
export const TYPOGRAPHY = {
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    bold: '700',
    extrabold: '800',
  },
} as const;

// Spacing
export const SPACING = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

// Border Radius
export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

// Animation
export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  ease: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Bloom Effect Settings for Three.js
export const BLOOM_SETTINGS = {
  intensity: 1.5,
  radius: 0.5,
  threshold: 0.1,
} as const;

// Difficulty Color Map
export type DifficultyColor = {
  head: string;
  body: string;
};

export const DIFFICULTY_COLORS: Record<'easy' | 'medium' | 'hard', DifficultyColor> = {
  easy: { head: COLORS.snakeEasyHead, body: COLORS.snakeEasyBody },
  medium: { head: COLORS.snakeMediumHead, body: COLORS.snakeMediumBody },
  hard: { head: COLORS.snakeHardHead, body: COLORS.snakeHardBody },
};

// Theme interface for TypeScript
export interface Theme {
  colors: typeof COLORS;
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  animation: typeof ANIMATION;
}

export const theme: Theme = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  radius: RADIUS,
  animation: ANIMATION,
};
