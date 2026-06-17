import { View, Text, ScrollView, TouchableOpacity, RefreshControl, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, PlaneTakeoff, CloudSun, Activity, Settings } from 'lucide-react-native';
import { useFavoritesStore } from '../../src/store/favoritesStore';
import { useAuthStore } from '../../src/store/authStore';
import { fetchMetarBatch } from '../../src/api/awc';
import { fetchKpCurrent } from '../../src/api/swpc';
import { kpColor } from '../../src/api/swpc';
import MetarCard from '../../src/components/MetarCard';
import FlightConditionsBanner from '../../src/components/FlightConditionsBanner';
import { getFlightStats } from '../../src/db/flights';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const favorites = useFavoritesStore((s) => s.favorites);
  const profile = useAuthStore((s) => s.profile);
  const firstName = profile?.name?.split(' ')[0] ?? null;

  const { data: metars, isRefetching: metarRefetching, refetch: refetchMetar } = useQuery({
    queryKey: ['metars', favorites.map((f) => f.icao).join(',')],
    queryFn: () => fetchMetarBatch(favorites.map((f) => f.icao)),
    enabled: favorites.length > 0,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: kpData } = useQuery({
    queryKey: ['kp-current'],
    queryFn: fetchKpCurrent,
    staleTime: 10 * 60 * 1000,
  });

  const { data: stats } = useQuery({
    queryKey: ['flight-stats'],
    queryFn: getFlightStats,
  });

  const latestKp = kpData?.length ? kpData[kpData.length - 1].kp : null;
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const card = isDark ? '#1e293b' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.greetingMorning') : hour < 18 ? t('home.greetingAfternoon') : t('home.greetingEvening');

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: bg }}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={metarRefetching} onRefresh={refetchMetar} tintColor={text} />
      }
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: sub, fontSize: 13 }}>{greeting}{firstName ? `, ${firstName}` : ''}</Text>
            <Text style={{ color: text, fontSize: 22, fontWeight: '700', marginTop: 2 }}>
              {profile?.licenseType ? `${profile.licenseType} · ` : ''}PilotLog
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {latestKp !== null && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/kp')}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                  borderWidth: 1, borderColor: border,
                }}
              >
                <Activity size={14} color={kpColor(latestKp)} />
                <Text style={{ color: kpColor(latestKp), fontWeight: '700', fontSize: 14 }}>
                  Kp {latestKp.toFixed(0)}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              accessibilityLabel={t('home.settings')}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: card, borderWidth: 1, borderColor: border,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Settings size={17} color={sub} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Flight conditions banner */}
      <FlightConditionsBanner
        metar={favorites.length ? metars?.get(favorites[0].icao) : undefined}
        kp={latestKp}
        hasFavorites={favorites.length > 0}
      />

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => router.push('/flight/new')}
          style={{ flex: 1, backgroundColor: '#0284c7', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
        >
          <Plus size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('home.newFlight')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/checklists')}
          style={{ flex: 1, backgroundColor: card, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: border }}
        >
          <PlaneTakeoff size={18} color={text} />
          <Text style={{ color: text, fontWeight: '600', fontSize: 14 }}>{t('home.preFlight')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/flight-conditions')}
          style={{ flex: 1, backgroundColor: card, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: border }}
        >
          <CloudSun size={18} color={text} />
          <Text style={{ color: text, fontWeight: '600', fontSize: 14 }}>{t('home.forecast')}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {stats && (
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24 }}>
          <StatBox label={t('home.totalHours')} value={stats.totalHours.toFixed(1)} card={card} text={text} sub={sub} border={border} />
          <StatBox label={t('home.last90Days')} value={stats.last90Days.toFixed(1)} card={card} text={text} sub={sub} border={border} />
          <StatBox label={t('home.landings90')} value={String(stats.landingsLast90)} card={card} text={text} sub={sub} border={border} />
        </View>
      )}

      {/* Favorites METAR */}
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: text, fontSize: 16, fontWeight: '600' }}>{t('home.favoriteAirports')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/metar')}>
            <Text style={{ color: '#38bdf8', fontSize: 14 }}>{t('home.search')}</Text>
          </TouchableOpacity>
        </View>

        {favorites.length === 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/metar')}
            style={{ backgroundColor: card, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: border }}
          >
            <CloudSun size={32} color={sub} />
            <Text style={{ color: sub, marginTop: 8, fontSize: 14 }}>
              {t('home.addFavoritesHint')}
            </Text>
          </TouchableOpacity>
        )}

        {favorites.map((fav) => {
          const metar = metars?.get(fav.icao);
          return (
            <MetarCard
              key={fav.icao}
              icao={fav.icao}
              name={fav.name}
              metar={metar}
              loading={!metars}
              onPress={() => router.push({ pathname: '/metar/[icao]', params: { icao: fav.icao } })}
              isDark={isDark}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

function StatBox({
  label, value, card, text, sub, border,
}: { label: string; value: string; card: string; text: string; sub: string; border: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: card, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: border }}>
      <Text style={{ color: text, fontWeight: '700', fontSize: 18 }}>{value}</Text>
      <Text style={{ color: sub, fontSize: 11, marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
