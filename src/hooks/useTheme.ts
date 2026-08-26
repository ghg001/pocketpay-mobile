import { useColorScheme } from 'react-native';
import { useAppStore, ThemeMode } from '../store/appStore';
import { getColors, ThemeColors } from '../constants/theme';

export interface UseThemeResult {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

/**
 * Resolves the persisted theme preference (light/dark/system) against the
 * device's live color scheme and returns the colors the UI should render with.
 */
export function useTheme(): UseThemeResult {
  const themeMode = useAppStore((state) => state.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const systemScheme = useColorScheme();

  // No system scheme signal (unsupported platform/RN version) falls back to dark,
  // matching the app's original default look.
  const isDark = themeMode === 'system' ? systemScheme !== 'light' : themeMode === 'dark';

  return {
    colors: getColors(isDark),
    isDark,
    themeMode,
    setThemeMode,
  };
}
