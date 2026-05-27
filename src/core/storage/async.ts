import AsyncStorage from "@react-native-async-storage/async-storage";
import { Theme } from "../../shared/theme/colors";

export const STORAGE_KEYS = {
  THEME: "@app_theme_preference",
  FIRST_LAUNCH: "@app_is_first_launch",
};

export const saveThemePreference = async (theme: Theme): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error("Failed to save theme preference:", error);
  }
};

export const getThemePreference = async (): Promise<Theme | null> => {
  try {
    const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    return (theme as Theme) || null;
  } catch (error) {
    console.error("Failed to retrieve theme preference:", error);
    return null;
  }
};
