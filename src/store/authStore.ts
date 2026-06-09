import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type LicenseType = 'Estudiante' | 'PPL' | 'CPL' | 'ATPL' | 'Instructor';

export interface PilotProfile {
  name: string;
  licenseNumber?: string;
  licenseType?: LicenseType;
  hasPin: boolean;
  createdAt: string;
}

const KEYS = {
  profile: 'pl-pilot-profile',
  pin: 'pl-pilot-pin',
  disclaimer: 'pl-disclaimer-accepted',
} as const;

interface AuthState {
  profile: PilotProfile | null;
  isLoaded: boolean;
  // Hydrate from SecureStore on app start
  load: () => Promise<{ hasProfile: boolean; hasPin: boolean; disclaimerDone: boolean }>;
  // Save new profile (sign up)
  saveProfile: (data: Omit<PilotProfile, 'hasPin' | 'createdAt'>, pin?: string) => Promise<void>;
  // Verify PIN on sign in
  verifyPin: (pin: string) => Promise<boolean>;
  // Mark disclaimer as done
  acceptDisclaimer: () => Promise<void>;
  // Check disclaimer
  isDisclaimerDone: () => Promise<boolean>;
  // Sign out (clear profile)
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  profile: null,
  isLoaded: false,

  load: async () => {
    const [raw, pinRaw, discRaw] = await Promise.all([
      SecureStore.getItemAsync(KEYS.profile),
      SecureStore.getItemAsync(KEYS.pin),
      SecureStore.getItemAsync(KEYS.disclaimer),
    ]);

    const profile: PilotProfile | null = raw ? JSON.parse(raw) : null;
    const hasPin = !!pinRaw;
    const disclaimerDone = discRaw === '1';

    if (profile) {
      set({ profile: { ...profile, hasPin }, isLoaded: true });
    } else {
      set({ profile: null, isLoaded: true });
    }

    return { hasProfile: !!profile, hasPin, disclaimerDone };
  },

  saveProfile: async (data, pin) => {
    const profile: PilotProfile = {
      ...data,
      hasPin: !!pin,
      createdAt: new Date().toISOString(),
    };
    await SecureStore.setItemAsync(KEYS.profile, JSON.stringify(profile));
    if (pin) {
      await SecureStore.setItemAsync(KEYS.pin, pin);
    }
    set({ profile });
  },

  verifyPin: async (pin) => {
    const stored = await SecureStore.getItemAsync(KEYS.pin);
    return stored === pin;
  },

  acceptDisclaimer: async () => {
    await SecureStore.setItemAsync(KEYS.disclaimer, '1');
  },

  isDisclaimerDone: async () => {
    const val = await SecureStore.getItemAsync(KEYS.disclaimer);
    return val === '1';
  },

  signOut: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.profile),
      SecureStore.deleteItemAsync(KEYS.pin),
    ]);
    set({ profile: null });
  },
}));
