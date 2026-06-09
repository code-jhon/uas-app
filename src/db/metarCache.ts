import { getDatabase } from './database';
import { MetarData, MetarSnapshot } from '../types';
import { randomUUID } from '../utils/uuid';

export async function cacheMetar(icao: string, raw: string, parsed: MetarData): Promise<string> {
  const db = await getDatabase();
  const id = randomUUID();
  await db.runAsync(
    `INSERT INTO metar_snapshot (id, icao, raw_text, parsed_json, observed_at, fetched_at) VALUES (?,?,?,?,?,?)`,
    [id, icao.toUpperCase(), raw, JSON.stringify(parsed), parsed.observedAt, new Date().toISOString()]
  );
  // Keep only last 10 per airport
  await db.runAsync(
    `DELETE FROM metar_snapshot WHERE icao = ? AND id NOT IN (
      SELECT id FROM metar_snapshot WHERE icao = ? ORDER BY fetched_at DESC LIMIT 10
    )`,
    [icao.toUpperCase(), icao.toUpperCase()]
  );
  return id;
}

export async function getLatestCachedMetar(icao: string): Promise<MetarSnapshot | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM metar_snapshot WHERE icao = ? ORDER BY fetched_at DESC LIMIT 1`,
    [icao.toUpperCase()]
  );
  if (!row) return null;
  return {
    id: row.id as string,
    icao: row.icao as string,
    rawText: row.raw_text as string,
    parsedJson: row.parsed_json as string,
    observedAt: row.observed_at as string,
    fetchedAt: row.fetched_at as string,
  };
}
