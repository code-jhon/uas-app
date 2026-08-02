import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PlaneTakeoff, Delete, LogOut } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { brand as C } from '../../src/theme';

const PAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'DEL'],
];

export default function SignInScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, verifyPin, signOut } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const firstName = profile?.name?.split(' ')[0] ?? t('auth.signin.pilot');

  // Shake animation on wrong PIN
  const shake = () => {
    Vibration.vibrate(300);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = (key: string) => {
    if (key === 'DEL') {
      setPin((p) => p.slice(0, -1));
      setError(false);
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) {
      checkPin(next);
    }
  };

  const checkPin = async (entered: string) => {
    const ok = await verifyPin(entered);
    if (ok) {
      router.replace('/(tabs)');
    } else {
      shake();
      setError(true);
      setAttempts((n) => n + 1);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 600);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.replace('/auth/signup');
  };

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Top section */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
        {/* App mark */}
        <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <PlaneTakeoff size={28} color="#fff" />
        </View>

        <Text style={{ color: C.sub, fontSize: 14, marginBottom: 6 }}>{t('auth.signin.welcome')}</Text>
        <Text style={{ color: C.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginBottom: 36 }}>
          {firstName}
        </Text>

        {/* PIN dots */}
        <Animated.View style={{ flexDirection: 'row', gap: 16, marginBottom: 12, transform: [{ translateX: shakeAnim }] }}>
          {dots.map((filled, i) => (
            <View
              key={i}
              style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: error ? C.error : filled ? C.accentLight : 'transparent',
                borderWidth: 2,
                borderColor: error ? C.error : filled ? C.accentLight : C.border,
                transform: [{ scale: filled ? 1 : 0.85 }],
              }}
            />
          ))}
        </Animated.View>

        {error && (
          <Text style={{ color: C.error, fontSize: 13, fontWeight: '500' }}>
            {t('auth.signin.wrongPin')}{attempts >= 3 ? t('auth.signin.attempts', { count: attempts }) : ''}
          </Text>
        )}
        {!error && <Text style={{ color: C.muted, fontSize: 13 }}>{t('auth.signin.enterPin')}</Text>}
      </View>

      {/* Numpad */}
      <View style={{ paddingHorizontal: 40, paddingBottom: 52, gap: 14 }}>
        {PAD.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 14, justifyContent: 'center' }}>
            {row.map((key, ki) => {
              if (key === '') return <View key={ki} style={{ flex: 1, height: 66 }} />;

              const isDel = key === 'DEL';
              return (
                <TouchableOpacity
                  key={ki}
                  onPress={() => handleKey(key)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1, height: 66, borderRadius: 16,
                    backgroundColor: isDel ? 'transparent' : C.card,
                    borderWidth: isDel ? 0 : 1,
                    borderColor: C.border,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isDel ? (
                    <Delete size={20} color={C.sub} />
                  ) : (
                    <Text style={{ color: C.text, fontSize: 22, fontWeight: '600' }}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Change account */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, paddingVertical: 8 }}
          activeOpacity={0.7}
        >
          <LogOut size={14} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: 13 }}>{t('auth.signin.useAnother')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
