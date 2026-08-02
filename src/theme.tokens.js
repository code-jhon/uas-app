// Design tokens that MUST be shared between the RN app (src/theme.ts, consumed
// via Metro/TS) and the Tailwind config (tailwind.config.js, required by Node
// at build time). Because tailwind.config.js is plain CommonJS and cannot load
// TypeScript, this single source of truth is authored as a CommonJS module and
// re-exported (typed) from src/theme.ts. Do not duplicate these literals
// elsewhere — import from '@/theme' in app code, or require this file in the
// Tailwind config. (PAR-18)

/**
 * Flight-category foreground colors (badge text / icon tint).
 * @type {{ VFR: string, MVFR: string, IFR: string, LIFR: string }}
 */
const flightCategoryColors = {
  VFR: '#22c55e',
  MVFR: '#3b82f6',
  IFR: '#ef4444',
  LIFR: '#a855f7',
};

/**
 * Flight-category background colors (badge fill).
 * @type {{ VFR: string, MVFR: string, IFR: string, LIFR: string }}
 */
const flightCategoryBgColors = {
  VFR: '#166534',
  MVFR: '#1e3a8a',
  IFR: '#7f1d1d',
  LIFR: '#581c87',
};

// Canonical dark brand background (Tailwind `sky-950`). Resolves the historical
// #0f172a / #0c1a2e inconsistency in favor of this value (see CLAUDE.md).
const brandDark = '#0c1a2e';

module.exports = {
  flightCategoryColors,
  flightCategoryBgColors,
  brandDark,
};
