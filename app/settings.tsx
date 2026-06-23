import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Globe, Smartphone, SunMoon, Sun, Moon } from 'lucide-react-native';
import { useLocaleStore, LanguagePreference } from '../src/store/localeStore';
import { useThemeStore, ThemePreference } from '../src/store/themeStore';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const isDark = useAppColorScheme() === 'dark';
  const preference = useLocaleStore((s) => s.preference);
  const setPreference = useLocaleStore((s) => s.setPreference);
  const themePreference = useThemeStore((s) => s.preference);
  const setThemePreference = useThemeStore((s) => s.setPreference);

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const card = isDark ? '#1e293b' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const accent = '#0284c7';

  const options: Array<{ value: LanguagePreference; label: string; desc?: string; system?: boolean }> = [
    { value: 'system', label: t('settings.systemDefault'), desc: t('settings.systemDefaultDesc'), system: true },
    { value: 'es', label: t('settings.languageEs') },
    { value: 'en', label: t('settings.languageEn') },
    { value: 'pt', label: t('settings.languagePt') },
  ];

  const themeOptions: Array<{ value: ThemePreference; label: string; desc?: string; icon: ComponentType<LucideProps> }> = [
    { value: 'system', label: t('settings.themeSystem'), desc: t('settings.themeSystemDesc'), icon: Smartphone },
    { value: 'light', label: t('settings.themeLight'), icon: Sun },
    { value: 'dark', label: t('settings.themeDark'), icon: Moon },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={text} />
        </TouchableOpacity>
        <Text style={{ color: text, fontSize: 20, fontWeight: '700', flex: 1 }}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Language section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 10 }}>
          <Globe size={16} color={sub} />
          <Text style={{ color: sub, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('settings.language')}
          </Text>
        </View>
        <Text style={{ color: sub, fontSize: 13, marginBottom: 12 }}>{t('settings.languageDesc')}</Text>

        <View style={{ backgroundColor: card, borderRadius: 12, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
          {options.map((opt, i) => {
            const active = preference === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setPreference(opt.value)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: border,
                }}
              >
                {opt.system && <Smartphone size={16} color={sub} />}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: text, fontSize: 15, fontWeight: active ? '700' : '500' }}>{opt.label}</Text>
                  {opt.desc && <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>{opt.desc}</Text>}
                </View>
                {active && <Check size={18} color={accent} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Theme section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 }}>
          <SunMoon size={16} color={sub} />
          <Text style={{ color: sub, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('settings.theme')}
          </Text>
        </View>
        <Text style={{ color: sub, fontSize: 13, marginBottom: 12 }}>{t('settings.themeDesc')}</Text>

        <View style={{ backgroundColor: card, borderRadius: 12, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
          {themeOptions.map((opt, i) => {
            const active = themePreference === opt.value;
            const Icon = opt.icon;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setThemePreference(opt.value)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: border,
                }}
              >
                <Icon size={16} color={sub} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: text, fontSize: 15, fontWeight: active ? '700' : '500' }}>{opt.label}</Text>
                  {opt.desc && <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>{opt.desc}</Text>}
                </View>
                {active && <Check size={18} color={accent} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
