import { create } from 'zustand';

export type UnitSystem = 'METRIC' | 'IMPERIAL';
export type UserRole = 'farmer' | 'processor' | 'enterprise' | 'researcher' | 'government' | 'admin';
export type CurrencyCode = 'USD' | 'EUR' | 'INR' | 'BRL' | 'KES' | 'THB';

export interface PreferencesState {
  unitSystem: UnitSystem;
  currency: CurrencyCode;
  locale: string;
  role: UserRole;
  highContrast: boolean;
  reducedMotion: boolean;

  setUnitSystem: (system: UnitSystem) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setLocale: (locale: string) => void;
  setRole: (role: UserRole) => void;
  setHighContrast: (val: boolean) => void;
  setReducedMotion: (val: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  unitSystem: 'METRIC',
  currency: 'USD',
  locale: 'en-US',
  role: 'enterprise',
  highContrast: false,
  reducedMotion: false,

  setUnitSystem: (unitSystem) => set({ unitSystem }),
  setCurrency: (currency) => set({ currency }),
  setLocale: (locale) => set({ locale }),
  setRole: (role) => set({ role }),
  setHighContrast: (highContrast) => set({ highContrast }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion })
}));
