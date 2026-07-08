import { create } from 'zustand';
import { FlightRole, FlightType } from '../types';

// In-memory only (no SecureStore) — just needs to survive the round trip
// through the checklist execution screen during flight creation (PAR-9).
export interface FlightDraft {
  flightType: FlightType;
  date: string;
  blockOut: string;
  blockIn: string;
  totalTime: string;
  notes: string;
  // Manned
  origin: string;
  dest: string;
  registration: string;
  aircraftType: string;
  nightTime: string;
  ifrTime: string;
  picTime: string;
  landingsDay: string;
  landingsNight: string;
  approaches: string;
  role: FlightRole;
  // UAS
  site: string;
  droneId: string;
  droneModel: string;
  vlos: boolean;
  maxAlt: string;
  maxDist: string;
  missionType: string;
  uasRole: FlightRole;
  lat: number | null;
  lng: number | null;
  siteFromGps: boolean;
}

interface FlightDraftState {
  draft: FlightDraft | null;
  save: (draft: FlightDraft) => void;
  clear: () => void;
}

export const useFlightDraftStore = create<FlightDraftState>()((set) => ({
  draft: null,
  save: (draft) => set({ draft }),
  clear: () => set({ draft: null }),
}));
