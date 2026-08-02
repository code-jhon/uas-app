// Ambient type for the bundled airport seed asset (assets/airports.dat),
// registered as a Metro asset extension in metro.config.js (PAR-37).
declare module '*.dat' {
  const asset: number;
  export default asset;
}
