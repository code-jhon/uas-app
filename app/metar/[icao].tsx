import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Share, Platform, RefreshControl,
} from 'react-native';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  ChevronLeft, RefreshCw, Star,
  Wind, Eye, Cloud, Thermometer,
  Gauge, Mountain, Droplets,
  TrendingUp, Plane, Clock,
  CircleCheck, CircleDot, CircleX,
  Share as ShareIcon,
} from 'lucide-react-native';
import { fetchMetar } from '../../src/api/awc';
import { useFavoritesStore } from '../../src/store/favoritesStore';
import { formatAge, calcRelativeHumidity, calcDensityAltitude } from '../../src/utils/metar';
import { getNumberLocaleTag } from '../../src/i18n/dateLocale';
import { getAirportByCode } from '../../src/db/airports';
import { FlightCategory, MetarData } from '../../src/types';

// ─── Design tokens (matches design variables) ─────────────────────────────────

function useColors(isDark: boolean) {
  return {
    accent:       '#2563EB',
    accentLight:  isDark ? '#1E3A5F' : '#EFF6FF',
    bgPrimary:    isDark ? '#0F1419' : '#FFFFFF',
    bgSecondary:  isDark ? '#1A1F26' : '#F5F7FA',
    bgCard:       isDark ? '#1E2530' : '#FFFFFF',
    border:       isDark ? '#2D3642' : '#E5E9EF',
    textPrimary:  isDark ? '#F0F3F7' : '#0F1419',
    textSecondary: isDark ? '#8B98A5' : '#536471',
    textTertiary: isDark ? '#5C6B7A' : '#8899A6',
    success:      '#16A34A',
    successLight: isDark ? '#14352A' : '#F0FDF4',
    warning:      '#F59E0B',
    warningLight: isDark ? '#3D2E0A' : '#FFFBEB',
    mvfr:         '#2563EB',
  };
}

type Colors = ReturnType<typeof useColors>;

// ─── Category helpers ─────────────────────────────────────────────────────────

function catFill(cat: FlightCategory): string {
  return { VFR: '#16A34A', MVFR: '#2563EB', IFR: '#DC2626', LIFR: '#9333EA' }[cat];
}

function CatIcon({ cat, size }: { cat: FlightCategory; size: number }) {
  const color = '#FFFFFF';
  if (cat === 'VFR')  return <CircleCheck size={size} color={color} />;
  if (cat === 'MVFR') return <CircleDot   size={size} color={color} />;
  return <CircleX size={size} color={color} />;
}

// ─── Reusable components ──────────────────────────────────────────────────────

function CircleBtn({
  onPress, children, C,
}: { onPress: () => void; children: React.ReactNode; C: Colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 36, height: 36,
        backgroundColor: C.bgSecondary,
        borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
      }}
    >
      {children}
    </TouchableOpacity>
  );
}

function MetricCard({
  label, value, iconBg, icon, C,
}: { label: string; value: string; iconBg: string; icon: React.ReactNode; C: Colors }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: C.bgCard,
      borderRadius: 12, borderWidth: 1, borderColor: C.border,
      padding: 14, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{
          width: 28, height: 28,
          backgroundColor: iconBg,
          borderRadius: 8,
          justifyContent: 'center', alignItems: 'center',
        }}>
          {icon}
        </View>
        <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '600', flex: 1 }}>
          {label}
        </Text>
      </View>
      <Text style={{ color: C.textPrimary, fontSize: 18, fontWeight: '700' }}>
        {value}
      </Text>
    </View>
  );
}

function CondRow({
  icon, label, value, last, C,
}: { icon: React.ReactNode; label: string; value: string; last?: boolean; C: Colors }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 14, gap: 12,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon}
        <Text style={{ color: C.textSecondary, fontSize: 14, fontWeight: '500' }}>
          {label}
        </Text>
      </View>
      <Text style={{ color: C.textPrimary, fontSize: 14, fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

// ─── Derived display values ───────────────────────────────────────────────────

function windLabel(metar: MetarData): string {
  if (!metar.wind) return '—';
  const dir = metar.wind.direction === 'VRB' ? 'VRB' : `${metar.wind.direction}°`;
  const gust = metar.wind.gustKt ? ` G${metar.wind.gustKt}` : '';
  return `${dir} / ${metar.wind.speedKt} kt${gust}`;
}

function visLabel(metar: MetarData, t: TFunction): string {
  if (metar.visibilityMiles === undefined) return '—';
  if (metar.visibilityMiles >= 10) return t('metar.detail.vis10');
  return `${(metar.visibilityMiles * 1.60934).toFixed(1)} km`;
}

function ceilingLabel(metar: MetarData, t: TFunction): string {
  const ceiling = metar.clouds.find(c => c.coverage === 'BKN' || c.coverage === 'OVC');
  if (ceiling) return `${ceiling.baseHundredFt * 100} ft ${ceiling.coverage}`;
  const lowest = metar.clouds.find(c => c.coverage !== 'CLR');
  if (lowest) return `${lowest.baseHundredFt * 100} ft ${lowest.coverage}`;
  return t('metar.detail.cavok');
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MetarDetailScreen() {
  const { icao } = useLocalSearchParams<{ icao: string }>();
  const router   = useRouter();
  const { t }    = useTranslation();
  const isDark   = useAppColorScheme() === 'dark';
  const C        = useColors(isDark);

  const code = (icao ?? '').toUpperCase();

  const { data: metar, isFetching, refetch } = useQuery({
    queryKey: ['metar', code],
    queryFn: () => fetchMetar(code),
    enabled: code.length === 4,
    refetchInterval: 5 * 60 * 1000,
  });

  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const { data: airport } = useQuery({
    queryKey: ['airport', code],
    queryFn: () => getAirportByCode(code),
    enabled: code.length >= 3,
  });
  const fav = isFavorite(code);

  const toggleFav = () => {
    if (fav) removeFavorite(code);
    else addFavorite({ icao: code, name: airport?.name ?? code, country: airport?.isoCountry ?? '' });
  };

  const handleShare = async () => {
    if (!metar) return;
    await Share.share({ message: `METAR ${code}\n${metar.rawText}\n\n${t('metar.detail.shareVia')}` });
  };

  const handleAddFlight = () => {
    router.push({ pathname: '/flight/new', params: { icao: code } });
  };

  // ── Derived metrics ──
  const rh = (metar?.tempC !== undefined && metar?.dewpointC !== undefined)
    ? calcRelativeHumidity(metar.tempC, metar.dewpointC)
    : undefined;

  const da = (metar?.tempC !== undefined && metar?.altimeterHpa !== undefined && metar?.elevationFt !== undefined)
    ? calcDensityAltitude(metar.tempC, metar.altimeterHpa, metar.elevationFt)
    : undefined;

  const isCache = metar?.rawText.startsWith('[CACHE]');
  const rawDisplay = metar?.rawText.replace('[CACHE] ', '') ?? '';

  // ── Condition rows: only defined values ──
  type CondItem = { icon: React.ReactNode; label: string; value: string };
  const condItems: CondItem[] = [];
  if (metar?.altimeterHpa !== undefined)
    condItems.push({ icon: <Gauge size={18} color={C.textSecondary} />, label: t('metar.detail.qnh'), value: `${metar.altimeterHpa} hPa` });
  if (da !== undefined)
    condItems.push({ icon: <Mountain size={18} color={C.textSecondary} />, label: t('metar.detail.densityAltitude'), value: `${Math.round(da).toLocaleString(getNumberLocaleTag())} ft` });
  if (rh !== undefined)
    condItems.push({ icon: <Droplets size={18} color={C.textSecondary} />, label: t('metar.detail.relativeHumidity'), value: `${rh} %` });
  if (metar?.dewpointC !== undefined)
    condItems.push({ icon: <Thermometer size={18} color={C.textSecondary} />, label: t('metar.detail.dewpoint'), value: `${metar.dewpointC} °C` });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bgPrimary }}
      contentContainerStyle={{ paddingBottom: 48 }}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          enabled={code.length === 4}
          tintColor={C.textPrimary}
        />
      }
    >
      {/* ── Nav Bar ── */}
      <View style={{
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <CircleBtn onPress={() => router.back()} C={C}>
          <ChevronLeft size={18} color={C.textPrimary} />
        </CircleBtn>

        <Text style={{ color: C.textPrimary, fontSize: 17, fontWeight: '600' }}>
          METAR
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <CircleBtn onPress={toggleFav} C={C}>
            <Star
              size={18}
              color={fav ? '#F59E0B' : C.textPrimary}
              fill={fav ? '#F59E0B' : 'transparent'}
            />
          </CircleBtn>
          <CircleBtn onPress={() => refetch()} C={C}>
            {isFetching
              ? <ActivityIndicator size="small" color={C.textPrimary} />
              : <RefreshCw size={18} color={C.textPrimary} />}
          </CircleBtn>
        </View>
      </View>

      {/* ── Loading skeleton ── */}
      {isFetching && !metar && (
        <View style={{ alignItems: 'center', marginTop: 80, gap: 12 }}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={{ color: C.textSecondary, fontSize: 14 }}>
            {t('metar.detail.fetching')}
          </Text>
        </View>
      )}

      {metar && (
        <View style={{ paddingHorizontal: 20, gap: 20, marginTop: 8 }}>

          {/* ── Hero ── */}
          <View style={{ gap: 8 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between', gap: 12,
            }}>
              <Text style={{
                color: C.textPrimary, fontSize: 44, fontWeight: '700', letterSpacing: -1,
              }}>
                {code}
              </Text>
              <View style={{
                backgroundColor: catFill(metar.flightCategory),
                borderRadius: 12,
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 12, paddingVertical: 6,
              }}>
                <CatIcon cat={metar.flightCategory} size={14} />
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                  {metar.flightCategory}
                </Text>
              </View>
            </View>
            {airport && (
              <Text style={{ color: C.textSecondary, fontSize: 14, fontWeight: '500' }}>
                {airport.name}
              </Text>
            )}
          </View>

          {/* ── Raw METAR Card (always visible) ── */}
          <View style={{
            backgroundColor: C.bgSecondary,
            borderRadius: 12, padding: 16, gap: 10,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.8 }}>
                {t('metar.detail.rawReport')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={12} color={C.textTertiary} />
                <Text style={{ color: C.textTertiary, fontSize: 12, fontWeight: '500' }}>
                  {formatAge(metar.observedAt)}
                </Text>
              </View>
            </View>
            <Text style={{
              color: C.textPrimary,
              fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
              fontSize: 13, fontWeight: '500', lineHeight: 20,
            }}>
              {rawDisplay}
            </Text>
            {isCache && (
              <Text style={{ color: C.textTertiary, fontSize: 11 }}>
                {t('metar.detail.cacheHint')}
              </Text>
            )}
          </View>

          {/* ── Metrics Grid 2×2 ── */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MetricCard
                label={t('metar.detail.wind')} value={windLabel(metar)}
                iconBg={C.accentLight} icon={<Wind size={16} color={C.accent} />} C={C}
              />
              <MetricCard
                label={t('metar.detail.visibility')} value={visLabel(metar, t)}
                iconBg={C.successLight} icon={<Eye size={16} color={C.success} />} C={C}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <MetricCard
                label={t('metar.detail.ceiling')} value={ceilingLabel(metar, t)}
                iconBg={C.accentLight} icon={<Cloud size={16} color={C.mvfr} />} C={C}
              />
              <MetricCard
                label={t('metar.detail.tempDew')}
                value={
                  metar.tempC !== undefined && metar.dewpointC !== undefined
                    ? `${metar.tempC}° / ${metar.dewpointC}°`
                    : '—'
                }
                iconBg={C.warningLight} icon={<Thermometer size={16} color={C.warning} />} C={C}
              />
            </View>
          </View>

          {/* ── Conditions Section ── */}
          {condItems.length > 0 && (
            <View style={{ gap: 12 }}>
              <Text style={{ color: C.textPrimary, fontSize: 16, fontWeight: '700' }}>
                {t('metar.detail.conditions')}
              </Text>
              <View style={{
                backgroundColor: C.bgCard,
                borderRadius: 12, borderWidth: 1, borderColor: C.border,
                paddingHorizontal: 16, paddingVertical: 4,
              }}>
                {condItems.map((item, i) => (
                  <CondRow
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                    last={i === condItems.length - 1}
                    C={C}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Trend Card ── */}
          {(metar.nosig || (metar.weather && metar.weather.length > 0)) && (
            <View style={{
              backgroundColor: C.accentLight,
              borderRadius: 12, borderWidth: 1, borderColor: C.border,
              padding: 16, gap: 10,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 28, height: 28,
                  backgroundColor: C.accent, borderRadius: 8,
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  <TrendingUp size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: C.textPrimary, fontSize: 14, fontWeight: '700' }}>
                    {t('metar.detail.trendForecast')}
                  </Text>
                  <Text style={{ color: C.accent, fontSize: 12, fontWeight: '600', letterSpacing: 0.6 }}>
                    {metar.nosig
                      ? t('metar.detail.nosigBadge')
                      : metar.weather?.join(' ') ?? ''}
                  </Text>
                </View>
              </View>
              <Text style={{ color: C.textPrimary, fontSize: 13, fontWeight: '500', lineHeight: 20 }}>
                {metar.nosig
                  ? t('metar.detail.nosigDesc')
                  : t('metar.detail.activePhenomena', { wx: metar.weather?.join(', ') })}
              </Text>
            </View>
          )}

          {/* ── Action Buttons ── */}
          <View style={{ gap: 10, paddingTop: 4 }}>
            <TouchableOpacity
              onPress={handleAddFlight}
              style={{
                height: 52, backgroundColor: C.accent, borderRadius: 12,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Plane size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                {t('metar.detail.addToFlight')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={{
                height: 52, backgroundColor: C.bgCard, borderRadius: 12,
                borderWidth: 1.5, borderColor: C.border,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <ShareIcon size={18} color={C.textPrimary} />
              <Text style={{ color: C.textPrimary, fontSize: 15, fontWeight: '700' }}>
                {t('metar.detail.share')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
