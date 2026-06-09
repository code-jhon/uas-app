import '../src/global.css';
import '../src/i18n';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDatabase } from '../src/db/database';
import { useColorScheme } from 'react-native';
import { useLocaleStore } from '../src/store/localeStore';

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
  const scheme = useColorScheme();

  const loadLocale = useLocaleStore((s) => s.load);

  useEffect(() => {
    // Initialize DB on app start
    getDatabase().catch(console.error);
    // Apply stored language preference (defaults to phone language)
    loadLocale();
  }, [loadLocale]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
