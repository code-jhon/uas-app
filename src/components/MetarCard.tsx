import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Wind, Eye, Cloud, Thermometer } from 'lucide-react-native';
import { MetarData } from '../types';
import { categoryColor, categoryBg, formatAge, decodeMetar } from '../utils/metar';

interface Props {
  icao: string;
  name?: string;
  metar?: MetarData;
  loading?: boolean;
  expanded?: boolean;
  onPress: () => void;
  isDark: boolean;
}

export default function MetarCard({ icao, name, metar, loading, expanded, onPress, isDark }: Props) {
  const { t } = useTranslation();
  const card = isDark ? '#1e293b' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const isCache = metar?.rawText.startsWith('[CACHE]');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: card, borderRadius: 14, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: border,
        ...(isCache ? { opacity: 0.7 } : {}),
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <View>
          <Text style={{ color: text, fontWeight: '700', fontSize: 17 }}>{icao}</Text>
          {name && <Text style={{ color: sub, fontSize: 12 }} numberOfLines={1}>{name}</Text>}
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#38bdf8" />
        ) : metar ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isCache && <Text style={{ color: '#eab308', fontSize: 11, fontWeight: '600' }}>{t('metar.card.cache')}</Text>}
            <View style={{ backgroundColor: categoryBg(metar.flightCategory), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: categoryColor(metar.flightCategory), fontWeight: '800', fontSize: 13 }}>
                {metar.flightCategory}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {metar && (
        <>
          <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
            {metar.wind && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Wind size={13} color={sub} />
                <Text style={{ color: sub, fontSize: 13 }}>
                  {metar.wind.direction === 'VRB' ? 'VRB' : `${metar.wind.direction}°`} {metar.wind.speedKt}kt
                  {metar.wind.gustKt ? ` G${metar.wind.gustKt}` : ''}
                </Text>
              </View>
            )}
            {metar.visibilityMiles !== undefined && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Eye size={13} color={sub} />
                <Text style={{ color: sub, fontSize: 13 }}>
                  {metar.visibilityMiles >= 10 ? '≥10mi' : `${metar.visibilityMiles}mi`}
                </Text>
              </View>
            )}
            {metar.clouds.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Cloud size={13} color={sub} />
                <Text style={{ color: sub, fontSize: 13 }}>
                  {metar.clouds[0].coverage}{metar.clouds[0].baseHundredFt * 100}ft
                </Text>
              </View>
            )}
            {metar.tempC !== undefined && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Thermometer size={13} color={sub} />
                <Text style={{ color: sub, fontSize: 13 }}>{metar.tempC}°C/{metar.dewpointC}°C</Text>
              </View>
            )}
            {metar.altimeterHpa && (
              <Text style={{ color: sub, fontSize: 13 }}>Q{metar.altimeterHpa}</Text>
            )}
          </View>

          {expanded && (
            <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: border, paddingTop: 14 }}>
              {decodeMetar(metar).map((line, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <Text style={{ color: sub, fontSize: 13, width: 100 }}>{line.label}</Text>
                  <Text style={{ color: text, fontSize: 13, flex: 1 }}>{line.value}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={{ color: sub, fontSize: 11, marginTop: 8 }}>
            {formatAge(metar.observedAt)}{metar.nosig ? ' · NOSIG' : ''}
          </Text>
        </>
      )}

      {!metar && !loading && (
        <Text style={{ color: sub, fontSize: 13, marginTop: 4 }}>{t('metar.card.noData')}</Text>
      )}
    </TouchableOpacity>
  );
}
