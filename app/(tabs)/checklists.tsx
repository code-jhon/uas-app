import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Copy, Trash2, Play, ChevronRight, ClipboardList } from 'lucide-react-native';
import { getChecklists, deleteChecklist, cloneTemplate } from '../../src/db/checklists';
import { Checklist } from '../../src/types';

export default function ChecklistsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const scheme = useAppColorScheme();
  const isDark = scheme === 'dark';
  const qc = useQueryClient();

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const card = isDark ? '#1e293b' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const sub = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => getChecklists(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChecklist,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists'] }),
  });

  const cloneMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => cloneTemplate(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists'] }),
  });

  const templates = checklists.filter((c) => c.isTemplate);
  const custom = checklists.filter((c) => !c.isTemplate);

  const handleClone = (cl: Checklist) => {
    cloneMutation.mutate({ id: cl.id, name: t('checklists.list.copySuffix', { name: cl.name }) });
  };

  const handleDelete = (cl: Checklist) => {
    Alert.alert(t('checklists.list.deleteTitle'), t('checklists.list.deleteMsg', { name: cl.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(cl.id) },
    ]);
  };

  const handleStart = (cl: Checklist) => {
    router.push({ pathname: '/checklist/[id]/execute', params: { id: cl.id, name: cl.name } });
  };

  const renderItem = ({ item }: { item: Checklist }) => (
    <View style={{ backgroundColor: card, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: border, overflow: 'hidden' }}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/checklist/[id]', params: { id: item.id } })}
        style={{ padding: 14 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              {item.isTemplate && (
                <View style={{ backgroundColor: '#1e3a5f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: '#38bdf8', fontSize: 10, fontWeight: '700' }}>{t('checklists.list.template')}</Text>
                </View>
              )}
              <Text style={{ color: text, fontWeight: '600', fontSize: 15, flexShrink: 1 }}>{item.name}</Text>
            </View>
            {item.description && (
              <Text style={{ color: sub, fontSize: 12 }} numberOfLines={1}>{item.description}</Text>
            )}
            <Text style={{ color: sub, fontSize: 12, marginTop: 4 }}>
              {t('checklists.list.itemsSections', { items: item.sections.reduce((n, s) => n + s.items.length, 0), sections: item.sections.length })}
            </Text>
          </View>
          <ChevronRight size={16} color={sub} />
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: border }}>
        <TouchableOpacity
          onPress={() => handleStart(item)}
          style={{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 }}
        >
          <Play size={14} color="#38bdf8" />
          <Text style={{ color: '#38bdf8', fontWeight: '600', fontSize: 13 }}>{t('checklists.list.execute')}</Text>
        </TouchableOpacity>
        <View style={{ width: 1, backgroundColor: border }} />
        <TouchableOpacity
          onPress={() => handleClone(item)}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 }}
        >
          <Copy size={14} color={sub} />
          <Text style={{ color: sub, fontWeight: '500', fontSize: 13 }}>{t('checklists.list.clone')}</Text>
        </TouchableOpacity>
        {!item.isTemplate && (
          <>
            <View style={{ width: 1, backgroundColor: border }} />
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 }}
            >
              <Trash2 size={14} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontWeight: '500', fontSize: 13 }}>{t('checklists.list.delete')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: text, fontSize: 22, fontWeight: '700' }}>{t('checklists.list.title')}</Text>
        <TouchableOpacity
          onPress={() => router.push('/checklist/new')}
          style={{ backgroundColor: '#0284c7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center' }}
        >
          <Plus size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('common.new')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...templates, ...custom]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        ListHeaderComponent={
          <>
            {templates.length > 0 && (
              <Text style={{ color: sub, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                {t('checklists.list.templates')}
              </Text>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <>
            {index === templates.length && custom.length > 0 && (
              <Text style={{ color: sub, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 }}>
                {t('checklists.list.mine')}
              </Text>
            )}
            {renderItem({ item })}
          </>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <ClipboardList size={40} color={sub} />
            <Text style={{ color: sub, marginTop: 12, fontSize: 15 }}>{t('checklists.list.empty')}</Text>
          </View>
        }
      />
    </View>
  );
}
