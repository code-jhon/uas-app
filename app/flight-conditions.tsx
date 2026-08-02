import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
  } from 'react-native';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Wind,
  Eye,
  Cloud,
  Thermometer,
  CloudRain,
  Map as MapIcon,
  ShieldCheck,
  AlertTriangle,
  ShieldX,
  CloudOff,
  Database,
} from 'lucide-react-native';
import { useFavoritesStore } from '../src/store/favoritesStore';
import { fetchMetar } from '../src/api/awc';
import { fetchKpCurrent } from '../src/api/swpc';
import { getLastUasFlightLocation } from '../src/db/flights';
import { ceilingFt, evaluateFlightConditions, levelColor, levelTint, viabilityText, FlightConditionLevel } from '../src/utils/flightConditions';

const ARCGIS_APPID = 'b4be4d501c8d4bcabd0c35297521c16e';
const DEFAULT_CENTER = { lng: -74.3578, lat: 4.7377 }; // Colombia

function buildViewerUrl(center: { lat: number; lng: number }): string {
  return `https://www.arcgis.com/apps/instant/media/index.html?appid=${ARCGIS_APPID}&center=${center.lng};${center.lat}&level=10`;
}

function StatusIcon({ level, color, size = 22 }: { level: FlightConditionLevel; color: string; size?: number }) {
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

export default function FlightConditionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const isDark = useAppColorScheme() === 'dark';
  const favorites = useFavoritesStore((s) => s.favorites);
  const primary = favorites[0];

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const card = isDark ? '#1e293b' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  const { data: metar, isFetching: metarFetching, refetch: refetchMetar } = useQuery({
    queryKey: ['metar', primary?.icao],
    queryFn: () => fetchMetar(primary!.icao),
    enabled: !!primary,
  });

  const { data: kpData, isFetching: kpFetching, refetch: refetchKp } = useQuery({
    queryKey: ['kp-current'],
    queryFn: fetchKpCurrent,
    staleTime: 10 * 60 * 1000,
  });

  const { data: uasLocation, isFetching: uasFetching, refetch: refetchUas } = useQuery({
    queryKey: ['last-uas-location'],
    queryFn: getLastUasFlightLocation,
  });

  const onRefresh = useCallback(() => {
    void Promise.all([refetchMetar(), refetchKp(), refetchUas()]);
  }, [refetchMetar, refetchKp, refetchUas]);

  const latestKp = kpData?.length ? kpData[kpData.length - 1].kp : null;
  const result = useMemo(() => evaluateFlightConditions(metar, latestKp), [metar, latestKp]);
  const color = levelColor(result.level);
  const tint = levelTint(result.level, isDark);
  const isCached = !!metar?.rawText?.startsWith('[CACHE]');

  const levelLabel = {
    good: t('flightConditions.levelGood'),
    moderate: t('flightConditions.levelModerate'),
    bad: t('flightConditions.levelBad'),
    unknown: t('flightConditions.levelUnknown'),
  }[result.level];

  const conditionTitle = {
    good: t('flightConditions.conditionGood'),
    moderate: t('flightConditions.conditionModerate'),
    bad: t('flightConditions.conditionBad'),
    unknown: t('flightConditions.noData'),
  }[result.level];

  const conditionDesc = {
    good: t('flightConditions.descGood'),
    moderate: t('flightConditions.descModerate'),
    bad: t('flightConditions.descBad'),
    unknown: t('flightConditions.noData'),
  }[result.level];

  // Metric values
  const windVal = metar?.wind
    ? `${Math.round(Math.max(metar.wind.speedKt, metar.wind.gustKt ?? 0))} kt`
    : '—';
  const visVal = metar?.visibilityMiles !== undefined
    ? `${(metar.visibilityMiles * 1.609344).toFixed(metar.visibilityMiles * 1.609344 >= 10 ? 0 : 1)} km`
    : '—';
  const ceil = metar ? ceilingFt(metar) : undefined;
  const ceilVal = ceil !== undefined ? `${ceil.toLocaleString()} ft` : t('flightConditions.precipNone');
  const tempVal = metar?.tempC !== undefined ? `${Math.round(metar.tempC)}°C` : '—';
  const precipVal = metar?.weather?.length ? metar.weather.join(' ') : t('flightConditions.precipNone');

  const openViewer = () => {
    const center = uasLocation ?? DEFAULT_CENTER;
    Linking.openURL(buildViewerUrl(center)).catch(() => {
      /* no-op: linking unavailable */
    });
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={metarFetching || kpFetching || uasFetching}
          onRefresh={onRefresh}
          tintColor={text}
        />
      }
    >
      {/* Nav bar */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel={t('common.close')}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: card, borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={22} color={text} />
        </TouchableOpacity>
        <Text style={{ color: text, fontSize: 20, fontWeight: '700' }}>{t('flightConditions.title')}</Text>
      </View>

      {/* Cache indicator */}
      {isCached && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 20, marginBottom: 12 }}>
          <Database size={13} color={sub} />
          <Text style={{ color: sub, fontSize: 12 }}>{t('flightConditions.cached')}</Text>
        </View>
      )}

      {/* Status indicator */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 24,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: color,
          backgroundColor: tint,
          padding: 18,
          alignItems: 'center',
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <StatusIcon level={result.level} color={color} />
        </View>
        <Text style={{ color, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{levelLabel}</Text>
        <Text style={{ color: text, fontSize: 18, fontWeight: '700', marginTop: 4 }}>{conditionTitle}</Text>
        <Text style={{ color: sub, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 18 }}>{conditionDesc}</Text>
      </View>

      {/* Weather metrics */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={{ color: text, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>{t('flightConditions.metricsTitle')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <MetricCard icon={<Wind size={16} color={sub} />} label={t('flightConditions.wind')} value={windVal} card={card} text={text} sub={sub} border={border} />
          <MetricCard icon={<Eye size={16} color={sub} />} label={t('flightConditions.visibility')} value={visVal} card={card} text={text} sub={sub} border={border} />
          <MetricCard icon={<Cloud size={16} color={sub} />} label={t('flightConditions.ceiling')} value={ceilVal} card={card} text={text} sub={sub} border={border} />
          <MetricCard icon={<Thermometer size={16} color={sub} />} label={t('flightConditions.temperature')} value={tempVal} card={card} text={text} sub={sub} border={border} />
          <MetricCard icon={<CloudRain size={16} color={sub} />} label={t('flightConditions.precipitation')} value={precipVal} card={card} text={text} sub={sub} border={border} fullWidth />
        </View>
      </View>

      {/* Viability */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ backgroundColor: card, borderRadius: 14, borderWidth: 1.5, borderColor: color, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center' }}>
              <StatusIcon level={result.level} color={color} size={16} />
            </View>
            <Text style={{ color: text, fontSize: 15, fontWeight: '700' }}>{t('flightConditions.viabilityTitle')}</Text>
          </View>
          <Text style={{ color: sub, fontSize: 13, lineHeight: 20 }}>{viabilityText(result)}</Text>
        </View>
      </View>

      {/* UAS zone */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ color: text, fontSize: 16, fontWeight: '600', marginBottom: 12 }}>{t('flightConditions.uasZoneTitle')}</Text>
        <View
          style={{
            height: 200,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: isDark ? '#13243d' : '#e0f2fe',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <MapIcon size={40} color={sub} />
          <Text style={{ color: sub, fontSize: 12, marginTop: 8, paddingHorizontal: 24, textAlign: 'center' }}>
            {t('flightConditions.uasZoneNote')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={openViewer}
          style={{ backgroundColor: '#0284c7', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <MapIcon size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('flightConditions.openUasViewer')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function MetricCard({
  icon, label, value, card, text, sub, border, fullWidth,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  card: string;
  text: string;
  sub: string;
  border: string;
  fullWidth?: boolean;
}) {
  return (
    <View
      style={{
        width: fullWidth ? '100%' : '47%',
        flexGrow: 1,
        backgroundColor: card,
        borderWidth: 1,
        borderColor: border,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        {icon}
        <Text style={{ color: sub, fontSize: 12 }}>{label}</Text>
      </View>
      <Text style={{ color: text, fontSize: 24, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}
