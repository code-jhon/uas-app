import { KpForecast, KpReading } from '../types';

const BASE = 'https://services.swpc.noaa.gov';

function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function fetchKpCurrent(): Promise<KpReading[]> {
  const resp = await fetchWithTimeout(`${BASE}/json/planetary_k_index_1m.json`, 8000);

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  type CurrentRow = {
    estimated_kp: number;
    kp: string;
    kp_index: number;
    time_tag: string;
  };

  const data: CurrentRow[] = await resp.json();

  // Data is: { estimated_kp, kp, kp_index, time_tag } — take last 24h
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  const filtered = (data: CurrentRow[]): CurrentRow[] => {
    const result: CurrentRow[] = [];
    data.forEach((row) => {
      const rowTime = new Date(row.time_tag).getTime();
      if (rowTime > cutoff) {
        result.push(row);
      }
    });
    return result;
  };

  return filtered(data).map((row) => ({ time: row.time_tag, kp: Number(row.kp_index) }));
}

export async function fetchKpForecast(): Promise<KpForecast[]> {
  const resp = await fetchWithTimeout(
    `${BASE}/products/noaa-planetary-k-index-forecast.json`,
    8000
  );
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  type ForecastRow = { time_tag: string; kp: number; observed: boolean; noaa_scale: string };
  const data: ForecastRow[] = await resp.json();

  // API returns array; sometimes it's wrapped in an object
  const rows = Array.isArray(data) ? data : (data as unknown as { forecast: ForecastRow[] }).forecast ?? [];

  return rows.slice(0, 72).map((r) => ({
    time: r.time_tag,
    kp: Number(r.kp),
    observed: Boolean(r.observed),
  }));
}

export function kpLabel(kp: number): string {
  if (kp <= 3) return 'Calma — sin impacto operativo';
  if (kp === 4) return 'Activo — posible impacto leve en HF';
  if (kp === 5) return 'Tormenta G1 — degradación HF/GPS posible';
  if (kp === 6) return 'Tormenta G2 — degradación HF/GPS moderada';
  if (kp === 7) return 'Tormenta G3 — GPS no confiable en altas latitudes';
  if (kp === 8) return 'Tormenta G4 — GPS y HF gravemente afectados';
  return 'Tormenta G5 — Evento geomagnético extremo';
}

export function kpColor(kp: number): string {
  if (kp <= 3) return '#16A34A'; // $kp-calm
  if (kp <= 4) return '#F59E0B'; // $kp-active
  return '#DC2626';              // $kp-storm
}
