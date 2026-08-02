// Centralized design system — single source of truth for colors (PAR-18).
//
// - Flight-category colors and the dark brand background come from the shared
//   CommonJS module `theme.tokens.js`, which is ALSO consumed by
//   `tailwind.config.js` (Node can't import TS, hence the split).
// - `brand` is the fixed dark onboarding/auth palette (previously duplicated as
//   `const C` across auth screens and inlined in the entry loader).
// - `palette` + `getColors(scheme)` expose the light/dark slate palette that
//   the main app screens use, so screens migrate incrementally to a single
//   source and PAR-7's effective-scheme hook can drive theming.

import { FlightCategory } from './types';
import * as tokens from './theme.tokens';

// ─── Flight-category colors (shared with tailwind.config.js) ──────────────────

export const flightCategoryColors: Record<FlightCategory, string> = tokens.flightCategoryColors;
export const flightCategoryBgColors: Record<FlightCategory, string> = tokens.flightCategoryBgColors;

// ─── Brand / onboarding palette (fixed dark) ──────────────────────────────────

export interface BrandColors {
  /** Outermost brand background (sky-950). */
  bg: string;
  /** Slightly lighter surface used for insets/callouts over `bg`. */
  surface: string;
  card: string;
  border: string;
  accent: string;
  accentLight: string;
  text: string;
  sub: string;
  muted: string;
  error: string;
  success: string;
}

export const brand: BrandColors = {
  bg: tokens.brandDark, // #0c1a2e — unified brand background
  surface: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  accent: '#0284c7',
  accentLight: '#38bdf8',
  text: '#f1f5f9',
  sub: '#94a3b8',
  muted: '#475569',
  error: '#ef4444',
  success: '#22c55e',
};

// ─── Light/dark app palette (slate family) ────────────────────────────────────

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  sub: string;
  border: string;
  accent: string;
  accentLight: string;
}

export const palette: Record<'light' | 'dark', ThemeColors> = {
  light: {
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    sub: '#64748b',
    border: '#e2e8f0',
    accent: '#0284c7',
    accentLight: '#38bdf8',
  },
  dark: {
    bg: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    sub: '#94a3b8',
    border: '#334155',
    accent: '#0284c7',
    accentLight: '#38bdf8',
  },
};

/** Resolve the slate palette for the given effective color scheme. */
export function getColors(scheme: 'light' | 'dark'): ThemeColors {
  return palette[scheme];
}
