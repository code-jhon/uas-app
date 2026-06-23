import '../src/global.css';
import '../src/i18n';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDatabase } from '../src/db/database';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLocaleStore } from '../src/store/localeStore';
import { useThemeStore } from '../src/store/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const scheme = useAppColorScheme();

  const loadLocale = useLocaleStore((s) => s.load);
  const loadTheme = useThemeStore((s) => s.load);

  useEffect(() => {
    // Initialize DB on app start
    getDatabase().catch(console.error);
    // Apply stored language preference (defaults to phone language)
    loadLocale();
    // Apply stored theme preference (defaults to phone appearance)
    loadTheme();
  }, [loadLocale, loadTheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="flight-conditions" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
