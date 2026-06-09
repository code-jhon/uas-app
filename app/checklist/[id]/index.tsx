import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, CheckSquare } from 'lucide-react-native';
import { getChecklistById } from '../../../src/db/checklists';

export default function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const card = isDark ? '#1e293b' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  const { data: checklist } = useQuery({
    queryKey: ['checklist', id],
    queryFn: () => getChecklistById(id!),
    enabled: !!id,
  });

  if (!checklist) return null;

  const totalItems = checklist.sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: text, fontSize: 18, fontWeight: '700' }} numberOfLines={2}>{checklist.name}</Text>
          <Text style={{ color: sub, fontSize: 12 }}>{t('checklists.detail.itemsSections', { items: totalItems, sections: checklist.sections.length })}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/checklist/[id]/execute', params: { id: checklist.id, name: checklist.name } })}
          style={{ backgroundColor: '#0284c7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center' }}
        >
          <Play size={14} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600' }}>{t('checklists.detail.execute')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {checklist.description && (
          <Text style={{ color: sub, fontSize: 13, marginBottom: 20 }}>{checklist.description}</Text>
        )}
        {checklist.sections.map((sec, si) => (
          <View key={sec.id} style={{ marginBottom: 20 }}>
            <Text style={{ color: text, fontWeight: '700', fontSize: 15, marginBottom: 10 }}>
              {si + 1}. {sec.title}
            </Text>
            <View style={{ backgroundColor: card, borderRadius: 12, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
              {sec.items.map((item, ii) => (
                <View
                  key={item.id}
                  style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: ii < sec.items.length - 1 ? 1 : 0, borderBottomColor: border, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}
                >
                  <CheckSquare size={16} color={sub} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: text, fontSize: 14 }}>{item.title}</Text>
                    {item.description && (
                      <Text style={{ color: sub, fontSize: 12, marginTop: 2 }}>{item.description}</Text>
                    )}
                    {item.required && (
                      <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{t('checklists.detail.required')}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
