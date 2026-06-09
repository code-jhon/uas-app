import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function EntryScreen() {
  const router = useRouter();
  const load = useAuthStore((s) => s.load);

  useEffect(() => {
    load().then(({ hasProfile, hasPin, disclaimerDone }) => {
      if (!disclaimerDone) {
        router.replace('/auth/disclaimer');
      } else if (!hasProfile) {
        router.replace('/auth/signup');
      } else if (hasPin) {
        router.replace('/auth/signin');
      } else {
        router.replace('/(tabs)');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#0284c7" size="large" />
    </View>
  );
}
