import { create } from 'zustand';
import { MetarData } from '../types';

// Stores last-seen METARs in memory to pre-populate flight forms
interface SessionState {
  lastViewedMetars: Map<string, MetarData>;
  lastMetarSnapshotIds: Map<string, string>;
  setLastMetar: (icao: string, metar: MetarData, snapshotId: string) => void;
  getLastMetar: (icao: string) => MetarData | undefined;
  getLastSnapshotId: (icao: string) => string | undefined;
  pendingExecutionId: string | null;
  setPendingExecutionId: (id: string | null) => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  lastViewedMetars: new Map(),
  lastMetarSnapshotIds: new Map(),
  setLastMetar: (icao, metar, snapshotId) =>
    set((s) => {
      const m = new Map(s.lastViewedMetars);
      const ids = new Map(s.lastMetarSnapshotIds);
      m.set(icao.toUpperCase(), metar);
      ids.set(icao.toUpperCase(), snapshotId);
      return { lastViewedMetars: m, lastMetarSnapshotIds: ids };
    }),
  getLastMetar: (icao) => get().lastViewedMetars.get(icao.toUpperCase()),
  getLastSnapshotId: (icao) => get().lastMetarSnapshotIds.get(icao.toUpperCase()),
  pendingExecutionId: null,
  setPendingExecutionId: (id) => set({ pendingExecutionId: id }),
}));
