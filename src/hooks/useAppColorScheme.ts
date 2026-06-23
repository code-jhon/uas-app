import { useColorScheme } from 'nativewind';

/**
 * Resolves the effective color scheme ('light' | 'dark') respecting the user's
 * theme preference (managed via `themeStore` / NativeWind's `setColorScheme`).
 *
 * Drop-in replacement for react-native's `useColorScheme()`: usage like
 * `useAppColorScheme() === 'dark'` keeps working, but now honors a forced
 * Light/Dark choice instead of always following the OS appearance.
 */
export function useAppColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useColorScheme();
  return colorScheme ?? 'light';
}
