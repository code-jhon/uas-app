import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Plane, Cpu, MapPin, ExternalLink,
  Navigation, Globe, BookOpen, ImageOff, ShoppingCart,
} from 'lucide-react-native';
import { getFlightById } from '../../src/db/flights';
import { getExecutions } from '../../src/db/checklists';
import { COLOMBIA_AIRPORTS } from '../../src/data/airports';
import {
  extractDroneModel, fetchDroneImage,
  detectBrand, djiProductPage,
} from '../../src/utils/drones';
import i18n from '../../src/i18n';
import { getDateLocale, getNumberLocaleTag } from '../../src/i18n/dateLocale';
import { format, parseISO } from 'date-fns';

// ─── Env ──────────────────────────────────────────────────────────────────────

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

// ─── Map URL builders ─────────────────────────────────────────────────────────

/** Static map for a single UAS site */
function uasMapUrl(lat: number, lng: number): string {
  const marker = encodeURIComponent(`color:0x7C3AED|label:U|${lat},${lng}`);
  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${lat},${lng}&zoom=16` +
    `&size=600x280&scale=2&maptype=roadmap` +
    `&markers=${marker}` +
    `&key=${MAPS_KEY}`
  );
}

/** Static map for a manned route — two markers + geodesic path */
function routeMapUrl(
  oLat: number, oLng: number,
  dLat: number, dLng: number,
): string {
  const origin      = encodeURIComponent(`color:0x16A34A|label:O|${oLat},${oLng}`);
  const destination = encodeURIComponent(`color:0xDC2626|label:D|${dLat},${dLng}`);
  const path        = encodeURIComponent(
    `color:0x2563EBCC|weight:3|geodesic:true|${oLat},${oLng}|${dLat},${dLng}`
  );
  const visible = encodeURIComponent(`${oLat},${oLng}|${dLat},${dLng}`);
  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?visible=${visible}` +
    `&size=600x280&scale=2&maptype=roadmap` +
    `&markers=${origin}` +
    `&markers=${destination}` +
    `&path=${path}` +
    `&key=${MAPS_KEY}`
  );
}

/** Single-marker map when only one airport is known */
function singleMapUrl(lat: number, lng: number, label: string, color: string): string {
  const marker = encodeURIComponent(`color:${color}|label:${label}|${lat},${lng}`);
  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${lat},${lng}&zoom=13` +
    `&size=600x280&scale=2&maptype=roadmap` +
    `&markers=${marker}` +
    `&key=${MAPS_KEY}`
  );
}

// ─── Open-in-Maps helpers ─────────────────────────────────────────────────────

function openRoute(oLat: number, oLng: number, dLat: number, dLng: number) {
  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${oLat},${oLng}` +
    `&destination=${dLat},${dLng}`;
  Linking.openURL(url).catch(() =>
    Alert.alert(i18n.t('common.error'), i18n.t('flight.detail.mapsOpenError'))
  );
}

function openPoint(lat: number, lng: number, label: string) {
  const url = `https://www.google.com/maps?q=${lat},${lng}+(${encodeURIComponent(label)})`;
  Linking.openURL(url).catch(() =>
    Alert.alert(i18n.t('common.error'), i18n.t('flight.detail.mapsOpenError'))
  );
}

// ─── Sub-components (outside screen to keep stable references) ────────────────

interface RowProps {
  label: string;
  value?: string | number | null;
  border: string;
  textColor: string;
  subColor: string;
}
function Row({ label, value, border, textColor, subColor }: RowProps) {
  if (value == null) return null;
  return (
    <View style={{
      flexDirection: 'row', paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: border,
    }}>
      <Text style={{ color: subColor, fontSize: 13, width: 150 }}>{label}</Text>
      <Text style={{ color: textColor, fontSize: 14, fontWeight: '500', flex: 1 }}>
        {String(value)}
      </Text>
    </View>
  );
}

interface MapCardProps {
  children: React.ReactNode;
  card: string;
  border: string;
}
function MapCard({ children, card, border }: MapCardProps) {
  return (
    <View style={{
      backgroundColor: card, borderRadius: 16,
      borderWidth: 1, borderColor: border,
      overflow: 'hidden',
    }}>
      {children}
    </View>
  );
}

// ─── Drone model card ─────────────────────────────────────────────────────────

interface DroneCardColors {
  card: string; border: string; text: string; sub: string;
  accent: string; uasColor: string; noMapBg: string; isDark: boolean;
}

function DroneModelCard({ model, C }: { model: string; C: DroneCardColors }) {
  const { t } = useTranslation();
  const { data, isPending } = useQuery({
    queryKey: ['drone-image', model],
    queryFn: () => fetchDroneImage(model),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const brand    = detectBrand(model);
  const isDJI    = brand?.name === 'DJI';
  const siteUrl  = isDJI ? djiProductPage(model) : brand?.site ?? null;
  const wikiUrl  = data?.wikiUrl ?? null;
  const imageUrl = data?.imageUrl ?? null;
  const source   = data?.source ?? null;
  const amazonSearchUrl = data?.amazonSearchUrl
    ?? `https://www.amazon.com.co/s?k=${encodeURIComponent(model + ' drone')}`;

  const SOURCE_LABEL: Record<string, string> = {
    wikipedia: t('flight.detail.sourceWikipedia'),
    amazon: t('flight.detail.sourceAmazon'),
  };

  const openUrl = (url: string) =>
    Linking.openURL(url).catch(() => Alert.alert(t('common.error'), t('flight.detail.droneLinkError')));

  type LinkRow = {
    key: string;
    icon: React.ReactNode;
    label: string;
    sub: string;
    onPress: () => void;
    labelColor: string;
  };

  const linkRows: LinkRow[] = [
    ...(siteUrl ? [{
      key: 'site',
      icon: <Globe size={16} color={C.uasColor} />,
      label: isDJI
        ? t('flight.detail.droneProductPage', { name: brand!.name })
        : t('flight.detail.droneManufacturerSite', { name: brand?.name ?? t('flight.detail.droneManufacturer') }),
      sub: siteUrl,
      onPress: () => openUrl(siteUrl),
      labelColor: C.uasColor,
    }] : []),
    ...(wikiUrl ? [{
      key: 'wiki',
      icon: <BookOpen size={16} color={C.sub} />,
      label: data?.pageTitle ?? 'Wikipedia',
      sub: 'wikipedia.org',
      onPress: () => openUrl(wikiUrl),
      labelColor: C.text,
    }] : []),
    {
      key: 'amazon',
      icon: <ShoppingCart size={16} color="#FF9900" />,
      label: t('flight.detail.droneAmazonSearch', { model }),
      sub: 'amazon.com.co',
      onPress: () => openUrl(amazonSearchUrl),
      labelColor: '#FF9900',
    },
  ];

  return (
    <View style={{
      backgroundColor: C.card, borderRadius: 16,
      borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <View style={{
          width: 32, height: 32, borderRadius: 8,
          backgroundColor: C.isDark ? '#2E1A4A' : '#F5F3FF',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Cpu size={17} color={C.uasColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 14, fontWeight: '700' }}>
            {model}
          </Text>
          {brand && (
            <Text style={{ color: C.sub, fontSize: 12 }}>
              {t('flight.detail.droneFabricante', { name: brand.name })}
            </Text>
          )}
        </View>
      </View>

      {/* ── Imagen ── */}
      {isPending ? (
        <View style={{
          height: 200, backgroundColor: C.noMapBg,
          justifyContent: 'center', alignItems: 'center', gap: 10,
        }}>
          <ActivityIndicator color={C.uasColor} size="large" />
          <Text style={{ color: C.sub, fontSize: 13 }}>
            {t('flight.detail.droneSearching')}
          </Text>
          <Text style={{ color: C.sub, fontSize: 11 }}>
            {t('flight.detail.droneSource')}
          </Text>
        </View>
      ) : imageUrl ? (
        <View>
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: 220, backgroundColor: C.noMapBg }}
            resizeMode="contain"
          />
          {source && (
            <View style={{
              position: 'absolute', bottom: 6, right: 8,
              backgroundColor: C.isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)',
              borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
            }}>
              <Text style={{ color: C.sub, fontSize: 10 }}>
                {SOURCE_LABEL[source]}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={{
          height: 140, backgroundColor: C.noMapBg,
          justifyContent: 'center', alignItems: 'center', gap: 8,
        }}>
          <ImageOff size={28} color={C.sub} />
          <Text style={{ color: C.sub, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 }}>
            {t('flight.detail.droneNoImage')}
          </Text>
        </View>
      )}

      {/* ── Links ── */}
      <View style={{ borderTopWidth: 1, borderTopColor: C.border }}>
        {linkRows.map((row, i) => (
          <TouchableOpacity
            key={row.key}
            onPress={row.onPress}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingHorizontal: 14, paddingVertical: 13,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: C.border,
            }}
          >
            {row.icon}
            <View style={{ flex: 1 }}>
              <Text style={{ color: row.labelColor, fontSize: 13, fontWeight: '600' }}>
                {row.label}
              </Text>
              <Text style={{ color: C.sub, fontSize: 11 }} numberOfLines={1}>
                {row.sub}
              </Text>
            </View>
            <ExternalLink size={14} color={C.sub} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FlightDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { t }   = useTranslation();
  const isDark  = useAppColorScheme() === 'dark';

  const bg       = isDark ? '#0F1419' : '#F5F7FA';
  const card     = isDark ? '#1E2530' : '#FFFFFF';
  const text     = isDark ? '#F0F3F7' : '#0F1419';
  const sub      = isDark ? '#8B98A5' : '#536471';
  const border   = isDark ? '#2D3642' : '#E5E9EF';
  const accent   = '#2563EB';
  const uasColor = '#7C3AED';
  const noMapBg  = isDark ? '#1A1F26' : '#F5F7FA';

  const rowProps = { border, textColor: text, subColor: sub };

  const droneCardColors: DroneCardColors = {
    card, border, text, sub, accent, uasColor, noMapBg, isDark,
  };

  const { data: flight } = useQuery({
    queryKey: ['flight', id],
    queryFn: () => getFlightById(id!),
    enabled: !!id,
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['executions', id],
    queryFn: () => getExecutions(id!),
    enabled: !!id,
  });

  if (!flight) return null;

  const isUAS      = flight.flightType === 'uas';
  const hasUasMap  = isUAS && flight.lat != null && flight.lng != null;
  const droneModel = isUAS ? extractDroneModel(flight.notes) : null;

  // Look up airport coordinates for manned flights
  const originAirport      = !isUAS ? COLOMBIA_AIRPORTS.find(a => a.icao === flight.originIcao) : null;
  const destinationAirport = !isUAS ? COLOMBIA_AIRPORTS.find(a => a.icao === flight.destinationIcao) : null;
  const hasBothAirports    = !!originAirport && !!destinationAirport;
  const hasAnyAirport      = !!originAirport || !!destinationAirport;
  const knownAirport       = originAirport ?? destinationAirport;

  const formatDate = (d: string) => {
    try { return format(parseISO(d), "EEEE d 'de' MMMM yyyy", { locale: getDateLocale() }); }
    catch { return d; }
  };

  const typeColor = isUAS ? uasColor : accent;
  const typeLight = isUAS
    ? (isDark ? '#2E1A4A' : '#F5F3FF')
    : (isDark ? '#1E3A5F' : '#EFF6FF');

  // ── Manned map content ──
  const mannedMapImageUri = (() => {
    if (!MAPS_KEY) return null;
    if (hasBothAirports) {
      return routeMapUrl(
        originAirport!.lat, originAirport!.lng,
        destinationAirport!.lat, destinationAirport!.lng,
      );
    }
    if (originAirport) return singleMapUrl(originAirport.lat, originAirport.lng, 'O', '0x16A34A');
    if (destinationAirport) return singleMapUrl(destinationAirport.lat, destinationAirport.lng, 'D', '0xDC2626');
    return null;
  })();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* ── Header ── */}
      <View style={{
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 30, height: 30, borderRadius: 8,
              backgroundColor: typeLight,
              justifyContent: 'center', alignItems: 'center',
            }}>
              {isUAS
                ? <Cpu size={16} color={typeColor} />
                : <Plane size={16} color={typeColor} />}
            </View>
            <Text style={{ color: text, fontSize: 18, fontWeight: '700', flex: 1 }} numberOfLines={1}>
              {isUAS
                ? (flight.site ?? t('flight.detail.uasTitle'))
                : `${flight.originIcao} → ${flight.destinationIcao}`}
            </Text>
          </View>
          <Text style={{ color: sub, fontSize: 13, marginTop: 2 }}>
            {formatDate(flight.date)}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 16 }}>

        {/* ══════════════════════════════════════════
            MAPA — VUELO TRIPULADO
        ══════════════════════════════════════════ */}
        {!isUAS && hasAnyAirport && (
          <MapCard card={card} border={border}>
            {/* Header del mapa */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 14, paddingVertical: 10,
              borderBottomWidth: 1, borderBottomColor: border,
            }}>
              <Plane size={15} color={accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontSize: 14, fontWeight: '600' }}>
                  {t('flight.detail.route')}
                </Text>
                {(originAirport || destinationAirport) && (
                  <Text style={{ color: sub, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                    {[
                      originAirport ? `${originAirport.icao} · ${originAirport.name.split(',')[0]}` : flight.originIcao,
                      destinationAirport ? `${destinationAirport.icao} · ${destinationAirport.name.split(',')[0]}` : flight.destinationIcao,
                    ].join('  →  ')}
                  </Text>
                )}
              </View>
            </View>

            {/* Imagen del mapa */}
            {mannedMapImageUri ? (
              <Image
                source={{ uri: mannedMapImageUri }}
                style={{ width: '100%', height: 220 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{
                height: 120, backgroundColor: noMapBg,
                justifyContent: 'center', alignItems: 'center', gap: 6, padding: 16,
              }}>
                <MapPin size={24} color={sub} />
                <Text style={{ color: sub, fontSize: 13, textAlign: 'center' }}>
                  {t('flight.detail.mapKeyHint')}
                </Text>
              </View>
            )}

            {/* Leyenda de marcadores */}
            {hasBothAirports && (
              <View style={{
                flexDirection: 'row', justifyContent: 'center', gap: 20,
                paddingHorizontal: 14, paddingVertical: 8,
                borderTopWidth: 1, borderTopColor: border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A' }} />
                  <Text style={{ color: sub, fontSize: 12 }}>
                    {flight.originIcao} {t('flight.detail.origin')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' }} />
                  <Text style={{ color: sub, fontSize: 12 }}>
                    {flight.destinationIcao} {t('flight.detail.destination')}
                  </Text>
                </View>
              </View>
            )}

            {/* Botón abrir en Google Maps */}
            <TouchableOpacity
              onPress={() => {
                if (hasBothAirports) {
                  openRoute(
                    originAirport!.lat, originAirport!.lng,
                    destinationAirport!.lat, destinationAirport!.lng,
                  );
                } else if (knownAirport) {
                  openPoint(knownAirport.lat, knownAirport.lng, knownAirport.name);
                }
              }}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: 12,
                borderTopWidth: 1, borderTopColor: border,
              }}
            >
              <Navigation size={15} color={accent} />
              <Text style={{ color: accent, fontSize: 13, fontWeight: '600' }}>
                {hasBothAirports ? t('flight.detail.viewRoute') : t('flight.detail.openAirport')}
              </Text>
              <ExternalLink size={13} color={accent} />
            </TouchableOpacity>
          </MapCard>
        )}

        {/* ══════════════════════════════════════════
            MAPA — VUELO UAS
        ══════════════════════════════════════════ */}
        {hasUasMap && (
          <MapCard card={card} border={border}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 14, paddingVertical: 10,
              borderBottomWidth: 1, borderBottomColor: border,
            }}>
              <MapPin size={15} color={uasColor} />
              <Text style={{ color: text, fontSize: 14, fontWeight: '600', flex: 1 }}>
                {t('flight.detail.opSite')}
              </Text>
              <Text style={{ color: sub, fontSize: 11 }}>
                {flight.lat!.toFixed(5)}, {flight.lng!.toFixed(5)}
              </Text>
            </View>

            {MAPS_KEY ? (
              <Image
                source={{ uri: uasMapUrl(flight.lat!, flight.lng!) }}
                style={{ width: '100%', height: 220 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{
                height: 120, backgroundColor: noMapBg,
                justifyContent: 'center', alignItems: 'center', gap: 6, padding: 16,
              }}>
                <MapPin size={24} color={sub} />
                <Text style={{ color: sub, fontSize: 13, textAlign: 'center' }}>
                  {t('flight.detail.mapKeyHint')}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => openPoint(flight.lat!, flight.lng!, flight.site ?? t('flight.detail.uasSiteFallback'))}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: 12,
                borderTopWidth: 1, borderTopColor: border,
              }}
            >
              <Navigation size={15} color={uasColor} />
              <Text style={{ color: uasColor, fontSize: 13, fontWeight: '600' }}>
                {t('flight.detail.openMaps')}
              </Text>
              <ExternalLink size={13} color={uasColor} />
            </TouchableOpacity>
          </MapCard>
        )}

        {/* ── Ficha de datos ── */}
        <View style={{
          backgroundColor: card, borderRadius: 14,
          padding: 16, borderWidth: 1, borderColor: border,
        }}>
          {isUAS ? (
            <>
              <Row label={t('flight.detail.rows.type')} value={t('flight.detail.rows.typeUas')} {...rowProps} />
              <Row label={t('flight.detail.rows.site')} value={flight.site} {...rowProps} />
              <Row label={t('flight.detail.rows.role')} value={flight.role ? t(`roles.${flight.role}`, { defaultValue: flight.role }) : null} {...rowProps} />
              <Row label={t('flight.detail.rows.droneId')} value={flight.aircraftRegistration} {...rowProps} />
              <Row label={t('flight.detail.rows.missionType')} value={flight.missionType ? t(`missions.${flight.missionType}`, { defaultValue: flight.missionType }) : null} {...rowProps} />
              <Row label={t('flight.detail.rows.vlos')}
                value={flight.vlos !== undefined
                  ? (flight.vlos ? t('flight.detail.rows.vlosYes') : t('flight.detail.rows.vlosNo'))
                  : null}
                {...rowProps}
              />
              <Row label={t('flight.detail.rows.start')} value={flight.blockOut} {...rowProps} />
              <Row label={t('flight.detail.rows.end')} value={flight.blockIn} {...rowProps} />
              <Row label={t('flight.detail.rows.flightTime')}
                value={flight.totalTime != null ? `${flight.totalTime.toFixed(1)} h` : null}
                {...rowProps}
              />
              <Row label={t('flight.detail.rows.maxAlt')}
                value={flight.maxAltitudeFt != null ? `${flight.maxAltitudeFt} ft` : null}
                {...rowProps}
              />
              <Row label={t('flight.detail.rows.maxDist')}
                value={flight.maxDistanceM != null ? `${flight.maxDistanceM} m` : null}
                {...rowProps}
              />
              {hasUasMap && (
                <Row label={t('flight.detail.rows.coordinates')}
                  value={`${flight.lat!.toFixed(6)}, ${flight.lng!.toFixed(6)}`}
                  {...rowProps}
                />
              )}
              <Row label={t('flight.detail.rows.notes')} value={flight.notes} {...rowProps} />
            </>
          ) : (
            <>
              <Row label={t('flight.detail.rows.type')} value={t('flight.detail.rows.typeManned')} {...rowProps} />
              <Row label={t('flight.detail.rows.date')} value={flight.date} {...rowProps} />
              <Row label={t('flight.detail.rows.aircraft')} value={flight.aircraftRegistration} {...rowProps} />
              <Row label={t('flight.detail.rows.role')} value={flight.role ? t(`roles.${flight.role}`, { defaultValue: flight.role }) : null} {...rowProps} />
              <Row label={t('flight.detail.rows.blockOut')} value={flight.blockOut} {...rowProps} />
              <Row label={t('flight.detail.rows.blockIn')} value={flight.blockIn} {...rowProps} />
              <Row label={t('flight.detail.rows.totalTime')}
                value={flight.totalTime != null ? `${flight.totalTime.toFixed(1)} h` : null}
                {...rowProps}
              />
              <Row label={t('flight.detail.rows.nightTime')}
                value={flight.nightTime != null ? `${flight.nightTime.toFixed(1)} h` : null}
                {...rowProps}
              />
              <Row label={t('flight.detail.rows.ifrTime')}
                value={flight.ifrTime != null ? `${flight.ifrTime.toFixed(1)} h` : null}
                {...rowProps}
              />
              <Row label={t('flight.detail.rows.landingsDay')} value={flight.landingsDay} {...rowProps} />
              <Row label={t('flight.detail.rows.landingsNight')} value={flight.landingsNight} {...rowProps} />
              <Row label={t('flight.detail.rows.approaches')} value={flight.approachesCount} {...rowProps} />
              <Row label={t('flight.detail.rows.notes')} value={flight.notes} {...rowProps} />
            </>
          )}
        </View>

        {/* ── Checklists asociados ── */}
        {executions.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={{
              color: sub, fontSize: 12, fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {t('flight.detail.linkedChecklists')}
            </Text>
            {executions.map((ex) => (
              <View key={ex.id} style={{
                backgroundColor: card, borderRadius: 12,
                padding: 14, borderWidth: 1, borderColor: border,
              }}>
                <Text style={{ color: text, fontWeight: '600', fontSize: 14 }}>
                  {ex.checklistName}
                </Text>
                <Text style={{ color: sub, fontSize: 12, marginTop: 4 }}>
                  {t('flight.detail.itemsCompleted', { done: ex.results.filter(r => r.status === 'ok').length, total: ex.results.length })}
                </Text>
                {ex.completedAt && (
                  <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>
                    {t('flight.detail.completedAt', { date: new Date(ex.completedAt).toLocaleString(getNumberLocaleTag()) })}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── Equipo UAS — imagen y enlace al fabricante ── */}
        {isUAS && droneModel && (
          <DroneModelCard model={droneModel} C={droneCardColors} />
        )}

      </View>
    </ScrollView>
  );
}
