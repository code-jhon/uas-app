import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Platform, } from 'react-native';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parse, isValid } from 'date-fns';
import { Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../i18n/dateLocale';

export interface PickerColors {
  text: string;
  sub: string;
  card: string;
  border: string;
  accent: string;
}

interface Props {
  value: string;           // "yyyy-MM-dd"
  onChange: (v: string) => void;
  colors: PickerColors;
  maximumDate?: Date;
  minimumDate?: Date;
}

export default function DatePickerField({ value, onChange, colors, maximumDate, minimumDate }: Props) {
  const { t } = useTranslation();
  const isDark = useAppColorScheme() === 'dark';
  const [open, setOpen] = useState(false);

  const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : new Date();
  const dateObj = isValid(parsed) ? parsed : new Date();
  const display = value ? format(dateObj, 'd MMM yyyy', { locale: getDateLocale() }) : '—';

  const handleChange = (_evt: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (selected) onChange(format(selected, 'yyyy-MM-dd'));
  };

  const picker = (
    <DateTimePicker
      value={dateObj}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={handleChange}
      themeVariant={isDark ? 'dark' : 'light'}
      maximumDate={maximumDate}
      minimumDate={minimumDate}
      {...(Platform.OS === 'ios' ? { style: { height: 200 } } : {})}
    />
  );

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={{
          backgroundColor: colors.card, borderRadius: 10,
          borderWidth: 1, borderColor: colors.border,
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 14, paddingVertical: 12, gap: 10,
        }}
      >
        <Calendar size={16} color={colors.accent} />
        <Text style={{ color: value ? colors.text : colors.sub, fontSize: 15, flex: 1 }}>
          {display}
        </Text>
      </TouchableOpacity>

      {open && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" onRequestClose={() => setOpen(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setOpen(false)} />
              <View style={{
                backgroundColor: colors.card,
                borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34,
              }}>
                <View style={{
                  flexDirection: 'row', justifyContent: 'flex-end',
                  paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
                }}>
                  <TouchableOpacity
                    onPress={() => setOpen(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 16, right: 8 }}
                  >
                    <Text style={{ color: colors.accent, fontSize: 17, fontWeight: '600' }}>
                      {t('common.confirm')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {picker}
              </View>
            </View>
          </Modal>
        ) : (
          picker
        )
      )}
    </>
  );
}
