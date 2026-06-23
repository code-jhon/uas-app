import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Platform,
} from 'react-native';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, MinusCircle, SkipForward, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { getChecklistById, startExecution, saveItemResult, completeExecution } from '../../../src/db/checklists';
import { ChecklistItem, ItemStatus } from '../../../src/types';

export default function ExecuteChecklistScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const scheme = useAppColorScheme();
  const isDark = scheme === 'dark';

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const card = isDark ? '#1e293b' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  const [sectionIdx, setSectionIdx] = useState(0);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { status: ItemStatus; note?: string }>>({});
  const [skipModal, setSkipModal] = useState<{ item: ChecklistItem } | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [completing, setCompleting] = useState(false);

  const { data: checklist } = useQuery({
    queryKey: ['checklist', id],
    queryFn: () => getChecklistById(id!),
    enabled: !!id,
  });

  // Start execution once checklist is loaded
  React.useEffect(() => {
    if (checklist && !executionId) {
      startExecution(checklist.id, checklist.name).then(setExecutionId).catch(console.error);
    }
  }, [checklist, executionId]);

  const sections = checklist?.sections ?? [];
  const currentSection = sections[sectionIdx];
  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
  const doneItems = Object.values(results).filter((r) => r.status !== 'pending').length;
  const progress = totalItems > 0 ? doneItems / totalItems : 0;

  const setResult = useCallback(async (item: ChecklistItem, status: ItemStatus, note?: string) => {
    if (!executionId) return;
    setResults((prev) => ({ ...prev, [item.id]: { status, note } }));
    await saveItemResult({ executionId, itemId: item.id, status, note });
  }, [executionId]);

  const handleSkip = (item: ChecklistItem) => {
    setSkipModal({ item });
    setSkipReason('');
  };

  const confirmSkip = () => {
    if (skipModal) {
      setResult(skipModal.item, 'skipped', skipReason || t('checklists.execute.skipReasonNone'));
      setSkipModal(null);
    }
  };

  const canClose = () => {
    if (!checklist) return false;
    for (const sec of sections) {
      for (const item of sec.items) {
        if (item.required && !results[item.id]) return false;
        if (item.required && results[item.id]?.status === 'pending') return false;
      }
    }
    return true;
  };

  const handleComplete = async () => {
    if (!executionId) return;
    if (!canClose()) {
      Alert.alert(t('checklists.execute.pendingTitle'), t('checklists.execute.pendingMsg'));
      return;
    }
    setCompleting(true);
    try {
      await completeExecution(executionId);
      qc.invalidateQueries({ queryKey: ['executions'] });
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    } finally {
      setCompleting(false);
    }
  };

  if (!checklist) return null;

  const statusColor = (status: ItemStatus | undefined) => {
    if (!status || status === 'pending') return sub;
    if (status === 'ok') return '#22c55e';
    if (status === 'na') return '#94a3b8';
    if (status === 'skipped') return '#eab308';
    return sub;
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => {
            Alert.alert(t('checklists.execute.cancelTitle'), t('checklists.execute.cancelMsg'), [
              { text: t('common.continue'), style: 'cancel' },
              { text: t('common.cancel'), style: 'destructive', onPress: () => router.back() },
            ]);
          }}>
            <X size={22} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: text, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>{name ?? checklist.name}</Text>
            <Text style={{ color: sub, fontSize: 12 }}>{t('checklists.execute.itemsProgress', { done: doneItems, total: totalItems, percent: Math.round(progress * 100) })}</Text>
          </View>
          <TouchableOpacity
            onPress={handleComplete}
            style={{ backgroundColor: canClose() ? '#0284c7' : (isDark ? '#1e293b' : '#e2e8f0'), borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ color: canClose() ? '#fff' : sub, fontWeight: '600', fontSize: 14 }}>
              {completing ? t('common.closing') : t('common.close')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={{ height: 4, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 2 }}>
          <View style={{ height: 4, width: `${Math.round(progress * 100)}%` as `${number}%`, backgroundColor: '#0284c7', borderRadius: 2 }} />
        </View>

        {/* Section nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <TouchableOpacity
            onPress={() => setSectionIdx((i) => Math.max(0, i - 1))}
            disabled={sectionIdx === 0}
            style={{ padding: 4 }}
          >
            <ChevronLeft size={20} color={sectionIdx === 0 ? border : text} />
          </TouchableOpacity>
          <Text style={{ color: text, fontWeight: '600', fontSize: 15 }}>
            {t('checklists.execute.sectionOf', { title: currentSection?.title ?? '', current: sectionIdx + 1, total: sections.length })}
          </Text>
          <TouchableOpacity
            onPress={() => setSectionIdx((i) => Math.min(sections.length - 1, i + 1))}
            disabled={sectionIdx === sections.length - 1}
            style={{ padding: 4 }}
          >
            <ChevronRight size={20} color={sectionIdx === sections.length - 1 ? border : text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Items */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {currentSection?.items.map((item) => {
          const result = results[item.id];
          const status = result?.status;
          return (
            <View
              key={item.id}
              style={{
                backgroundColor: card,
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: status === 'ok' ? '#166534' : status === 'skipped' ? '#713f12' : border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: text, fontWeight: '600', fontSize: 15, flex: 1 }}>{item.title}</Text>
                    {item.required && !status && (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' }} />
                    )}
                  </View>
                  {item.description && (
                    <Text style={{ color: sub, fontSize: 13, marginTop: 2 }}>{item.description}</Text>
                  )}
                  {status === 'skipped' && result?.note && (
                    <Text style={{ color: '#eab308', fontSize: 12, marginTop: 4 }}>{t('checklists.execute.reason', { note: result.note })}</Text>
                  )}
                </View>
              </View>

              {/* Action buttons */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <ActionBtn
                  label="OK"
                  active={status === 'ok'}
                  activeColor="#22c55e"
                  icon={<CheckCircle2 size={14} color={status === 'ok' ? '#fff' : '#22c55e'} />}
                  onPress={() => setResult(item, 'ok')}
                  isDark={isDark}
                />
                <ActionBtn
                  label={t('common.na')}
                  active={status === 'na'}
                  activeColor="#64748b"
                  icon={<MinusCircle size={14} color={status === 'na' ? '#fff' : sub} />}
                  onPress={() => setResult(item, 'na')}
                  isDark={isDark}
                />
                <ActionBtn
                  label={t('checklists.execute.skip')}
                  active={status === 'skipped'}
                  activeColor="#eab308"
                  icon={<SkipForward size={14} color={status === 'skipped' ? '#fff' : '#eab308'} />}
                  onPress={() => handleSkip(item)}
                  isDark={isDark}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Skip reason modal */}
      <Modal visible={!!skipModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
            <Text style={{ color: text, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
              {t('checklists.execute.skipModalTitle')}
            </Text>
            <Text style={{ color: sub, fontSize: 13, marginBottom: 16 }}>
              {skipModal?.item.title}
            </Text>
            <TextInput
              value={skipReason}
              onChangeText={setSkipReason}
              placeholder={t('checklists.execute.skipReasonPlaceholder')}
              placeholderTextColor={sub}
              style={{ backgroundColor: bg, borderRadius: 10, padding: 12, color: text, fontSize: 15, marginBottom: 16 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setSkipModal(null)}
                style={{ flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: border, alignItems: 'center' }}
              >
                <Text style={{ color: text, fontWeight: '600' }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmSkip}
                style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#eab308', alignItems: 'center' }}
              >
                <Text style={{ color: '#000', fontWeight: '700' }}>{t('checklists.execute.confirmSkip')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ActionBtn({
  label, active, activeColor, icon, onPress, isDark,
}: {
  label: string; active: boolean; activeColor: string;
  icon: React.ReactNode; onPress: () => void; isDark: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
        paddingVertical: 8, borderRadius: 8,
        backgroundColor: active ? activeColor : isDark ? '#0f172a' : '#f1f5f9',
        borderWidth: 1,
        borderColor: active ? activeColor : isDark ? '#334155' : '#e2e8f0',
      }}
    >
      {icon}
      <Text style={{ color: active ? '#fff' : (isDark ? '#94a3b8' : '#64748b'), fontSize: 13, fontWeight: '600' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
