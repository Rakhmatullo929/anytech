import { useMemo } from 'react';

import { useFetchList } from 'src/hooks/api';

import { fetchGroupsList } from './groups-requests';
import type { FetchGroupsListParams, GroupListItem } from './types';

export function useGroupsListQuery(params: FetchGroupsListParams) {
  const { page, pageSize, search, ordering } = params;

  const queryKey = useMemo(
    () => ['clients-groups', 'list', { page, pageSize, search: search ?? '', ordering: ordering ?? '-created_at' }] as const,
    [page, pageSize, search, ordering]
  );

  return useFetchList<GroupListItem>(queryKey, () => fetchGroupsList(params), {
    placeholderData: (previousData) => previousData,
  });
}
