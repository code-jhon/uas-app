import { getDatabase } from './database';

/**
 * A row from the `airport` table, sourced from the OurAirports dataset
 * (see scripts/build-airports-seed.mjs). Replaces the former hardcoded
 * `COLOMBIA_AIRPORTS` array (PAR-37).
 */
export interface Airport {
  /** OurAirports `ident` — unique code, ICAO for most airports (e.g. SKBO). */
  id: string;
  /** 4-letter ICAO where assigned (used for METAR lookups); null otherwise. */
  icao: string | null;
  iata: string | null;
  name: string;
  /** large_airport | medium_airport | small_airport | heliport | seaplane_base */
  type: string;
  isoCountry: string;
  municipality: string | null;
  lat: number;
  lng: number;
}

type AirportRow = {
  id: string;
  icao: string | null;
  iata_code: string | null;
  name: string;
  type: string;
  iso_country: string;
  municipality: string | null;
  lat: number;
  lng: number;
};

function mapRow(r: AirportRow): Airport {
  return {
    id: r.id,
    icao: r.icao || null,
    iata: r.iata_code || null,
    name: r.name,
    type: r.type,
    isoCountry: r.iso_country,
    municipality: r.municipality || null,
    lat: r.lat,
    lng: r.lng,
  };
}

const SELECT = `SELECT id, icao, iata_code, name, type, iso_country, municipality, lat, lng FROM airport`;

/**
 * Resolve a single airport by its code (ICAO ident, or IATA as a fallback).
 * Case-insensitive. Returns null when unknown.
 */
export async function getAirportByCode(code: string): Promise<Airport | null> {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const db = await getDatabase();
  const row = await db.getFirstAsync<AirportRow>(
    `${SELECT} WHERE icao = ? OR id = ? OR iata_code = ? LIMIT 1`,
    [c, c, c]
  );
  return row ? mapRow(row) : null;
}

/**
 * Autocomplete search by code prefix or name substring. Larger airports are
 * ranked first, then alphabetically by name. Mirrors the old in-memory filter.
 */
export async function searchAirports(query: string, limit = 8): Promise<Airport[]> {
  const raw = query.trim();
  if (raw.length < 2) return [];
  const upper = raw.toUpperCase();
  const db = await getDatabase();
  const rows = await db.getAllAsync<AirportRow>(
    `${SELECT}
       WHERE id LIKE ? OR icao LIKE ? OR iata_code = ? OR name LIKE ?
       ORDER BY
         CASE type
           WHEN 'large_airport' THEN 0
           WHEN 'medium_airport' THEN 1
           WHEN 'small_airport' THEN 2
           WHEN 'seaplane_base' THEN 3
           WHEN 'heliport' THEN 4
           ELSE 5
         END,
         name COLLATE NOCASE
       LIMIT ?`,
    [`${upper}%`, `${upper}%`, upper, `%${raw}%`, limit]
  );
  return rows.map(mapRow);
}

/** All airports for a given ISO country code (e.g. 'CO'), ordered by size then name. */
export async function getAirportsByCountry(iso: string): Promise<Airport[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AirportRow>(
    `${SELECT} WHERE iso_country = ? ORDER BY name COLLATE NOCASE`,
    [iso.trim().toUpperCase()]
  );
  return rows.map(mapRow);
}
