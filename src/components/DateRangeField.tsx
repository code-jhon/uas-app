import React from 'react';
import { View, Text } from 'react-native';
import { parse, isValid } from 'date-fns';
import { useTranslation } from 'react-i18next';
import DatePickerField, { type PickerColors } from './DatePickerField';
import { isValidDateRange, type DateRangeValue } from '../utils/dateTimeRange';

// Reusable "from / to" date range. The two pickers cross-constrain each other
// via minimumDate/maximumDate so the native control makes it physically
// impossible to pick a `from` later than `to`. `isValidDateRange` is the
// safety net for values that arrive by code rather than from the UI.
//
// Usage:
//   const [range, setRange] = useState<DateRangeValue>({ from: '', to: '' });
//   <DateRangeField value={range} onChange={setRange} colors={pickerColors} />

interface Props {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  colors: PickerColors;
  minimumDate?: Date;
  maximumDate?: Date;
}

function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : undefined;
}

export default function DateRangeField({
  value, onChange, colors, minimumDate, maximumDate,
}: Props) {
  const { t } = useTranslation();
  const { from, to } = value;
  const invalid = !isValidDateRange(from, to);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.sub, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
            {t('dateTimeRange.from')}
          </Text>
          <DatePickerField
            value={from}
            onChange={(v) => onChange({ from: v, to })}
            colors={colors}
            minimumDate={minimumDate}
            maximumDate={toDate(to) ?? maximumDate}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.sub, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
            {t('dateTimeRange.to')}
          </Text>
          <DatePickerField
            value={to}
            onChange={(v) => onChange({ from, to: v })}
            colors={colors}
            minimumDate={toDate(from) ?? minimumDate}
            maximumDate={maximumDate}
          />
        </View>
      </View>
      {invalid && (
        <Text style={{ color: '#ef4444', fontSize: 12 }}>
          {t('dateTimeRange.invalidDate')}
        </Text>
      )}
    </View>
  );
}
