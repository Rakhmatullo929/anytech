import { useMemo } from 'react';

import { useFetchList, useFetchOne } from 'src/hooks/api';

import { fetchClientDetail, fetchClientsList } from './clients-requests';
import type { ClientDetail, ClientListItem, FetchClientsListParams } from './types';

export function useClientsListQuery(params: FetchClientsListParams) {
  const { page, pageSize, search, ordering } = params;

  const queryKey = useMemo(
    () => ['clients', 'list', { page, pageSize, search: search ?? '', ordering: ordering ?? '-created_at' }] as const,
    [page, pageSize, search, ordering]
  );

  return useFetchList<ClientListItem>(queryKey, () => fetchClientsList(params));
}

export function useClientDetailQuery(id: string) {
  const queryKey = useMemo(() => ['clients', 'detail', id] as const, [id]);

  return useFetchOne<ClientDetail>(queryKey, () => fetchClientDetail(id), {
    enabled: Boolean(id),
  });
}
