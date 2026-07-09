import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ShieldCheck, AlertTriangle, ShieldX, CloudOff } from 'lucide-react-native';
import { MetarData } from '../types';
import {
  evaluateFlightConditions,
  levelColor,
  statusText,
  FlightConditionLevel,
} from '../utils/flightConditions';

interface Props {
  metar: MetarData | undefined;
  kp: number | null;
  /** Shown when the user has no favorite airports configured. */
  hasFavorites: boolean;
}

function LevelIcon({ level, color }: { level: FlightConditionLevel; color: string }) {
  const size = 24;
  switch (level) {
    case 'good':
      return <ShieldCheck size={size} color={color} />;
    case 'moderate':
      return <AlertTriangle size={size} color={color} />;
    case 'bad':
      return <ShieldX size={size} color={color} />;
    default:
      return <CloudOff size={size} color={color} />;
  }
}

export default function FlightConditionsBanner({ metar, kp, hasFavorites }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const result = evaluateFlightConditions(metar, kp);
  const color = levelColor(result.level);

  const status = !hasFavorites
    ? t('flightConditions.noFavorites')
    : !result.hasData
      ? t('flightConditions.noData')
      : statusText(result.level);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push('/flight-conditions')}
      accessibilityRole="button"
      accessibilityLabel={t('flightConditions.title')}
      style={{
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#0F2440',
      }}
    >
      {/* Simulated vertical gradient overlay (avoids native expo-linear-gradient dep) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60%',
          backgroundColor: '#1E3A5F',
          opacity: 0.9,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          gap: 14,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: `${color}22`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LevelIcon level={result.level} color={color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '500' }}>
            {t('flightConditions.title')}
          </Text>
          <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '700', marginTop: 2 }}>
            {status}
          </Text>
          <Text style={{ color: '#7dd3fc', fontSize: 12, marginTop: 4 }}>
            {t('flightConditions.bannerHint')}
          </Text>
        </View>

        <ChevronRight size={22} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
}
