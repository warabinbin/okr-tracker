import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../db';

interface SettingsState {
  settings: AppSettings;
  stagnationThresholdDays: number;
  updateSettings: (data: Partial<AppSettings>) => void;
  setStagnationThresholdDays: (days: number) => void;
}

const defaultSettings: AppSettings = {
  aiApiKey: '',
  aiProvider: 'openai',
  syncEnabled: false,
  ritualSettings: {
    enabled: true,
    soundEnabled: true,
    confettiEnabled: true,
    streakGoal: 7,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      stagnationThresholdDays: 14,
      updateSettings: (data) =>
        set((s) => ({ settings: { ...s.settings, ...data } })),
      setStagnationThresholdDays: (days) =>
        set({ stagnationThresholdDays: days }),
    }),
    { name: 'okr-tracker-settings' }
  )
);
