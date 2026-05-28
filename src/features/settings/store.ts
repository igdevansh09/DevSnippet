import { Appearance } from "react-native";
import { create } from "zustand";
import {
  getThemePreference,
  saveThemePreference,
} from "../../core/storage/async";
import { Theme } from "../../shared/theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  theme: Theme;
    isSystemTheme: boolean;
    isFirstLaunched: boolean | null;

  loadPreferences: () => Promise<void>;
    setTheme: (theme: Theme) => Promise<void>;
    completeOnboarding: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: Appearance.getColorScheme() === "dark" ? "dark" : "light",
  isSystemTheme: true,
  isFirstLaunched: null,

  loadPreferences: async () => {
    const savedTheme = await getThemePreference();
    const hasLaunched = await AsyncStorage.getItem("@app_has_launched");

    if (savedTheme) {
      set({ theme: savedTheme, isSystemTheme: false });
    }

    set({ isFirstLaunched: hasLaunched !== "true" });
  },

  setTheme: async (newTheme: Theme) => {
    set({ theme: newTheme, isSystemTheme: false });
    await saveThemePreference(newTheme);
  },

  completeOnboarding: async () => {
    try {
      await AsyncStorage.setItem("@app_has_launched", "true");
      set({ isFirstLaunched: false });
    } catch (error) {
      console.error("Failed to save onboarding state:", error);
    }
  },
}));
