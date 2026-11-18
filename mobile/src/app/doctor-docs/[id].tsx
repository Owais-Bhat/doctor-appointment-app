import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { openReport } from '@/lib/files';
import { useApi } from '@/lib/use-api';

type Doc = { id: string; title: string; mime_type: string; size_bytes: number };

/** Platform admin: what a doctor uploaded for verification. */
export default function DoctorDocs() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { data, loading, error, reload } = useApi<{ documents: Doc[] }>(`/api/super-admin/doctors/${id}/documents`);
  const [problem, setProblem] = useState<string | null>(null);

  return (
    <Screen>
      <Reveal>
        <Header title="Documents" subtitle={name} back />
      </Reveal>
      {problem ? <Text tone="bad" style={{ fontWeight: '600' }}>{problem}</Text> : null}
      {loading ? (
        <ListSkeleton rows={2} />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : (data?.documents.length ?? 0) === 0 ? (
        <EmptyState icon="fileText" title="No documents" body="This doctor has not uploaded anything for verification yet." />
      ) : (
        <View style={{ gap: 10 }}>
          {data?.documents.map((d) => (
            <Button key={d.id} variant="soft" icon="fileText" title={d.title} onPress={() => void openReport({ ...d, path: `/api/super-admin/documents/${d.id}` }).catch((e: unknown) => setProblem(e instanceof Error ? e.message : 'Could not open this document.'))} />
          ))}
        </View>
      )}
    </Screen>
  );
}
