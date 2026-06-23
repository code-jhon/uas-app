import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert,
  Modal, ActivityIndicator,
} from 'react-native';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, BookOpen, Trash2, ChevronRight, Plane, Cpu,
  Share2, Download, Upload, FileText, FileJson, Sheet, X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { getFlights, deleteFlight, getFlightStats, importFlights } from '../../src/db/flights';
import { exportFlights, pickAndParseFlights, ExportFormat } from '../../src/utils/flightIO';
import { getDateLocale } from '../../src/i18n/dateLocale';
import { Flight } from '../../src/types';
import { format, parseISO } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  try { return format(parseISO(d), 'd MMM yyyy', { locale: getDateLocale() }); }
  catch { return d; }
}

/** Translate a role / mission value, falling back to the stored string. */
function roleLabel(role: string, t: TFunction): string {
  return t(`roles.${role}`, { defaultValue: role });
}
function missionLabel(mission: string, t: TFunction): string {
  return t(`missions.${mission}`, { defaultValue: mission });
}

// ─── Colors ───────────────────────────────────────────────────────────────────

interface C {
  bg: string; card: string; text: string;
  sub: string; border: string;
  accent: string; accentLight: string;
  uasColor: string; uasLight: string;
}

function useC(): C {
  const isDark = useAppColorScheme() === 'dark';
  return {
    bg:          isDark ? '#0F1419' : '#F5F7FA',
    card:        isDark ? '#1E2530' : '#FFFFFF',
    text:        isDark ? '#F0F3F7' : '#0F1419',
    sub:         isDark ? '#8B98A5' : '#536471',
    border:      isDark ? '#2D3642' : '#E5E9EF',
    accent:      '#2563EB',
    accentLight: isDark ? '#1E3A5F' : '#EFF6FF',
    uasColor:    '#7C3AED',
    uasLight:    isDark ? '#2E1A4A' : '#F5F3FF',
  };
}

// ─── Flight card — defined OUTSIDE the screen to avoid remount ───────────────

interface CardProps {
  flight: Flight;
  onPress: () => void;
  onDelete: () => void;
  C: C;
}

function FlightCard({ flight: f, onPress, onDelete, C }: CardProps) {
  const { t } = useTranslation();
  const isUAS = f.flightType === 'uas';

  return (
    // Outer container is a plain View — avoids the nested-touchable problem on Android
    <View style={{
      backgroundColor: C.card,
      borderRadius: 14, borderWidth: 1, borderColor: C.border,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'stretch',
      overflow: 'hidden',
    }}>
      {/* ── Navigation area (takes all space except delete btn) ── */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1 }}>
        <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>

          {/* Type icon badge */}
          <View style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: isUAS ? C.uasLight : C.accentLight,
            justifyContent: 'center', alignItems: 'center',
          }}>
            {isUAS
              ? <Cpu size={20} color={C.uasColor} />
              : <Plane size={20} color={C.accent} />}
          </View>

          {/* Main info */}
          <View style={{ flex: 1, gap: 4 }}>

            {/* Title + type chip */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
                {isUAS ? (f.site ?? 'UAS') : `${f.originIcao} → ${f.destinationIcao}`}
              </Text>
              <View style={{
                backgroundColor: isUAS ? C.uasLight : C.accentLight,
                paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
              }}>
                <Text style={{
                  color: isUAS ? C.uasColor : C.accent,
                  fontSize: 10, fontWeight: '700',
                }}>
                  {isUAS ? t('logbook.list.typeUas') : t('logbook.list.typeManned')}
                </Text>
              </View>
            </View>

            {/* Date */}
            <Text style={{ color: C.sub, fontSize: 12 }}>
              {formatDate(f.date)}
            </Text>

            {/* Detail chips */}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              {isUAS ? (
                <>
                  {f.missionType && (
                    <Chip label={missionLabel(f.missionType, t)} C={C} />
                  )}
                  <Chip
                    label={f.vlos !== false ? 'VLOS' : 'BVLOS'}
                    color={f.vlos !== false ? '#16A34A' : '#DC2626'}
                    bgColor={f.vlos !== false
                      ? (C.bg === '#F5F7FA' ? '#F0FDF4' : '#14352A')
                      : (C.bg === '#F5F7FA' ? '#FEF2F2' : '#3D1414')}
                    C={C}
                  />
                  {f.totalTime != null && (
                    <Chip label={`${f.totalTime.toFixed(1)} h`} C={C} />
                  )}
                  {f.maxAltitudeFt != null && (
                    <Chip label={`${f.maxAltitudeFt} ft AGL`} C={C} />
                  )}
                  {f.aircraftRegistration && (
                    <Chip label={f.aircraftRegistration} C={C} />
                  )}
                </>
              ) : (
                <>
                  <Chip label={roleLabel(f.role, t)} C={C} />
                  {f.totalTime != null && (
                    <Chip label={`${f.totalTime.toFixed(1)} h`} C={C} />
                  )}
                  {f.landingsDay != null && (
                    <Chip label={t('logbook.list.landingsShort', { count: f.landingsDay })} C={C} />
                  )}
                  {f.aircraftRegistration && (
                    <Chip label={f.aircraftRegistration} C={C} />
                  )}
                </>
              )}
            </View>
          </View>

          <ChevronRight size={16} color={C.sub} />
        </View>
      </TouchableOpacity>

      {/* ── Delete button — sibling of nav area, NOT nested inside it ── */}
      <TouchableOpacity
        onPress={onDelete}
        activeOpacity={0.6}
        style={{
          width: 48,
          borderLeftWidth: 1,
          borderLeftColor: C.border,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Trash2 size={16} color="#DC2626" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ label, C, color, bgColor }: {
  label: string; C: C; color?: string; bgColor?: string;
}) {
  return (
    <View style={{
      backgroundColor: bgColor ?? C.bg,
      borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
      borderWidth: 1, borderColor: C.border,
    }}>
      <Text style={{ color: color ?? C.sub, fontSize: 11, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LogbookScreen() {
  const router = useRouter();
  const qc     = useQueryClient();
  const C      = useC();
  const { t }  = useTranslation();

  const { data: flights = [] } = useQuery({
    queryKey: ['flights'],
    queryFn: getFlights,
  });

  const { data: stats } = useQuery({
    queryKey: ['flight-stats'],
    queryFn: getFlightStats,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFlight,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flights'] });
      qc.invalidateQueries({ queryKey: ['flight-stats'] });
    },
    onError: (e) => Alert.alert(t('common.error'), (e as Error).message),
  });

  // ── Import / Export ──
  const [ioOpen, setIoOpen]   = useState(false);
  const [busy, setBusy]       = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: importFlights,
    onSuccess: ({ imported, skipped }) => {
      qc.invalidateQueries({ queryKey: ['flights'] });
      qc.invalidateQueries({ queryKey: ['flight-stats'] });
      Alert.alert(
        t('logbook.io.importDoneTitle'),
        t('logbook.io.imported', { count: imported }) +
          (skipped > 0 ? t('logbook.io.skipped', { count: skipped }) : ''),
      );
    },
    onError: (e) => Alert.alert(t('logbook.io.importError'), (e as Error).message),
  });

  const handleExport = async (fmt: ExportFormat) => {
    if (flights.length === 0) {
      Alert.alert(t('logbook.io.noDataTitle'), t('logbook.io.noDataMsg'));
      return;
    }
    setBusy(fmt);
    try {
      await exportFlights(flights, fmt);
      setIoOpen(false);
    } catch (e) {
      Alert.alert(t('logbook.io.exportError'), (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    setBusy('import');
    try {
      const parsed = await pickAndParseFlights();
      if (!parsed) return; // cancelado
      setIoOpen(false);
      if (parsed.flights.length === 0) {
        Alert.alert(t('logbook.io.emptyFileTitle'), t('logbook.io.emptyFileMsg'));
        return;
      }
      importMutation.mutate(parsed.flights);
    } catch (e) {
      Alert.alert(t('logbook.io.readError'), (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = (f: Flight) => {
    const name = f.flightType === 'uas'
      ? (f.site ?? 'UAS')
      : `${f.originIcao} → ${f.destinationIcao}`;

    Alert.alert(
      t('logbook.list.deleteTitle'),
      t('logbook.list.deleteMsg', { name, date: formatDate(f.date) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(f.id),
        },
      ]
    );
  };

  // Separate stats per type for the header
  const mannedCount = flights.filter(f => f.flightType !== 'uas').length;
  const uasCount    = flights.filter(f => f.flightType === 'uas').length;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* Header */}
      <View style={{
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <View>
          <Text style={{ color: C.text, fontSize: 22, fontWeight: '700' }}>{t('logbook.list.title')}</Text>
          {flights.length > 0 && (
            <Text style={{ color: C.sub, fontSize: 12, marginTop: 1 }}>
              {mannedCount > 0 ? t('logbook.list.manned', { count: mannedCount }) : ''}
              {mannedCount > 0 && uasCount > 0 ? ' · ' : ''}
              {uasCount > 0 ? t('logbook.list.uas', { count: uasCount }) : ''}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setIoOpen(true)}
            style={{
              width: 38, height: 38, borderRadius: 10,
              borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
              justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Share2 size={17} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/flight/new')}
            style={{
              backgroundColor: C.accent, borderRadius: 10,
              paddingHorizontal: 14, paddingVertical: 8,
              flexDirection: 'row', gap: 6, alignItems: 'center',
            }}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>{t('common.register')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={flights}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          stats && flights.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              {[
                { label: t('logbookStats.totalHours'), value: stats.totalHours.toFixed(1) },
                { label: t('logbookStats.last90Days'), value: stats.last90Days.toFixed(1) },
                { label: t('logbookStats.last12Months'), value: stats.last12Months.toFixed(1) },
              ].map((s) => (
                <View
                  key={s.label}
                  style={{
                    flex: 1, backgroundColor: C.card, borderRadius: 12,
                    padding: 10, alignItems: 'center',
                    borderWidth: 1, borderColor: C.border,
                  }}
                >
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 16 }}>
                    {s.value}
                  </Text>
                  <Text style={{ color: C.sub, fontSize: 10, textAlign: 'center', marginTop: 2 }}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item: f }) => (
          <FlightCard
            flight={f}
            onPress={() => router.push({ pathname: '/flight/[id]', params: { id: f.id } })}
            onDelete={() => handleDelete(f)}
            C={C}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 80, gap: 12 }}>
            <BookOpen size={48} color={C.sub} />
            <Text style={{ color: C.text, fontSize: 17, fontWeight: '600' }}>
              {t('logbook.list.emptyTitle')}
            </Text>
            <Text style={{ color: C.sub, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              {t('logbook.list.emptyDesc')}
            </Text>
          </View>
        }
      />

      {/* ── Modal Importar / Exportar ── */}
      <Modal
        visible={ioOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIoOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => !busy && setIoOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{
              backgroundColor: C.card,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36,
            }}>
              {/* Handle + título */}
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: C.border }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', flex: 1 }}>
                  {t('logbook.io.title')}
                </Text>
                <TouchableOpacity onPress={() => !busy && setIoOpen(false)}>
                  <X size={22} color={C.sub} />
                </TouchableOpacity>
              </View>

              {/* Exportar */}
              <Text style={{
                color: C.sub, fontSize: 11, fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
              }}>
                {t('logbook.io.exportSection')} {flights.length > 0 ? `(${flights.length})` : ''}
              </Text>

              <IoRow
                icon={<FileText size={20} color="#DC2626" />}
                label="PDF"
                desc={t('logbook.io.pdfDesc')}
                loading={busy === 'pdf'}
                disabled={!!busy}
                onPress={() => handleExport('pdf')}
                C={C}
              />
              <IoRow
                icon={<Sheet size={20} color="#16A34A" />}
                label="CSV"
                desc={t('logbook.io.csvDesc')}
                loading={busy === 'csv'}
                disabled={!!busy}
                onPress={() => handleExport('csv')}
                C={C}
              />
              <IoRow
                icon={<FileJson size={20} color={C.accent} />}
                label="JSON"
                desc={t('logbook.io.jsonDesc')}
                loading={busy === 'json'}
                disabled={!!busy}
                onPress={() => handleExport('json')}
                C={C}
              />

              {/* Importar */}
              <Text style={{
                color: C.sub, fontSize: 11, fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: 0.5,
                marginTop: 18, marginBottom: 8,
              }}>
                {t('logbook.io.importSection')}
              </Text>
              <IoRow
                icon={<Upload size={20} color={C.uasColor} />}
                label={t('logbook.io.importLabel')}
                desc={t('logbook.io.importDesc')}
                loading={busy === 'import' || importMutation.isPending}
                disabled={!!busy || importMutation.isPending}
                onPress={handleImport}
                C={C}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Import/Export row ──────────────────────────────────────────────────────

function IoRow({
  icon, label, desc, onPress, loading, disabled, C,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  C: C;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 12, paddingHorizontal: 12,
        borderRadius: 12, borderWidth: 1, borderColor: C.border,
        backgroundColor: C.bg, marginBottom: 8,
        opacity: disabled && !loading ? 0.5 : 1,
      }}
    >
      <View style={{ width: 24, alignItems: 'center' }}>
        {loading ? <ActivityIndicator size="small" color={C.accent} /> : icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: C.sub, fontSize: 12, marginTop: 1 }}>{desc}</Text>
      </View>
      <ChevronRight size={16} color={C.sub} />
    </TouchableOpacity>
  );
}
