import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import TimePickerField from './TimePickerField';
import type { PickerColors } from './DatePickerField';
import { isValidTimeRange, type TimeRangeValue } from '../utils/dateTimeRange';

// Reusable "start / end" time range. The native time picker can't reliably
// enforce min/max, so the range is validated by logic + inline feedback on
// every change. The component never propagates an inverted range silently:
// invalid input is shown to the user and `isValidTimeRange` is the guard any
// consumer (e.g. the flight form) re-checks before saving.
//
// Usage:
//   const [range, setRange] = useState<TimeRangeValue>({ start: '', end: '' });
//   <TimeRangeField value={range} onChange={setRange} colors={pickerColors} />

interface Props {
  value: TimeRangeValue;
  onChange: (v: TimeRangeValue) => void;
  colors: PickerColors;
}

export default function TimeRangeField({ value, onChange, colors }: Props) {
  const { t } = useTranslation();
  const { start, end } = value;
  const invalid = !isValidTimeRange(start, end);

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.sub, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
            {t('dateTimeRange.start')}
          </Text>
          <TimePickerField
            value={start}
            onChange={(v) => onChange({ start: v, end })}
            colors={colors}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.sub, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
            {t('dateTimeRange.end')}
          </Text>
          <TimePickerField
            value={end}
            onChange={(v) => onChange({ start, end: v })}
            colors={colors}
          />
        </View>
      </View>
      {invalid && (
        <Text style={{ color: '#ef4444', fontSize: 12 }}>
          {t('dateTimeRange.invalidTime')}
        </Text>
      )}
    </View>
  );
}
