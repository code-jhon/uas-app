import { getDatabase } from './database';
import { Flight, FlightRole } from '../types';
import { randomUUID } from '../utils/uuid';

function rowToFlight(row: Record<string, unknown>): Flight {
  return {
    id: row.id as string,
    date: row.date as string,
    flightType: ((row.flight_type as string) ?? 'manned') as Flight['flightType'],
    aircraftId: (row.aircraft_id as string) ?? undefined,
    aircraftRegistration: (row.aircraft_registration as string) ?? undefined,
    originIcao: (row.origin_icao as string) ?? '',
    destinationIcao: (row.destination_icao as string) ?? '',
    blockOut: (row.block_out as string) ?? undefined,
    blockIn: (row.block_in as string) ?? undefined,
    totalTime: (row.total_time as number) ?? undefined,
    nightTime: (row.night_time as number) ?? undefined,
    ifrTime: (row.ifr_time as number) ?? undefined,
    simIfrTime: (row.sim_ifr_time as number) ?? undefined,
    vfrTime: (row.vfr_time as number) ?? undefined,
    picTime: (row.pic_time as number) ?? undefined,
    sicTime: (row.sic_time as number) ?? undefined,
    dualTime: (row.dual_time as number) ?? undefined,
    soloTime: (row.solo_time as number) ?? undefined,
    instructorTime: (row.instructor_time as number) ?? undefined,
    landingsDay: (row.landings_day as number) ?? undefined,
    landingsNight: (row.landings_night as number) ?? undefined,
    approachesCount: (row.approaches_count as number) ?? undefined,
    role: (row.role as FlightRole) ?? 'PIC',
    originMetarId: (row.origin_metar_id as string) ?? undefined,
    destMetarId: (row.dest_metar_id as string) ?? undefined,
    site: (row.site as string) ?? undefined,
    lat: (row.lat as number) ?? undefined,
    lng: (row.lng as number) ?? undefined,
    vlos: row.vlos !== null && row.vlos !== undefined ? (row.vlos as number) === 1 : undefined,
    maxAltitudeFt: (row.max_altitude_ft as number) ?? undefined,
    maxDistanceM: (row.max_distance_m as number) ?? undefined,
    missionType: (row.mission_type as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function getFlights(): Promise<Flight[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM flight ORDER BY date DESC, created_at DESC`
  );
  return rows.map(rowToFlight);
}

export async function getFlightById(id: string): Promise<Flight | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM flight WHERE id = ?`,
    [id]
  );
  return row ? rowToFlight(row) : null;
}

export async function createFlight(data: Omit<Flight, 'id' | 'createdAt'>): Promise<Flight> {
  const db = await getDatabase();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO flight (
      id, date, flight_type,
      aircraft_id, aircraft_registration, origin_icao, destination_icao,
      block_out, block_in, total_time, night_time, ifr_time, sim_ifr_time, vfr_time,
      pic_time, sic_time, dual_time, solo_time, instructor_time,
      landings_day, landings_night, approaches_count, role,
      origin_metar_id, dest_metar_id,
      site, lat, lng, vlos, max_altitude_ft, max_distance_m, mission_type,
      notes, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, data.date, data.flightType ?? 'manned',
      data.aircraftId ?? null, data.aircraftRegistration ?? null,
      data.originIcao, data.destinationIcao,
      data.blockOut ?? null, data.blockIn ?? null,
      data.totalTime ?? null, data.nightTime ?? null, data.ifrTime ?? null,
      data.simIfrTime ?? null, data.vfrTime ?? null,
      data.picTime ?? null, data.sicTime ?? null, data.dualTime ?? null,
      data.soloTime ?? null, data.instructorTime ?? null,
      data.landingsDay ?? null, data.landingsNight ?? null, data.approachesCount ?? null,
      data.role,
      data.originMetarId ?? null, data.destMetarId ?? null,
      data.site ?? null, data.lat ?? null, data.lng ?? null,
      data.vlos !== undefined ? (data.vlos ? 1 : 0) : null,
      data.maxAltitudeFt ?? null, data.maxDistanceM ?? null, data.missionType ?? null,
      data.notes ?? null, createdAt,
    ]
  );
  return { id, createdAt, ...data };
}

export async function updateFlight(id: string, data: Partial<Omit<Flight, 'id' | 'createdAt'>>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  const map: Record<string, string> = {
    date: 'date', flightType: 'flight_type',
    aircraftId: 'aircraft_id', aircraftRegistration: 'aircraft_registration',
    originIcao: 'origin_icao', destinationIcao: 'destination_icao',
    blockOut: 'block_out', blockIn: 'block_in',
    totalTime: 'total_time', nightTime: 'night_time', ifrTime: 'ifr_time',
    simIfrTime: 'sim_ifr_time', vfrTime: 'vfr_time',
    picTime: 'pic_time', sicTime: 'sic_time', dualTime: 'dual_time',
    soloTime: 'solo_time', instructorTime: 'instructor_time',
    landingsDay: 'landings_day', landingsNight: 'landings_night',
    approachesCount: 'approaches_count', role: 'role',
    originMetarId: 'origin_metar_id', destMetarId: 'dest_metar_id',
    site: 'site', lat: 'lat', lng: 'lng',
    maxAltitudeFt: 'max_altitude_ft', maxDistanceM: 'max_distance_m',
    missionType: 'mission_type', notes: 'notes',
  };

  for (const [key, col] of Object.entries(map)) {
    if (key in data) {
      fields.push(`${col} = ?`);
      const v = (data as Record<string, unknown>)[key];
      // Convert boolean vlos to SQLite integer
      values.push(key === 'vlos' && typeof v === 'boolean' ? (v ? 1 : 0) : (v ?? null));
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE flight SET ${fields.join(', ')} WHERE id = ?`, values as import('expo-sqlite').SQLiteBindParams);
}

export async function deleteFlight(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM flight WHERE id = ?`, [id]);
}

/**
 * Inserts a batch of flights preserving their original id and createdAt.
 * Flights whose id already exists are skipped (no overwrite).
 * Returns counts of imported vs skipped records.
 */
export async function importFlights(
  flights: Flight[]
): Promise<{ imported: number; skipped: number }> {
  const db = await getDatabase();
  let imported = 0;
  let skipped = 0;

  for (const f of flights) {
    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM flight WHERE id = ?`,
      [f.id]
    );
    if (existing) { skipped++; continue; }

    await db.runAsync(
      `INSERT INTO flight (
        id, date, flight_type,
        aircraft_id, aircraft_registration, origin_icao, destination_icao,
        block_out, block_in, total_time, night_time, ifr_time, sim_ifr_time, vfr_time,
        pic_time, sic_time, dual_time, solo_time, instructor_time,
        landings_day, landings_night, approaches_count, role,
        origin_metar_id, dest_metar_id,
        site, lat, lng, vlos, max_altitude_ft, max_distance_m, mission_type,
        notes, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        f.id, f.date, f.flightType ?? 'manned',
        f.aircraftId ?? null, f.aircraftRegistration ?? null,
        f.originIcao, f.destinationIcao,
        f.blockOut ?? null, f.blockIn ?? null,
        f.totalTime ?? null, f.nightTime ?? null, f.ifrTime ?? null,
        f.simIfrTime ?? null, f.vfrTime ?? null,
        f.picTime ?? null, f.sicTime ?? null, f.dualTime ?? null,
        f.soloTime ?? null, f.instructorTime ?? null,
        f.landingsDay ?? null, f.landingsNight ?? null, f.approachesCount ?? null,
        f.role ?? 'PIC',
        f.originMetarId ?? null, f.destMetarId ?? null,
        f.site ?? null, f.lat ?? null, f.lng ?? null,
        f.vlos !== undefined ? (f.vlos ? 1 : 0) : null,
        f.maxAltitudeFt ?? null, f.maxDistanceM ?? null, f.missionType ?? null,
        f.notes ?? null, f.createdAt ?? new Date().toISOString(),
      ]
    );
    imported++;
  }

  return { imported, skipped };
}

export interface FlightStats {
  totalHours: number;
  last90Days: number;
  last12Months: number;
  totalLandings: number;
  landingsLast90: number;
}

export async function getFlightStats(): Promise<FlightStats> {
  const db = await getDatabase();
  const now = new Date();
  const d90 = new Date(now); d90.setDate(d90.getDate() - 90);
  const d365 = new Date(now); d365.setFullYear(d365.getFullYear() - 1);

  const all = await db.getFirstAsync<{ h: number; l: number }>(
    `SELECT COALESCE(SUM(total_time),0) as h, COALESCE(SUM(landings_day)+SUM(landings_night),0) as l FROM flight`
  );
  const last90 = await db.getFirstAsync<{ h: number; l: number }>(
    `SELECT COALESCE(SUM(total_time),0) as h, COALESCE(SUM(landings_day)+SUM(landings_night),0) as l FROM flight WHERE date >= ?`,
    [d90.toISOString().slice(0, 10)]
  );
  const last12 = await db.getFirstAsync<{ h: number }>(
    `SELECT COALESCE(SUM(total_time),0) as h FROM flight WHERE date >= ?`,
    [d365.toISOString().slice(0, 10)]
  );

  return {
    totalHours: all?.h ?? 0,
    last90Days: last90?.h ?? 0,
    last12Months: last12?.h ?? 0,
    totalLandings: all?.l ?? 0,
    landingsLast90: last90?.l ?? 0,
  };
}
