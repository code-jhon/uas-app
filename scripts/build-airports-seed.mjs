// Builds the bundled airport seed (assets/airports.dat) from the OurAirports
// CSV (assets/airports.csv). Run once at build/dev time — never on device.
//
//   node scripts/build-airports-seed.mjs
//
// Source: https://ourairports.com/data/ (public domain, CC0). To refresh the
// dataset, re-download airports.csv into assets/ and re-run this script, then
// bump SEED_VERSION in src/db/database.ts so the app reseeds on next launch.
//
// Output is a compact JSON array-of-arrays (no repeated keys) to keep the
// bundled asset small. Row shape must match seedAirports() in database.ts:
//   [id, icao, iata, name, type, iso_country, municipality, lat, lng]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CSV = path.join(ROOT, 'assets', 'airports.csv');
const OUT = path.join(ROOT, 'assets', 'airports.dat');

// Keep everything except closed aerodromes and balloonports (per PAR-37).
const KEEP_TYPES = new Set([
  'large_airport',
  'medium_airport',
  'small_airport',
  'heliport',
  'seaplane_base',
]);

/** Parse one CSV line, honoring quoted fields and escaped quotes. */
function parseLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else quoted = false;
      } else cur += c;
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      out.push(cur); cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const raw = fs.readFileSync(CSV, 'utf8');
const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
const header = parseLine(lines[0]);
const col = Object.fromEntries(header.map((h, i) => [h, i]));

const rows = [];
const seen = new Set();
for (let i = 1; i < lines.length; i++) {
  const f = parseLine(lines[i]);
  const type = f[col.type];
  if (!KEEP_TYPES.has(type)) continue;

  const ident = f[col.ident];
  if (!ident || seen.has(ident)) continue; // ident is the unique PK
  seen.add(ident);

  const lat = parseFloat(f[col.latitude_deg]);
  const lng = parseFloat(f[col.longitude_deg]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

  rows.push([
    ident,                                   // id (OurAirports ident, unique PK)
    f[col.icao_code] || '',                  // icao (4-letter, for METAR lookups)
    f[col.iata_code] || '',                  // iata
    f[col.name] || ident,                    // name
    type,                                    // type
    f[col.iso_country] || '',                // iso_country
    f[col.municipality] || '',               // municipality
    +lat.toFixed(4),
    +lng.toFixed(4),
  ]);
}

fs.writeFileSync(OUT, JSON.stringify(rows));

const bytes = fs.statSync(OUT).size;
const withIcao = rows.filter((r) => /^[A-Z0-9]{4}$/.test(r[1])).length;
console.log(`airports: ${rows.length} rows -> ${OUT}`);
console.log(`  with ICAO code: ${withIcao}`);
console.log(`  size: ${(bytes / 1048576).toFixed(2)} MB`);
