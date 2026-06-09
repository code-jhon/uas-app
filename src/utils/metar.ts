import { FlightCategory, MetarData } from '../types';
import i18n from '../i18n';

// ─── Parsing ──────────────────────────────────────────────────────────────────

interface AwcMetarResponse {
  metar_id?: number;
  icaoId?: string;
  receiptTime?: string;
  obsTime?: number;
  reportTime?: string;
  temp?: number;
  dewp?: number;
  wdir?: number | string;
  wspd?: number;
  wgst?: number;
  visib?: string | number;
  altim?: number;
  slp?: number;
  qcField?: number;
  wxString?: string;
  skyCondition?: Array<{ skyCover: string; cloudBase?: number }>;
  fltcat?: string;
  clouds?: string;
  rawOb?: string;
  mostRecent?: number;
  lat?: number;
  lon?: number;
  elev?: number;
  prior?: number;
  name?: string;
  cloud_base_ft_agl?: number;
}

function parseVisibility(raw: string | number | undefined | null): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  if (s === '10+' || s === 'P6SM') return 10;
  // Mixed number: "1 1/2", "2 3/4"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  // Fraction: "1/2", "3/4"
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const v = parseFloat(s);
  return isNaN(v) ? undefined : v;
}

export function parseAwcMetar(data: AwcMetarResponse): MetarData {
  const raw = data.rawOb ?? '';
  const icao = data.icaoId ?? raw.split(' ')[0] ?? '';

  // Wind
  let wind: MetarData['wind'];
  if (data.wspd !== undefined) {
    wind = {
      direction: data.wdir === 'VRB' ? 'VRB' : Number(data.wdir ?? 0),
      speedKt: data.wspd,
      gustKt: data.wgst ?? undefined,
    };
  }

  // Visibility
  const visibilityMiles = parseVisibility(data.visib);

  // Clouds
  const clouds: MetarData['clouds'] = [];
  if (data.skyCondition?.length) {
    for (const sky of data.skyCondition) {
      const cov = sky.skyCover as MetarData['clouds'][number]['coverage'];
      if (['FEW', 'SCT', 'BKN', 'OVC', 'CLR'].includes(cov)) {
        clouds.push({ coverage: cov, baseHundredFt: sky.cloudBase ?? 0 });
      }
    }
  }

  // Flight category
  const catMap: Record<string, FlightCategory> = {
    VFR: 'VFR', MVFR: 'MVFR', IFR: 'IFR', LIFR: 'LIFR',
  };
  const flightCategory: FlightCategory = catMap[data.fltcat?.toUpperCase() ?? ''] ?? deriveCategory(visibilityMiles, clouds);

  // Weather phenomena
  const weather = data.wxString ? [data.wxString] : undefined;

  // Observed time
  const observedAt = data.reportTime
    ? new Date(data.reportTime).toISOString()
    : new Date(Number(data.obsTime ?? 0) * 1000).toISOString();

  return {
    icao: icao.toUpperCase(),
    rawText: raw,
    observedAt,
    wind,
    visibilityMiles,
    clouds,
    tempC: data.temp ?? undefined,
    dewpointC: data.dewp ?? undefined,
    altimeterHpa: data.altim !== undefined ? Math.round(data.altim) : undefined,
    elevationFt: data.elev !== undefined ? Math.round(data.elev * 3.28084) : undefined,
    weather,
    flightCategory,
    nosig: raw.includes('NOSIG'),
  };
}

function deriveCategory(
  vis: number | undefined,
  clouds: MetarData['clouds']
): FlightCategory {
  const ceilingLayers = clouds.filter((c) => c.coverage === 'BKN' || c.coverage === 'OVC');
  const ceiling = ceilingLayers.length ? Math.min(...ceilingLayers.map((c) => c.baseHundredFt)) : 999;
  const visibility = vis ?? 999;

  if (visibility < 1 || ceiling < 5) return 'LIFR';
  if (visibility < 3 || ceiling < 10) return 'IFR';
  if (visibility <= 5 || ceiling <= 30) return 'MVFR';
  return 'VFR';
}

// ─── Human-readable decoding ──────────────────────────────────────────────────

export function decodeMetar(metar: MetarData): Array<{ label: string; value: string }> {
  const t = i18n.t.bind(i18n);
  const lines: Array<{ label: string; value: string }> = [];

  if (metar.wind) {
    const dir = metar.wind.direction === 'VRB' ? t('metar.decode.variable') : `${metar.wind.direction}°`;
    const gust = metar.wind.gustKt ? t('metar.decode.gusts', { kt: metar.wind.gustKt }) : '';
    lines.push({
      label: t('metar.decode.wind'),
      value: t('metar.decode.windValue', { dir, speed: metar.wind.speedKt, gust }),
    });
  }

  if (metar.visibilityMiles !== undefined) {
    const vis = metar.visibilityMiles >= 10
      ? t('metar.decode.vis10')
      : t('metar.decode.visMiles', { miles: metar.visibilityMiles });
    lines.push({ label: t('metar.decode.visibility'), value: vis });
  }

  if (metar.clouds.length) {
    const cloudStr = metar.clouds
      .map((c) => `${t(`metar.decode.coverage.${c.coverage}`, { defaultValue: c.coverage })} ${c.baseHundredFt * 100} ft`)
      .join(', ');
    lines.push({ label: t('metar.decode.clouds'), value: cloudStr });
  } else {
    lines.push({ label: t('metar.decode.clouds'), value: t('metar.decode.clear') });
  }

  if (metar.tempC !== undefined && metar.dewpointC !== undefined) {
    lines.push({ label: t('metar.decode.tempDew'), value: `${metar.tempC}°C / ${metar.dewpointC}°C` });
  }

  if (metar.altimeterHpa !== undefined) {
    lines.push({ label: t('metar.decode.qnh'), value: `${metar.altimeterHpa} hPa` });
  }

  if (metar.weather?.length) {
    lines.push({ label: t('metar.decode.phenomena'), value: decodeWeather(metar.weather.join(' ')) });
  }

  if (metar.nosig) {
    lines.push({ label: t('metar.decode.trend'), value: t('metar.decode.nosigValue') });
  }

  return lines;
}

function decodeWeather(wx: string): string {
  const t = i18n.t.bind(i18n);
  return wx
    .replace(/TS/g, t('metar.decode.wx.TS'))
    .replace(/RA/g, t('metar.decode.wx.RA'))
    .replace(/SN/g, t('metar.decode.wx.SN'))
    .replace(/FG/g, t('metar.decode.wx.FG'))
    .replace(/BR/g, t('metar.decode.wx.BR'))
    .replace(/HZ/g, t('metar.decode.wx.HZ'))
    .replace(/-/g, t('metar.decode.wx.light'))
    .replace(/\+/g, t('metar.decode.wx.heavy'));
}

// ─── Category color ───────────────────────────────────────────────────────────

export function categoryColor(cat: FlightCategory): string {
  const map: Record<FlightCategory, string> = {
    VFR: '#22c55e',
    MVFR: '#3b82f6',
    IFR: '#ef4444',
    LIFR: '#a855f7',
  };
  return map[cat];
}

export function categoryBg(cat: FlightCategory): string {
  const map: Record<FlightCategory, string> = {
    VFR: '#166534',
    MVFR: '#1e3a8a',
    IFR: '#7f1d1d',
    LIFR: '#581c87',
  };
  return map[cat];
}

// ─── Derived calculations ─────────────────────────────────────────────────────

export function calcRelativeHumidity(tempC: number, dewpointC: number): number {
  // Magnus formula
  const rh =
    100 *
    Math.exp((17.625 * dewpointC) / (243.04 + dewpointC)) /
    Math.exp((17.625 * tempC) / (243.04 + tempC));
  return Math.min(100, Math.max(0, Math.round(rh)));
}

export function calcDensityAltitude(tempC: number, qnhHpa: number, elevationFt: number): number {
  const pressureAlt = elevationFt + (1013.25 - qnhHpa) * 30;
  const isaTempC = 15 - 0.001981 * pressureAlt;
  return pressureAlt + 120 * (tempC - isaTempC);
}

// ─── Age formatting ───────────────────────────────────────────────────────────

export function formatAge(isoDate: string): string {
  const t = i18n.t.bind(i18n);
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('metar.age.justNow');
  if (diffMin < 60) return t('metar.age.minutes', { min: diffMin });
  const h = Math.floor(diffMin / 60);
  return t('metar.age.hours', { h, min: diffMin % 60 });
}
