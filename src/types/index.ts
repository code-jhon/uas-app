// ─── Domain models ───────────────────────────────────────────────────────────

export interface Aircraft {
  id: string;
  registration: string;
  type: string;
  engineType: 'piston' | 'turboprop' | 'jet' | 'electric';
  multiEngine: boolean;
}

export interface Airport {
  icao: string;
  iata?: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  elevationFt?: number;
}

// ─── METAR ───────────────────────────────────────────────────────────────────

export type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR';

export interface MetarData {
  icao: string;
  rawText: string;
  observedAt: string; // ISO
  wind?: { direction: number | 'VRB'; speedKt: number; gustKt?: number };
  visibilityMiles?: number;
  clouds: { coverage: 'FEW' | 'SCT' | 'BKN' | 'OVC' | 'CLR'; baseHundredFt: number }[];
  tempC?: number;
  dewpointC?: number;
  altimeterHpa?: number;
  elevationFt?: number;
  weather?: string[];
  flightCategory: FlightCategory;
  nosig?: boolean;
}

export interface MetarSnapshot {
  id: string;
  icao: string;
  rawText: string;
  parsedJson: string;
  observedAt: string;
  fetchedAt: string;
}

// ─── Kp ──────────────────────────────────────────────────────────────────────

export interface KpReading {
  time: string;
  kp: number;
}

export interface KpForecast {
  time: string;
  kp: number;
  observed: boolean;
}

// ─── Checklists ──────────────────────────────────────────────────────────────

export type ItemType = 'check' | 'input' | 'number';
export type ItemStatus = 'pending' | 'ok' | 'na' | 'skipped';

export interface ChecklistItem {
  id: string;
  sectionId: string;
  order: number;
  title: string;
  description?: string;
  required: boolean;
  itemType: ItemType;
}

export interface ChecklistSection {
  id: string;
  checklistId: string;
  order: number;
  title: string;
  items: ChecklistItem[];
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  isTemplate: boolean;
  parentTemplateId?: string;
  sections: ChecklistSection[];
  createdAt: string;
}

export interface ChecklistItemResult {
  id: string;
  executionId: string;
  itemId: string;
  status: ItemStatus;
  note?: string;
  value?: string;
  timestamp: string;
}

export interface ChecklistExecution {
  id: string;
  checklistId: string;
  checklistName: string;
  startedAt: string;
  completedAt?: string;
  linkedFlightId?: string;
  results: ChecklistItemResult[];
}

// ─── Flight ──────────────────────────────────────────────────────────────────

export type FlightType = 'manned' | 'uas';
export type FlightRole = 'PIC' | 'SIC' | 'dual' | 'solo' | 'instructor' | 'operador' | 'observador';

export interface Flight {
  id: string;
  date: string;
  flightType: FlightType;
  // Manned fields
  aircraftId?: string;
  aircraftRegistration?: string;
  originIcao: string;
  destinationIcao: string;
  blockOut?: string;
  blockIn?: string;
  totalTime?: number; // decimal hours
  nightTime?: number;
  ifrTime?: number;
  simIfrTime?: number;
  vfrTime?: number;
  picTime?: number;
  sicTime?: number;
  dualTime?: number;
  soloTime?: number;
  instructorTime?: number;
  landingsDay?: number;
  landingsNight?: number;
  approachesCount?: number;
  role: FlightRole;
  originMetarId?: string;
  destMetarId?: string;
  // UAS-specific fields
  site?: string;
  lat?: number;
  lng?: number;
  vlos?: boolean;
  maxAltitudeFt?: number;
  maxDistanceM?: number;
  missionType?: string;
  notes?: string;
  createdAt: string;
}

// ─── App state ───────────────────────────────────────────────────────────────

export interface FavoriteAirport {
  icao: string;
  name: string;
  country: string;
  cachedMetar?: MetarData;
  cacheAge?: string;
}
