import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Home, CloudSun, ListChecks, BookOpen, Activity } from 'lucide-react-native';

const ACTIVE = '#38bdf8';
const INACTIVE_DARK = '#64748b';
const INACTIVE_LIGHT = '#94a3b8';

export default function TabLayout() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? '#0f172a' : '#ffffff';
  const inactive = isDark ? INACTIVE_DARK : INACTIVE_LIGHT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: inactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="metar"
        options={{
          title: t('tabs.metar'),
          tabBarIcon: ({ color, size }) => <CloudSun color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="kp"
        options={{
          title: t('tabs.kp'),
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="checklists"
        options={{
          title: t('tabs.checklists'),
          tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="logbook"
        options={{
          title: t('tabs.logbook'),
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
