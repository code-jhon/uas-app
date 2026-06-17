import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  useColorScheme, KeyboardAvoidingView, Platform, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Plane, Cpu, MapPin, CheckCircle } from 'lucide-react-native';
import * as Location from 'expo-location';
import { createFlight } from '../../src/db/flights';
import { useQueryClient } from '@tanstack/react-query';
import { FlightRole, FlightType } from '../../src/types';
import { format } from 'date-fns';
import DatePickerField, { type PickerColors } from '../../src/components/DatePickerField';
import TimePickerField from '../../src/components/TimePickerField';
import { isValidTimeRange, minutesOfDay } from '../../src/utils/dateTimeRange';

// ─── Constants ────────────────────────────────────────────────────────────────

const MANNED_ROLES: FlightRole[] = ['PIC', 'SIC', 'dual', 'solo', 'instructor'];
const UAS_ROLES: FlightRole[] = ['operador', 'observador'];
const MISSION_TYPES = [
  'Fotografía aérea', 'Inspección', 'Topografía / Mapeo',
  'Agricultura', 'Vigilancia', 'Recreativo', 'Investigación', 'Otro',
];

// ─── Sub-components defined OUTSIDE the screen ───────────────────────────────
// Defined at module scope so React never remounts them on re-render,
// which would cause TextInput to lose focus after every keystroke.

interface FieldProps {
  label: string;
  children: React.ReactNode;
  half?: boolean;
  subColor: string;
}
function Field({ label, children, half, subColor }: FieldProps) {
  return (
    <View style={{ marginBottom: 16, ...(half ? { flex: 1 } : {}) }}>
      <Text style={{
        color: subColor, fontSize: 11, fontWeight: '600',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

interface ChipColors { accent: string; card: string; border: string; sub: string }
interface ChipGroupProps<T extends string> {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labelFn?: (v: T) => string;
  colors: ChipColors;
}
function ChipGroup<T extends string>({ options, value, onChange, labelFn, colors }: ChipGroupProps<T>) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: active ? colors.accent : colors.card,
              borderWidth: 1, borderColor: active ? colors.accent : colors.border,
            }}
          >
            <Text style={{ color: active ? '#FFFFFF' : colors.sub, fontWeight: '600', fontSize: 13 }}>
              {labelFn ? labelFn(opt) : opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface MissionChipsProps { value: string; onChange: (v: string) => void; colors: ChipColors }
function MissionChips({ value, onChange, colors }: MissionChipsProps) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {MISSION_TYPES.map((mt) => {
        const active = value === mt;
        return (
          <TouchableOpacity
            key={mt}
            onPress={() => onChange(active ? '' : mt)}
            style={{
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
              backgroundColor: active ? colors.accent : colors.card,
              borderWidth: 1, borderColor: active ? colors.accent : colors.border,
            }}
          >
            <Text style={{ color: active ? '#FFFFFF' : colors.sub, fontSize: 13, fontWeight: '500' }}>
              {t(`missions.${mt}`, { defaultValue: mt })}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NewFlightScreen() {
  const router        = useRouter();
  const { t }         = useTranslation();
  const { icao }      = useLocalSearchParams<{ icao?: string }>();
  const qc            = useQueryClient();
  const isDark        = useColorScheme() === 'dark';

  const bg     = isDark ? '#0F1419' : '#FFFFFF';
  const bgSec  = isDark ? '#1A1F26' : '#F5F7FA';
  const card   = isDark ? '#1E2530' : '#FFFFFF';
  const text   = isDark ? '#F0F3F7' : '#0F1419';
  const sub    = isDark ? '#8B98A5' : '#536471';
  const border = isDark ? '#2D3642' : '#E5E9EF';
  const accent = '#2563EB';

  const chipColors: ChipColors = { accent, card, border, sub };
  const pickerColors: PickerColors = { text, sub, card, border, accent };

  const inputStyle = {
    backgroundColor: card, borderRadius: 10,
    borderWidth: 1, borderColor: border,
    color: text, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  };

  // ── State ──
  const [flightType, setFlightType] = useState<FlightType>('manned');
  const isUAS = flightType === 'uas';

  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate]           = useState(today);
  const [blockOut, setBlockOut]   = useState('');
  const [blockIn, setBlockIn]     = useState('');
  const [totalTime, setTotalTime] = useState('');
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);

  // Manned
  const [origin, setOrigin]         = useState(icao ?? '');
  const [dest, setDest]             = useState('');
  const [registration, setReg]      = useState('');
  const [aircraftType, setAcType]   = useState('');
  const [nightTime, setNightTime]   = useState('');
  const [ifrTime, setIfrTime]       = useState('');
  const [picTime, setPicTime]       = useState('');
  const [landingsDay, setLdDay]     = useState('');
  const [landingsNight, setLdNight] = useState('');
  const [approaches, setApproaches] = useState('');
  const [role, setRole]             = useState<FlightRole>('PIC');

  // UAS
  const [site, setSite]             = useState('');
  const [droneId, setDroneId]       = useState('');
  const [droneModel, setDroneModel] = useState('');
  const [vlos, setVlos]             = useState(true);
  const [maxAlt, setMaxAlt]         = useState('');
  const [maxDist, setMaxDist]       = useState('');
  const [missionType, setMission]   = useState('');
  const [uasRole, setUasRole]       = useState<FlightRole>('operador');
  const [lat, setLat]               = useState<number | null>(null);
  const [lng, setLng]               = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [siteFromGps, setSiteFromGps] = useState(false);

  // Auto-calculate total time when both block times are set and totalTime is empty
  useEffect(() => {
    if (!blockOut || !blockIn || totalTime) return;
    // Skip auto-calc for inverted ranges (arrival before departure); save guards it.
    if (!isValidTimeRange(blockOut, blockIn)) return;
    const out = minutesOfDay(blockOut);
    const back = minutesOfDay(blockIn);
    if (isNaN(out) || isNaN(back)) return;
    const diff = back - out;
    if (diff > 0) setTotalTime(String(Math.round((diff / 60) * 10) / 10));
  }, [blockOut, blockIn]);

  // ── Captura GPS + geocodificación inversa ──
  const captureLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('flight.new.locPermTitle'),
          t('flight.new.locPermMsg'),
          [{ text: t('common.ok') }]
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = pos.coords;
      setLat(latitude);
      setLng(longitude);

      // Auto-complete zone field with reverse-geocoded address when empty
      const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
      if (mapsKey && !site.trim()) {
        try {
          const geoRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${mapsKey}&language=es&result_type=premise|route|neighborhood|locality`,
          );
          const geoJson = await geoRes.json();
          if (geoJson.status === 'OK' && geoJson.results?.length > 0) {
            setSite(geoJson.results[0].formatted_address);
            setSiteFromGps(true);
          }
        } catch {
          // silent fail — coordinates are saved, zone stays empty
        }
      }
    } catch (e) {
      Alert.alert(t('flight.new.gpsError'), (e as Error).message);
    } finally {
      setLocLoading(false);
    }
  };

  // ── Save ──
  const handleSave = async () => {
    if (!date) { Alert.alert(t('flight.new.missingTitle'), t('flight.new.missingDate')); return; }
    if (!isUAS && (!origin || !dest)) {
      Alert.alert(t('flight.new.missingTitle'), t('flight.new.missingRoute')); return;
    }
    if (isUAS && !site) {
      Alert.alert(t('flight.new.missingTitle'), t('flight.new.missingSite')); return;
    }
    if (blockOut && blockIn && !isValidTimeRange(blockOut, blockIn)) {
      Alert.alert(t('flight.new.missingTitle'), t('dateTimeRange.invalidTime')); return;
    }

    setSaving(true);
    try {
      let total = parseFloat(totalTime) || undefined;
      if (!total && blockOut && blockIn) {
        const diff = minutesOfDay(blockIn) - minutesOfDay(blockOut);
        total = Math.round((diff / 60) * 10) / 10;
      }

      if (isUAS) {
        await createFlight({
          date, flightType: 'uas',
          originIcao: site, destinationIcao: site,
          aircraftRegistration: droneId || undefined,
          site,
          lat: lat ?? undefined,
          lng: lng ?? undefined,
          blockOut: blockOut || undefined, blockIn: blockIn || undefined,
          totalTime: total, role: uasRole, vlos,
          maxAltitudeFt: parseInt(maxAlt) || undefined,
          maxDistanceM: parseInt(maxDist) || undefined,
          missionType: missionType || undefined,
          notes: [droneModel ? t('flight.new.modelPrefix', { model: droneModel }) : '', notes].filter(Boolean).join('\n') || undefined,
        });
      } else {
        await createFlight({
          date, flightType: 'manned',
          originIcao: origin.toUpperCase(), destinationIcao: dest.toUpperCase(),
          aircraftRegistration: registration || undefined,
          blockOut: blockOut || undefined, blockIn: blockIn || undefined,
          totalTime: total,
          nightTime: parseFloat(nightTime) || undefined,
          ifrTime: parseFloat(ifrTime) || undefined,
          picTime: parseFloat(picTime) || undefined,
          landingsDay: parseInt(landingsDay) || undefined,
          landingsNight: parseInt(landingsNight) || undefined,
          approachesCount: parseInt(approaches) || undefined,
          role, notes: notes || undefined,
        });
      }

      qc.invalidateQueries({ queryKey: ['flights'] });
      qc.invalidateQueries({ queryKey: ['flight-stats'] });
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={{
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={text} />
        </TouchableOpacity>
        <Text style={{ color: text, fontSize: 20, fontWeight: '700', flex: 1 }}>
          {t('flight.new.title')}
        </Text>
        <TouchableOpacity
          onPress={handleSave} disabled={saving}
          style={{
            backgroundColor: accent, borderRadius: 10,
            paddingHorizontal: 14, paddingVertical: 8,
            flexDirection: 'row', gap: 6, alignItems: 'center',
          }}
        >
          <Save size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
            {saving ? t('common.saving') : t('common.save')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>

        {/* Selector tipo de vuelo */}
        <View style={{
          flexDirection: 'row', backgroundColor: bgSec,
          borderRadius: 12, padding: 4, marginBottom: 24,
        }}>
          {([
            { type: 'manned' as FlightType, Icon: Plane, label: t('flight.new.typeManned') },
            { type: 'uas'    as FlightType, Icon: Cpu,   label: t('flight.new.typeUas') },
          ]).map(({ type, Icon, label }) => {
            const active = flightType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setFlightType(type)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  paddingVertical: 10, borderRadius: 10,
                  backgroundColor: active ? card : 'transparent',
                  ...(active ? { elevation: 2 } : {}),
                }}
              >
                <Icon size={16} color={active ? accent : sub} />
                <Text style={{ color: active ? accent : sub, fontSize: 14, fontWeight: active ? '700' : '500' }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fecha */}
        <Field label={t('flight.new.date')} subColor={sub}>
          <DatePickerField
            value={date}
            onChange={setDate}
            colors={pickerColors}
            maximumDate={new Date()}
          />
        </Field>

        {/* ── Campos tripulado ── */}
        {!isUAS && (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label={t('flight.new.origin')} half subColor={sub}>
                <TextInput
                  value={origin} onChangeText={setOrigin}
                  placeholder="SKBO" placeholderTextColor={sub}
                  autoCapitalize="characters" maxLength={4} style={inputStyle}
                />
              </Field>
              <Field label={t('flight.new.destination')} half subColor={sub}>
                <TextInput
                  value={dest} onChangeText={setDest}
                  placeholder="SKCG" placeholderTextColor={sub}
                  autoCapitalize="characters" maxLength={4} style={inputStyle}
                />
              </Field>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label={t('flight.new.registration')} half subColor={sub}>
                <TextInput
                  value={registration} onChangeText={setReg}
                  placeholder="HK-XXXX" placeholderTextColor={sub}
                  autoCapitalize="characters" style={inputStyle}
                />
              </Field>
              <Field label={t('flight.new.aircraftType')} half subColor={sub}>
                <TextInput
                  value={aircraftType} onChangeText={setAcType}
                  placeholder="C172" placeholderTextColor={sub}
                  autoCapitalize="characters" style={inputStyle}
                />
              </Field>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label={t('flight.new.blockOut')} half subColor={sub}>
                <TimePickerField value={blockOut} onChange={setBlockOut} colors={pickerColors} />
              </Field>
              <Field label={t('flight.new.blockIn')} half subColor={sub}>
                <TimePickerField value={blockIn} onChange={setBlockIn} colors={pickerColors} />
              </Field>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label={t('flight.new.totalTime')} half subColor={sub}>
                <TextInput
                  value={totalTime}
                  onChangeText={setTotalTime}
                  placeholder="1.8"
                  placeholderTextColor={sub}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </Field>
              <Field label={t('flight.new.nightTime')} half subColor={sub}>
                <TextInput
                  value={nightTime} onChangeText={setNightTime}
                  placeholder="0.0" placeholderTextColor={sub}
                  keyboardType="decimal-pad" style={inputStyle}
                />
              </Field>
              <Field label={t('flight.new.ifrTime')} half subColor={sub}>
                <TextInput
                  value={ifrTime} onChangeText={setIfrTime}
                  placeholder="0.0" placeholderTextColor={sub}
                  keyboardType="decimal-pad" style={inputStyle}
                />
              </Field>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label={t('flight.new.landingsDay')} half subColor={sub}>
                <TextInput
                  value={landingsDay} onChangeText={setLdDay}
                  placeholder="1" placeholderTextColor={sub}
                  keyboardType="number-pad" style={inputStyle}
                />
              </Field>
              <Field label={t('flight.new.landingsNight')} half subColor={sub}>
                <TextInput
                  value={landingsNight} onChangeText={setLdNight}
                  placeholder="0" placeholderTextColor={sub}
                  keyboardType="number-pad" style={inputStyle}
                />
              </Field>
              <Field label={t('flight.new.approaches')} half subColor={sub}>
                <TextInput
                  value={approaches} onChangeText={setApproaches}
                  placeholder="0" placeholderTextColor={sub}
                  keyboardType="number-pad" style={inputStyle}
                />
              </Field>
            </View>

            <Field label={t('flight.new.role')} subColor={sub}>
              <ChipGroup
                options={MANNED_ROLES} value={role}
                onChange={setRole} colors={chipColors}
                labelFn={(r) => t(`roles.${r}`)}
              />
            </Field>
          </>
        )}

        {/* ── Campos UAS ── */}
        {isUAS && (
          <>
            <Field label={t('flight.new.site')} subColor={sub}>
              <TextInput
                value={site}
                onChangeText={(v) => { setSite(v); if (siteFromGps) setSiteFromGps(false); }}
                placeholder={t('flight.new.sitePlaceholder')}
                placeholderTextColor={sub} style={inputStyle}
              />
              {siteFromGps && (
                <Text style={{ color: '#16A34A', fontSize: 11, marginTop: 4, marginLeft: 2 }}>
                  {t('flight.new.geoFilled')}
                </Text>
              )}
            </Field>

            {/* Captura GPS */}
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity
                onPress={captureLocation}
                disabled={locLoading}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, borderRadius: 10, paddingVertical: 12,
                  borderWidth: 1.5,
                  borderColor: lat !== null ? '#16A34A' : accent,
                  backgroundColor: lat !== null
                    ? (isDark ? '#14352A' : '#F0FDF4')
                    : (isDark ? '#1E3A5F' : '#EFF6FF'),
                }}
              >
                {locLoading ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : lat !== null ? (
                  <CheckCircle size={18} color="#16A34A" />
                ) : (
                  <MapPin size={18} color={accent} />
                )}
                <Text style={{
                  fontSize: 14, fontWeight: '600',
                  color: lat !== null ? '#16A34A' : accent,
                }}>
                  {locLoading
                    ? t('flight.new.gpsCapturing')
                    : lat !== null
                      ? t('flight.new.gpsCaptured', { lat: lat.toFixed(5), lng: lng!.toFixed(5) })
                      : t('flight.new.gpsCapture')}
                </Text>
              </TouchableOpacity>
              {lat !== null && (
                <TouchableOpacity
                  onPress={() => { setLat(null); setLng(null); setSiteFromGps(false); }}
                  style={{ alignSelf: 'center', marginTop: 6 }}
                >
                  <Text style={{ color: sub, fontSize: 12 }}>{t('flight.new.gpsClear')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label={t('flight.new.droneId')} half subColor={sub}>
                <TextInput
                  value={droneId} onChangeText={setDroneId}
                  placeholder="COL-XXXX" placeholderTextColor={sub}
                  autoCapitalize="characters" style={inputStyle}
                />
              </Field>
              <Field label={t('flight.new.droneModel')} half subColor={sub}>
                <TextInput
                  value={droneModel} onChangeText={setDroneModel}
                  placeholder="DJI Mavic 3" placeholderTextColor={sub}
                  style={inputStyle}
                />
              </Field>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label={t('flight.new.opStart')} half subColor={sub}>
                <TimePickerField value={blockOut} onChange={setBlockOut} colors={pickerColors} />
              </Field>
              <Field label={t('flight.new.opEnd')} half subColor={sub}>
                <TimePickerField value={blockIn} onChange={setBlockIn} colors={pickerColors} />
              </Field>
            </View>

            <Field label={t('flight.new.totalTimeUas')} subColor={sub}>
              <TextInput
                value={totalTime} onChangeText={setTotalTime}
                placeholder="1.5" placeholderTextColor={sub}
                keyboardType="decimal-pad" style={inputStyle}
              />
            </Field>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label={t('flight.new.maxAlt')} half subColor={sub}>
                <TextInput
                  value={maxAlt} onChangeText={setMaxAlt}
                  placeholder="400" placeholderTextColor={sub}
                  keyboardType="number-pad" style={inputStyle}
                />
              </Field>
              <Field label={t('flight.new.maxDist')} half subColor={sub}>
                <TextInput
                  value={maxDist} onChangeText={setMaxDist}
                  placeholder="500" placeholderTextColor={sub}
                  keyboardType="number-pad" style={inputStyle}
                />
              </Field>
            </View>

            {/* VLOS */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: card, borderRadius: 10, borderWidth: 1, borderColor: border,
              paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: text, fontSize: 15, fontWeight: '500' }}>
                  {t('flight.new.vlosTitle')}
                </Text>
                <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>
                  {t('flight.new.vlosDesc')}
                </Text>
              </View>
              <Switch
                value={vlos} onValueChange={setVlos}
                trackColor={{ false: border, true: accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Tipo de misión */}
            <Field label={t('flight.new.missionType')} subColor={sub}>
              <MissionChips value={missionType} onChange={setMission} colors={chipColors} />
            </Field>

            <Field label={t('flight.new.role')} subColor={sub}>
              <ChipGroup
                options={UAS_ROLES} value={uasRole}
                onChange={setUasRole} colors={chipColors}
                labelFn={(r) => t(`roles.${r}`)}
              />
            </Field>
          </>
        )}

        {/* Notas */}
        <Field label={t('flight.new.notes')} subColor={sub}>
          <TextInput
            value={notes} onChangeText={setNotes}
            placeholder={
              isUAS
                ? t('flight.new.notesPlaceholderUas')
                : t('flight.new.notesPlaceholderManned')
            }
            placeholderTextColor={sub}
            multiline numberOfLines={3}
            style={{ ...inputStyle, minHeight: 80, textAlignVertical: 'top' }}
          />
        </Field>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
