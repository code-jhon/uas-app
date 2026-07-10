import { MetarData } from '../types';
import { parseAwcMetar } from '../utils/metar';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { cacheMetar, getLatestCachedMetar } from '../db/metarCache';

const BASE = 'https://aviationweather.gov/api/data';

export async function fetchMetar(icao: string): Promise<MetarData> {
  const code = icao.toUpperCase();
  let fetchError: Error | null = null;

  try {
    const resp = await fetchWithTimeout(
      `${BASE}/metar?ids=${code}&format=json&taf=false&hours=2`,
      8000
    );
    if (!resp.ok) throw new Error(`Error del servidor: HTTP ${resp.status}`);
    const raw: unknown = await resp.json();
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error(`No hay datos METAR disponibles para ${code}`);
    }
    const parsed = parseAwcMetar(raw[0] as Parameters<typeof parseAwcMetar>[0]);
    await cacheMetar(code, parsed.rawText, parsed);
    return parsed;
  } catch (err) {
    fetchError = err instanceof Error ? err : new Error(String(err));
  }

  // Offline / error fallback: try cache
  const cached = await getLatestCachedMetar(code);
  if (cached) {
    const parsed: MetarData = JSON.parse(cached.parsedJson);
    return { ...parsed, rawText: `[CACHE] ${parsed.rawText}` };
  }

  throw fetchError ?? new Error(`Sin datos para ${code}`);
}

export async function fetchMetarBatch(icaos: string[]): Promise<Map<string, MetarData>> {
  const result = new Map<string, MetarData>();
  await Promise.allSettled(
    icaos.map(async (icao) => {
      try {
        const m = await fetchMetar(icao);
        result.set(icao.toUpperCase(), m);
      } catch {
        // individual failure is ok
      }
    })
  );
  return result;
}
