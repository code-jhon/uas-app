import { MetarData } from '../types';
import i18n from '../i18n';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type FlightConditionLevel = 'good' | 'moderate' | 'bad' | 'unknown';

export interface FlightConditionFactor {
  key: 'wind' | 'visibility' | 'ceiling' | 'kp' | 'phenomena';
  level: FlightConditionLevel;
  /** Localized display value for the metric (e.g. "12 kt", "8 km"). */
  value: string;
  /** Localized label for the metric. */
  label: string;
}

export interface FlightConditionResult {
  level: FlightConditionLevel;
  factors: FlightConditionFactor[];
  /** True when there was no METAR data to evaluate. */
  hasData: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MILES_TO_KM = 1.609344;

/** Returns the worst (most restrictive) level among the inputs. */
function worstLevel(levels: FlightConditionLevel[]): FlightConditionLevel {
  const rank: Record<FlightConditionLevel, number> = {
    unknown: -1,
    good: 0,
    moderate: 1,
    bad: 2,
  };
  return levels.reduce<FlightConditionLevel>((worst, l) => {
    if (l === 'unknown') return worst;
    return rank[l] > rank[worst] ? l : worst;
  }, 'good');
}

/** Lowest BKN/OVC cloud layer in feet (the operational ceiling). */
export function ceilingFt(metar: MetarData): number | undefined {
  const layers = metar.clouds.filter((c) => c.coverage === 'BKN' || c.coverage === 'OVC');
  if (!layers.length) return undefined;
  return Math.min(...layers.map((c) => c.baseHundredFt * 100));
}

/** Severe weather tokens that force a "bad" rating. */
const SEVERE_WX = ['TS', 'FG', 'SN', 'GR', 'FC', '+RA', '+SN', 'SQ', 'SS', 'DS'];
/** Moderate weather tokens. */
const MODERATE_WX = ['BR', 'HZ', 'RA', 'DZ', 'FU', 'VA'];

function evaluatePhenomena(weather: string[] | undefined): FlightConditionLevel {
  if (!weather || weather.length === 0) return 'good';
  const joined = weather.join(' ').toUpperCase();
  if (SEVERE_WX.some((w) => joined.includes(w))) return 'bad';
  if (MODERATE_WX.some((w) => joined.includes(w))) return 'moderate';
  return 'good';
}

// ─── Main evaluation ───────────────────────────────────────────────────────────

/**
 * Evaluates overall UAS flight conditions from METAR + the current Kp index.
 * The overall level is the WORST of all individual factors.
 */
export function evaluateFlightConditions(
  metar: MetarData | undefined,
  kp: number | null | undefined
): FlightConditionResult {
  const t = i18n.t.bind(i18n);
  const factors: FlightConditionFactor[] = [];

  if (!metar) {
    return { level: 'unknown', factors: [], hasData: false };
  }

  // Wind — speed in knots (gusts considered if present)
  if (metar.wind) {
    const speed = Math.max(metar.wind.speedKt, metar.wind.gustKt ?? 0);
    const level: FlightConditionLevel = speed < 15 ? 'good' : speed <= 25 ? 'moderate' : 'bad';
    factors.push({
      key: 'wind',
      level,
      value: `${Math.round(speed)} kt`,
      label: t('flightConditions.wind'),
    });
  }

  // Visibility — METAR is in statute miles; criteria are in km
  if (metar.visibilityMiles !== undefined) {
    const km = metar.visibilityMiles * MILES_TO_KM;
    const level: FlightConditionLevel = km > 5 ? 'good' : km >= 3 ? 'moderate' : 'bad';
    factors.push({
      key: 'visibility',
      level,
      value: `${km.toFixed(km >= 10 ? 0 : 1)} km`,
      label: t('flightConditions.visibility'),
    });
  }

  // Ceiling — lowest broken/overcast layer in feet
  const ceiling = ceilingFt(metar);
  if (ceiling !== undefined) {
    const level: FlightConditionLevel = ceiling > 3000 ? 'good' : ceiling >= 1000 ? 'moderate' : 'bad';
    factors.push({
      key: 'ceiling',
      level,
      value: `${ceiling.toLocaleString()} ft`,
      label: t('flightConditions.ceiling'),
    });
  }

  // Kp index
  if (kp !== null && kp !== undefined) {
    const level: FlightConditionLevel = kp <= 3 ? 'good' : kp <= 5 ? 'moderate' : 'bad';
    factors.push({
      key: 'kp',
      level,
      value: `Kp ${kp.toFixed(0)}`,
      label: t('flightConditions.kpIndex'),
    });
  }

  // Weather phenomena
  const phenomenaLevel = evaluatePhenomena(metar.weather);
  factors.push({
    key: 'phenomena',
    level: phenomenaLevel,
    value: metar.weather?.length ? metar.weather.join(' ') : t('flightConditions.precipNone'),
    label: t('flightConditions.phenomena'),
  });

  const level = worstLevel(factors.map((f) => f.level));
  return { level, factors, hasData: true };
}

// ─── Presentation helpers ──────────────────────────────────────────────────────

export const LEVEL_COLORS: Record<Exclude<FlightConditionLevel, 'unknown'>, string> = {
  good: '#16A34A',
  moderate: '#F59E0B',
  bad: '#DC2626',
};

export function levelColor(level: FlightConditionLevel): string {
  if (level === 'unknown') return '#64748B';
  return LEVEL_COLORS[level];
}

/** Soft background tint for status cards. */
export function levelTint(level: FlightConditionLevel, isDark: boolean): string {
  switch (level) {
    case 'good':
      return isDark ? '#0c2a1a' : '#dcfce7';
    case 'moderate':
      return isDark ? '#2e2410' : '#fef3c7';
    case 'bad':
      return isDark ? '#2e1414' : '#fee2e2';
    default:
      return isDark ? '#1e293b' : '#f1f5f9';
  }
}

/** Short status string shown in the Home banner. */
export function statusText(level: FlightConditionLevel): string {
  const t = i18n.t.bind(i18n);
  switch (level) {
    case 'good':
      return t('flightConditions.statusGood');
    case 'moderate':
      return t('flightConditions.statusModerate');
    case 'bad':
      return t('flightConditions.statusBad');
    default:
      return t('flightConditions.statusUnknown');
  }
}

/**
 * Builds a human-readable viability paragraph based on which factors are
 * degraded. Falls back to a generic message per level.
 */
export function viabilityText(result: FlightConditionResult): string {
  const t = i18n.t.bind(i18n);
  if (!result.hasData) return t('flightConditions.noData');

  const bad = result.factors.filter((f) => f.level === 'bad').map((f) => f.label.toLowerCase());
  const moderate = result.factors.filter((f) => f.level === 'moderate').map((f) => f.label.toLowerCase());

  if (result.level === 'good') return t('flightConditions.viabilityGood');

  const concerns = [...bad, ...moderate];
  const list = concerns.join(', ');

  if (result.level === 'bad') {
    return t('flightConditions.viabilityBad', { factors: list });
  }
  return t('flightConditions.viabilityModerate', { factors: list });
}
