import { useMemo } from 'react';

import { useFetchList } from 'src/hooks/api';

import { fetchClientsList } from './clients-requests';
import type { ClientListItem, FetchClientsListParams } from './types';

export function useClientsListQuery(params: FetchClientsListParams) {
  const { page, pageSize, search, ordering } = params;

  const queryKey = useMemo(
    () => ['clients', 'list', { page, pageSize, search: search ?? '', ordering: ordering ?? '-created_at' }] as const,
    [page, pageSize, search, ordering]
  );

  return useFetchList<ClientListItem>(queryKey, () => fetchClientsList(params));
}
