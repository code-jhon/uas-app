import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  RefreshControl,
} from 'react-native';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Star, StarOff, X } from 'lucide-react-native';
import { fetchMetar } from '../../src/api/awc';
import { useFavoritesStore } from '../../src/store/favoritesStore';
import MetarCard from '../../src/components/MetarCard';
import { COLOMBIA_AIRPORTS } from '../../src/data/airports';

export default function MetarScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const scheme = useAppColorScheme();
  const isDark = scheme === 'dark';
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavoritesStore();

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const card = isDark ? '#1e293b' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const inputBg = isDark ? '#1e293b' : '#ffffff';

  // Show suggestions when user is typing something different from last search
  const suggestions = query.length >= 2 && query.toUpperCase() !== submitted
    ? COLOMBIA_AIRPORTS.filter((a) =>
        a.icao.startsWith(query.toUpperCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const { data: metar, isFetching, error, refetch } = useQuery({
    queryKey: ['metar', submitted],
    queryFn: () => fetchMetar(submitted),
    enabled: submitted.length === 4,
    retry: 0,
  });

  const handleSearch = useCallback((icao: string) => {
    const code = icao.toUpperCase().trim();
    if (code.length !== 4) return;
    Keyboard.dismiss();
    setQuery(code);
    setSubmitted(code);
  }, []);

  const handleSubmitEditing = () => {
    // If query matches exactly one suggestion, use that airport
    if (suggestions.length === 1) {
      handleSearch(suggestions[0].icao);
      return;
    }
    handleSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setSubmitted('');
  };

  const toggleFavorite = () => {
    if (!metar) return;
    if (isFavorite(metar.icao)) {
      removeFavorite(metar.icao);
    } else {
      const airport = COLOMBIA_AIRPORTS.find((a) => a.icao === metar.icao);
      addFavorite({
        icao: metar.icao,
        name: airport?.name ?? metar.icao,
        country: airport?.country ?? '',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ color: text, fontSize: 22, fontWeight: '700', marginBottom: 16 }}>METAR</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: inputBg, borderRadius: 10,
            borderWidth: 1, borderColor: border, paddingHorizontal: 12,
          }}>
            <Search size={16} color={sub} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmitEditing}
              placeholder={t('metar.search.placeholder')}
              placeholderTextColor={sub}
              autoCapitalize="characters"
              returnKeyType="search"
              style={{ flex: 1, color: text, fontSize: 15, paddingVertical: 12, marginLeft: 8 }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={sub} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={handleSubmitEditing}
            style={{ backgroundColor: '#0284c7', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>{t('common.search')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <View style={{
          marginHorizontal: 20, backgroundColor: card,
          borderRadius: 10, borderWidth: 1, borderColor: border, marginBottom: 8,
          zIndex: 10,
        }}>
          {suggestions.map((a, idx) => (
            <TouchableOpacity
              key={a.icao}
              onPress={() => handleSearch(a.icao)}
              style={{
                padding: 12,
                borderBottomWidth: idx < suggestions.length - 1 ? 1 : 0,
                borderBottomColor: border,
              }}
            >
              <Text style={{ color: text, fontWeight: '600' }}>{a.icao}</Text>
              <Text style={{ color: sub, fontSize: 12 }}>{a.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            enabled={submitted.length === 4}
            tintColor={text}
          />
        }
      >
        {/* Loading */}
        {isFetching && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator color="#38bdf8" />
            <Text style={{ color: sub, marginTop: 8 }}>{t('metar.search.fetching')}</Text>
          </View>
        )}

        {/* Error */}
        {error && !isFetching && (
          <View style={{ backgroundColor: '#7f1d1d', borderRadius: 12, padding: 16, marginTop: 16 }}>
            <Text style={{ color: '#fca5a5', fontWeight: '600' }}>{t('metar.search.errorTitle')}</Text>
            <Text style={{ color: '#fca5a5', fontSize: 13, marginTop: 4 }}>
              {(error as Error).message}
            </Text>
          </View>
        )}

        {/* Result */}
        {metar && !isFetching && (
          <View style={{ marginTop: 16 }}>
            <MetarCard
              icao={metar.icao}
              name={COLOMBIA_AIRPORTS.find((a) => a.icao === metar.icao)?.name}
              metar={metar}
              loading={false}
              expanded
              onPress={() => router.push({ pathname: '/metar/[icao]', params: { icao: metar.icao } })}
              isDark={isDark}
            />
            <TouchableOpacity
              onPress={toggleFavorite}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, justifyContent: 'center' }}
            >
              {isFavorite(metar.icao) ? (
                <>
                  <StarOff size={16} color="#eab308" />
                  <Text style={{ color: '#eab308', fontWeight: '600' }}>{t('metar.search.removeFavorite')}</Text>
                </>
              ) : (
                <>
                  <Star size={16} color="#94a3b8" />
                  <Text style={{ color: sub, fontWeight: '600' }}>{t('metar.search.addFavorite')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Favorites list — shown when no active search */}
        {!submitted && (
          <View style={{ marginTop: 8 }}>
            <Text style={{
              color: sub, fontSize: 13, fontWeight: '600', marginBottom: 10,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {t('metar.search.favorites')}
            </Text>
            {favorites.length === 0 && (
              <Text style={{ color: sub, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                {t('metar.search.noFavoritesHint')}
              </Text>
            )}
            {favorites.map((fav) => (
              <TouchableOpacity
                key={fav.icao}
                onPress={() => handleSearch(fav.icao)}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: card, borderRadius: 10, padding: 14,
                  marginBottom: 8, borderWidth: 1, borderColor: border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: text, fontWeight: '700', fontSize: 15 }}>{fav.icao}</Text>
                  <Text style={{ color: sub, fontSize: 12 }}>{fav.name}</Text>
                </View>
                <Search size={16} color={sub} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
