import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  useColorScheme, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react-native';
import { createChecklist } from '../../src/db/checklists';
import { useQueryClient } from '@tanstack/react-query';

interface SectionDraft {
  title: string;
  items: Array<{ title: string; required: boolean }>;
}

export default function NewChecklistScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const card = isDark ? '#1e293b' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const inputStyle = {
    backgroundColor: bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: border,
    color: text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  };

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<SectionDraft[]>([
    { title: t('checklists.new.defaultSection', { n: 1 }), items: [{ title: '', required: true }] },
  ]);
  const [saving, setSaving] = useState(false);

  const addSection = () => {
    setSections((prev) => [...prev, { title: t('checklists.new.defaultSection', { n: prev.length + 1 }), items: [{ title: '', required: true }] }]);
  };

  const removeSection = (si: number) => {
    setSections((prev) => prev.filter((_, i) => i !== si));
  };

  const updateSectionTitle = (si: number, title: string) => {
    setSections((prev) => prev.map((s, i) => i === si ? { ...s, title } : s));
  };

  const addItem = (si: number) => {
    setSections((prev) => prev.map((s, i) => i === si ? { ...s, items: [...s.items, { title: '', required: true }] } : s));
  };

  const removeItem = (si: number, ii: number) => {
    setSections((prev) => prev.map((s, i) => i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s));
  };

  const updateItemTitle = (si: number, ii: number, title: string) => {
    setSections((prev) => prev.map((s, i) => i === si ? {
      ...s,
      items: s.items.map((item, j) => j === ii ? { ...item, title } : item),
    } : s));
  };

  const toggleRequired = (si: number, ii: number) => {
    setSections((prev) => prev.map((s, i) => i === si ? {
      ...s,
      items: s.items.map((item, j) => j === ii ? { ...item, required: !item.required } : item),
    } : s));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('checklists.new.noNameTitle'), t('checklists.new.noNameMsg'));
      return;
    }
    const hasItems = sections.some((s) => s.items.some((i) => i.title.trim()));
    if (!hasItems) {
      Alert.alert(t('checklists.new.noItemsTitle'), t('checklists.new.noItemsMsg'));
      return;
    }
    setSaving(true);
    try {
      await createChecklist(
        name.trim(),
        description.trim() || undefined,
        sections.map((s) => ({
          title: s.title.trim() || t('checklists.new.sectionFallback'),
          items: s.items.filter((i) => i.title.trim()).map((i) => ({ title: i.title.trim(), required: i.required })),
        })).filter((s) => s.items.length > 0)
      );
      qc.invalidateQueries({ queryKey: ['checklists'] });
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
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={text} />
        </TouchableOpacity>
        <Text style={{ color: text, fontSize: 20, fontWeight: '700', flex: 1 }}>{t('checklists.new.title')}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ backgroundColor: '#0284c7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center' }}
        >
          <Save size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>{saving ? t('common.saving') : t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: sub, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>{t('checklists.new.name')}</Text>
          <TextInput value={name} onChangeText={setName} placeholder={t('checklists.new.namePlaceholder')} placeholderTextColor={sub} style={inputStyle} />
        </View>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: sub, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>{t('checklists.new.description')}</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder={t('checklists.new.descriptionPlaceholder')} placeholderTextColor={sub} style={inputStyle} />
        </View>

        {sections.map((sec, si) => (
          <View key={si} style={{ backgroundColor: card, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TextInput
                value={sec.title}
                onChangeText={(v) => updateSectionTitle(si, v)}
                placeholder={t('checklists.new.sectionPlaceholder')}
                placeholderTextColor={sub}
                style={{ flex: 1, color: text, fontSize: 15, fontWeight: '600' }}
              />
              {sections.length > 1 && (
                <TouchableOpacity onPress={() => removeSection(si)}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            {sec.items.map((item, ii) => (
              <View key={ii} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TextInput
                  value={item.title}
                  onChangeText={(v) => updateItemTitle(si, ii, v)}
                  placeholder={t('checklists.new.itemPlaceholder')}
                  placeholderTextColor={sub}
                  style={{ flex: 1, ...inputStyle }}
                />
                <TouchableOpacity
                  onPress={() => toggleRequired(si, ii)}
                  style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, backgroundColor: item.required ? '#0284c7' : (isDark ? '#1e293b' : '#f1f5f9') }}
                >
                  <Text style={{ color: item.required ? '#fff' : sub, fontSize: 11, fontWeight: '600' }}>{t('checklists.new.reqShort')}</Text>
                </TouchableOpacity>
                {sec.items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(si, ii)}>
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              onPress={() => addItem(si)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}
            >
              <Plus size={14} color="#38bdf8" />
              <Text style={{ color: '#38bdf8', fontSize: 14 }}>{t('checklists.new.addItem')}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={addSection}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: border, borderStyle: 'dashed' }}
        >
          <Plus size={16} color={sub} />
          <Text style={{ color: sub, fontWeight: '600' }}>{t('checklists.new.addSection')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
