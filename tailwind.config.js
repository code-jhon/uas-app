const { flightCategoryColors, brandDark } = require('./src/theme.tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Single source of truth in src/theme.tokens.js (PAR-18)
        sky: {
          950: brandDark,
        },
        vfr: flightCategoryColors.VFR,
        mvfr: flightCategoryColors.MVFR,
        ifr: flightCategoryColors.IFR,
        lifr: flightCategoryColors.LIFR,
      },
      fontFamily: {
        mono: ['SpaceMono', 'monospace'],
      },
    },
  },
  plugins: [],
};
