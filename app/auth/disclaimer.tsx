import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, PlaneTakeoff, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { brand as C } from '../../src/theme';

export default function DisclaimerScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { acceptDisclaimer, profile } = useAuthStore();

  const handleAccept = async () => {
    await acceptDisclaimer();
    // After disclaimer, go to signup if no profile yet, or signin/tabs otherwise
    if (profile) {
      router.replace(profile.hasPin ? '/auth/signin' : '/(tabs)');
    } else {
      router.replace('/auth/signup');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingVertical: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 44 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: C.accent,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 18,
            shadowColor: C.accent, shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4, shadowRadius: 20,
          }}>
            <PlaneTakeoff size={38} color="#fff" />
          </View>
          <Text style={{ color: C.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 }}>PilotLog</Text>
          <Text style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{t('auth.disclaimer.tagline')}</Text>
        </View>

        {/* Disclaimer card */}
        <View style={{
          backgroundColor: C.card, borderRadius: 20, padding: 22,
          marginBottom: 28, borderWidth: 1, borderColor: C.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#713f12', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#fbbf24" />
            </View>
            <Text style={{ color: '#fbbf24', fontWeight: '700', fontSize: 16 }}>{t('auth.disclaimer.noticeTitle')}</Text>
          </View>

          <Text style={{ color: C.sub, fontSize: 14, lineHeight: 22, marginBottom: 14 }}>
            {t('auth.disclaimer.body1Prefix')}
            <Text style={{ color: C.text, fontWeight: '600' }}>{t('auth.disclaimer.body1Bold')}</Text>
            {t('auth.disclaimer.body1Suffix')}
          </Text>

          <Text style={{ color: C.sub, fontSize: 14, lineHeight: 22, marginBottom: 14 }}>
            {t('auth.disclaimer.body2Prefix')}
            <Text style={{ color: C.text, fontWeight: '600' }}>{t('auth.disclaimer.body2Bold')}</Text>
            {t('auth.disclaimer.body2Suffix')}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.surface, borderRadius: 10, padding: 12 }}>
            <AlertTriangle size={14} color={C.error} style={{ marginTop: 2 }} />
            <Text style={{ color: '#fca5a5', fontSize: 13, flex: 1, lineHeight: 20 }}>
              <Text style={{ fontWeight: '700' }}>{t('auth.disclaimer.notEfbBold')}</Text>{t('auth.disclaimer.notEfbRest')}
            </Text>
          </View>
        </View>

        {/* Features preview */}
        <View style={{ gap: 12, marginBottom: 36 }}>
          {[
            { icon: '🌦', title: t('auth.disclaimer.feature1Title'), desc: t('auth.disclaimer.feature1Desc') },
            { icon: '🛰', title: t('auth.disclaimer.feature2Title'), desc: t('auth.disclaimer.feature2Desc') },
            { icon: '✅', title: t('auth.disclaimer.feature3Title'), desc: t('auth.disclaimer.feature3Desc') },
            { icon: '📖', title: t('auth.disclaimer.feature4Title'), desc: t('auth.disclaimer.feature4Desc') },
          ].map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Text style={{ fontSize: 22 }}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontWeight: '600', fontSize: 14 }}>{f.title}</Text>
                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleAccept}
          style={{
            backgroundColor: C.accent, borderRadius: 16, paddingVertical: 17,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
          }}
          activeOpacity={0.85}
        >
          <ShieldCheck size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('auth.disclaimer.cta')}</Text>
        </TouchableOpacity>

        <Text style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 18, lineHeight: 17 }}>
          {t('auth.disclaimer.footer')}
        </Text>
      </ScrollView>
    </View>
  );
}
