import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

type Target = '/auth/disclaimer' | '/auth/signup' | '/auth/signin' | '/(tabs)';

function resolveTarget({
  hasProfile,
  hasPin,
  disclaimerDone,
}: {
  hasProfile: boolean;
  hasPin: boolean;
  disclaimerDone: boolean;
}): Target {
  if (!disclaimerDone) return '/auth/disclaimer';
  if (!hasProfile) return '/auth/signup';
  if (hasPin) return '/auth/signin';
  return '/(tabs)';
}

export default function EntryScreen() {
  const load = useAuthStore((s) => s.load);
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    let active = true;
    load().then((state) => {
      if (active) setTarget(resolveTarget(state));
    });
    return () => {
      active = false;
    };
  }, [load]);

  // Once the auth state is resolved, render a declarative <Redirect>. This is
  // more robust than an imperative navigation inside useEffect: even if this
  // screen is re-entered while already mounted, the redirect still fires and
  // the entry screen never gets stuck showing the loader (PAR-35).
  if (target) {
    return <Redirect href={target} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#0284c7" size="large" />
    </View>
  );
}
