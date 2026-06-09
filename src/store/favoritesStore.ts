import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store adapter for Zustand persist (works in Expo Go)
const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // SecureStore has a ~2KB limit per value; silently fall back if exceeded
      console.warn('[favoritesStore] SecureStore write failed:', key);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};

export interface FavoriteEntry {
  icao: string;
  name: string;
  country: string;
}

interface FavoritesState {
  favorites: FavoriteEntry[];
  addFavorite: (entry: FavoriteEntry) => void;
  removeFavorite: (icao: string) => void;
  isFavorite: (icao: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [
        { icao: 'SKBO', name: 'El Dorado, Bogotá', country: 'CO' },
        { icao: 'SKCG', name: 'Rafael Núñez, Cartagena', country: 'CO' },
        { icao: 'SKMD', name: 'Olaya Herrera, Medellín', country: 'CO' },
      ],
      addFavorite: (entry) =>
        set((s) => ({
          favorites: s.favorites.find((f) => f.icao === entry.icao)
            ? s.favorites
            : [...s.favorites, entry],
        })),
      removeFavorite: (icao) =>
        set((s) => ({ favorites: s.favorites.filter((f) => f.icao !== icao) })),
      isFavorite: (icao) => get().favorites.some((f) => f.icao === icao),
    }),
    {
      name: 'pl-favorites',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
