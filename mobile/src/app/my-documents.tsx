import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { api } from '@/lib/api';
import { openReport, pickPdf, pickPhoto, uploadDoctorDocument, type Picked } from '@/lib/files';
import { useApi } from '@/lib/use-api';

type Doc = { id: string; title: string; mime_type: string; size_bytes: number };

/** Doctor: verification documents (registration certificate, degree). Only an admin can open them. */
export default function MyDocuments() {
  const docs = useApi<{ documents: Doc[] }>('/api/doctor/documents');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(key: string, fn: () => Promise<unknown>, ok?: string) {
    setBusy(key);
    setMessage(null);
    try {
      await fn();
      if (ok) setMessage({ ok: true, text: ok });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong.' });
    } finally {
      setBusy(null);
    }
  }

  const add = (pick: () => Promise<Picked | null>, key: string) =>
    run(
      key,
      async () => {
        const file = await pick();
        if (!file) return;
        await uploadDoctorDocument(file, title);
        setTitle('');
        await docs.refresh();
      },
      undefined,
    );

  return (
    <Screen onRefresh={() => void docs.refresh()} refreshing={docs.refreshing}>
      <Reveal>
        <Header title="Verification documents" back />
      </Reveal>
      <Reveal index={1}>
        <GlassCard padding={18}>
          <View style={{ gap: 14 }}>
            <Text tone="ink2">Upload your medical registration certificate and degree so an admin can verify you. Photos or PDFs up to 3 MB; only admins can open them.</Text>
            <Field label="Name (optional)" icon="fileText" value={title} onChangeText={setTitle} placeholder="e.g. Registration certificate" maxLength={120} />
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Button size="sm" icon="plus" title="Photo" loading={busy === 'photo'} disabled={!!busy} onPress={() => void add(() => pickPhoto(false), 'photo')} />
              <Button size="sm" variant="soft" icon="sparkles" title="Camera" loading={busy === 'camera'} disabled={!!busy} onPress={() => void add(() => pickPhoto(true), 'camera')} />
              <Button size="sm" variant="soft" icon="fileText" title="PDF" loading={busy === 'pdf'} disabled={!!busy} onPress={() => void add(pickPdf, 'pdf')} />
            </View>
          </View>
        </GlassCard>
      </Reveal>
      {message ? <Text tone={message.ok ? 'good' : 'bad'} style={{ fontWeight: '600' }}>{message.text}</Text> : null}
      {docs.loading ? (
        <ListSkeleton rows={2} />
      ) : docs.error ? (
        <ErrorNote message={docs.error} onRetry={docs.reload} />
      ) : (docs.data?.documents.length ?? 0) === 0 ? (
        <EmptyState icon="fileText" title="Nothing uploaded yet" body="Add your registration certificate to get verified faster." />
      ) : (
        <View style={{ gap: 10 }}>
          {docs.data?.documents.map((d) => (
            <GlassCard key={d.id} padding={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                  {d.title}
                </Text>
                <Button size="sm" variant="soft" title="Open" disabled={!!busy} onPress={() => void run(`open-${d.id}`, () => openReport({ ...d, path: `/api/doctor/documents/${d.id}` }))} />
                <Button size="sm" variant="danger" icon="trash" title="Delete" disabled={!!busy} onPress={() => void run(`del-${d.id}`, async () => { await api(`/api/doctor/documents/${d.id}`, { method: 'DELETE' }); await docs.refresh(); })} />
              </View>
            </GlassCard>
          ))}
        </View>
      )}
    </Screen>
  );
}
