import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  User, CreditCard, ChevronDown, Lock, Eye, EyeOff,
  PlaneTakeoff, ArrowRight, Check,
} from 'lucide-react-native';
import { useAuthStore, LicenseType } from '../../src/store/authStore';

const LICENSE_TYPES: LicenseType[] = ['Estudiante', 'PPL', 'CPL', 'ATPL', 'Instructor'];

const C = {
  bg: '#0c1a2e',
  surface: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  accent: '#0284c7',
  accentLight: '#38bdf8',
  text: '#f1f5f9',
  sub: '#94a3b8',
  muted: '#475569',
  error: '#ef4444',
  success: '#22c55e',
};

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { saveProfile } = useAuthStore();

  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseType, setLicenseType] = useState<LicenseType>('PPL');
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'profile' | 'pin'>('profile');

  const pinRef = useRef<TextInput>(null);
  const pinConfirmRef = useRef<TextInput>(null);

  const nameError = name.trim().length > 0 && name.trim().length < 2;
  const pinMismatch = pinEnabled && pinConfirm.length === 4 && pin !== pinConfirm;
  const pinValid = !pinEnabled || (pin.length === 4 && pin === pinConfirm);
  const canProceedProfile = name.trim().length >= 2;
  const canSubmit = canProceedProfile && pinValid;

  const handleNext = () => {
    if (!canProceedProfile) {
      Alert.alert(t('auth.signup.nameRequiredTitle'), t('auth.signup.nameRequiredMsg'));
      return;
    }
    if (pinEnabled) {
      setStep('pin');
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await saveProfile(
        { name: name.trim(), licenseNumber: licenseNumber.trim() || undefined, licenseType },
        pinEnabled && pin.length === 4 ? pin : undefined
      );
      router.replace('/(tabs)');
    } catch {
      Alert.alert(t('common.error'), t('auth.signup.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <PlaneTakeoff size={30} color="#fff" />
          </View>
          <Text style={{ color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.3 }}>
            {step === 'profile' ? t('auth.signup.titleProfile') : t('auth.signup.titlePin')}
          </Text>
          <Text style={{ color: C.sub, fontSize: 14, marginTop: 6, textAlign: 'center' }}>
            {step === 'profile'
              ? t('auth.signup.subtitleProfile')
              : t('auth.signup.subtitlePin')}
          </Text>
        </View>

        {/* Step indicator */}
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 36 }}>
          {['profile', 'pin'].map((s, i) => (
            <View
              key={s}
              style={{
                height: 4, flex: 1, borderRadius: 2,
                backgroundColor: step === s || (s === 'profile') ? C.accent : C.border,
                opacity: s === 'pin' && !pinEnabled ? 0.3 : 1,
              }}
            />
          ))}
        </View>

        {step === 'profile' ? (
          <View style={{ gap: 20 }}>
            {/* Name */}
            <Field label={t('auth.signup.fullName')} required>
              <InputRow
                icon={<User size={16} color={C.sub} />}
                value={name}
                onChangeText={setName}
                placeholder={t('auth.signup.namePlaceholder')}
                autoCapitalize="words"
                error={nameError}
              />
              {nameError && <FieldError text={t('auth.signup.nameError')} />}
            </Field>

            {/* License type */}
            <Field label={t('auth.signup.licenseType')}>
              <TouchableOpacity
                onPress={() => setLicenseOpen((v) => !v)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: C.card, borderRadius: 12, padding: 14,
                  borderWidth: 1, borderColor: C.border,
                }}
              >
                <CreditCard size={16} color={C.sub} />
                <Text style={{ color: C.text, fontSize: 15, flex: 1 }}>{t(`licenses.${licenseType}`)}</Text>
                <ChevronDown size={16} color={C.sub} style={{ transform: [{ rotate: licenseOpen ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {licenseOpen && (
                <View style={{ backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginTop: 4, overflow: 'hidden' }}>
                  {LICENSE_TYPES.map((type, i) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => { setLicenseType(type); setLicenseOpen(false); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        paddingHorizontal: 16, paddingVertical: 13,
                        borderBottomWidth: i < LICENSE_TYPES.length - 1 ? 1 : 0,
                        borderBottomColor: C.border,
                        backgroundColor: type === licenseType ? '#0f2744' : 'transparent',
                      }}
                    >
                      <Text style={{ color: type === licenseType ? C.accentLight : C.text, fontSize: 15 }}>{t(`licenses.${type}`)}</Text>
                      {type === licenseType && <Check size={14} color={C.accentLight} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Field>

            {/* License number */}
            <Field label={t('auth.signup.licenseNumber')} hint={t('common.optional')}>
              <InputRow
                icon={<CreditCard size={16} color={C.sub} />}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder={t('auth.signup.licenseNumberPlaceholder')}
                autoCapitalize="characters"
              />
            </Field>

            {/* PIN toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <Lock size={16} color={C.sub} />
                <View>
                  <Text style={{ color: C.text, fontWeight: '600', fontSize: 15 }}>{t('auth.signup.pinTitle')}</Text>
                  <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{t('auth.signup.pinDesc')}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setPinEnabled((v) => !v)}
                style={{
                  width: 48, height: 28, borderRadius: 14,
                  backgroundColor: pinEnabled ? C.accent : C.border,
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                }}
              >
                <View style={{
                  width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
                  alignSelf: pinEnabled ? 'flex-end' : 'flex-start',
                }} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleNext}
              disabled={!canProceedProfile}
              style={{
                backgroundColor: canProceedProfile ? C.accent : C.border,
                borderRadius: 14, paddingVertical: 16,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                marginTop: 8,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: canProceedProfile ? '#fff' : C.muted, fontWeight: '700', fontSize: 16 }}>
                {pinEnabled ? t('auth.signup.next') : t('auth.signup.createProfile')}
              </Text>
              <ArrowRight size={18} color={canProceedProfile ? '#fff' : C.muted} />
            </TouchableOpacity>
          </View>
        ) : (
          /* PIN step */
          <View style={{ gap: 20 }}>
            <Field label={t('auth.signup.pin4')} required>
              <InputRow
                ref={pinRef}
                icon={<Lock size={16} color={C.sub} />}
                value={pin}
                onChangeText={(v) => {
                  if (/^\d{0,4}$/.test(v)) {
                    setPin(v);
                    if (v.length === 4) pinConfirmRef.current?.focus();
                  }
                }}
                placeholder="••••"
                keyboardType="number-pad"
                secureTextEntry={!showPin}
                maxLength={4}
                right={
                  <TouchableOpacity onPress={() => setShowPin((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    {showPin ? <EyeOff size={16} color={C.sub} /> : <Eye size={16} color={C.sub} />}
                  </TouchableOpacity>
                }
              />
            </Field>

            <Field label={t('auth.signup.confirmPin')} required>
              <InputRow
                ref={pinConfirmRef}
                icon={<Lock size={16} color={C.sub} />}
                value={pinConfirm}
                onChangeText={(v) => { if (/^\d{0,4}$/.test(v)) setPinConfirm(v); }}
                placeholder="••••"
                keyboardType="number-pad"
                secureTextEntry={!showPin}
                maxLength={4}
                error={pinMismatch}
              />
              {pinMismatch && <FieldError text={t('auth.signup.pinMismatch')} />}
            </Field>

            <View style={{ gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || pin.length < 4 || pin !== pinConfirm}
                style={{
                  backgroundColor: pin.length === 4 && pin === pinConfirm ? C.accent : C.border,
                  borderRadius: 14, paddingVertical: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: pin.length === 4 && pin === pinConfirm ? '#fff' : C.muted, fontWeight: '700', fontSize: 16 }}>
                  {saving ? t('common.saving') : t('auth.signup.createWithPin')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setPinEnabled(false); handleSave(); }}
                style={{ paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: C.sub, fontSize: 14 }}>{t('auth.signup.continueNoPin')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Text style={{ color: C.sub, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Text>
        {required && <Text style={{ color: C.error, fontSize: 12 }}>*</Text>}
        {hint && <Text style={{ color: C.muted, fontSize: 12 }}>({hint})</Text>}
      </View>
      {children}
    </View>
  );
}

const InputRow = React.forwardRef<TextInput, {
  icon?: React.ReactNode; value: string; onChangeText: (v: string) => void;
  placeholder?: string; autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  secureTextEntry?: boolean; maxLength?: number;
  error?: boolean; right?: React.ReactNode;
}>(({ icon, right, error, ...props }, ref) => (
  <View style={{
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: error ? C.error : C.border,
  }}>
    {icon}
    <TextInput
      ref={ref}
      {...props}
      placeholderTextColor={C.muted}
      style={{ flex: 1, color: C.text, fontSize: 15, paddingVertical: 14 }}
    />
    {right}
  </View>
));
InputRow.displayName = 'InputRow';

function FieldError({ text }: { text: string }) {
  return (
    <Text style={{ color: C.error, fontSize: 12, marginTop: 4, marginLeft: 4 }}>{text}</Text>
  );
}
