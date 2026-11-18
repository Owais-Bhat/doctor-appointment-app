import { useCallback, useState } from 'react';

import { api } from './api';
import { useApi } from './use-api';

/**
 * The patient's starred doctors. A tap shows at once and is undone if the
 * server refuses, so the heart never feels slow.
 */
export function useFavorites() {
  const { data, refresh } = useApi<{ doctorIds: string[] }>('/api/patient/favorites');
  const [tapped, setTapped] = useState<Record<string, boolean>>({});

  const isFavorite = useCallback((id: string) => (id in tapped ? tapped[id] : (data?.doctorIds.includes(id) ?? false)), [tapped, data]);

  const toggle = useCallback(
    async (id: string) => {
      const next = !isFavorite(id);
      setTapped((t) => ({ ...t, [id]: next }));
      try {
        await api('/api/patient/favorites', { method: next ? 'POST' : 'DELETE', body: { doctorId: id } });
      } catch {
        setTapped((t) => ({ ...t, [id]: !next }));
      }
    },
    [isFavorite],
  );

  return { isFavorite, toggle, refresh };
}
