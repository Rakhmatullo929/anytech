import { useMemo } from 'react';

import { useFetchList } from 'src/hooks/api';

import { fetchDebtsList } from './debts-requests';
import type { DebtListItem, FetchDebtsListParams } from './types';

export function useDebtsListQuery(params: FetchDebtsListParams) {
  const { page, pageSize, ordering, status } = params;

  const queryKey = useMemo(
    () => ['debts', 'list', { page, pageSize, ordering: ordering ?? '-created_at', status: status ?? '' }] as const,
    [page, pageSize, ordering, status]
  );

  return useFetchList<DebtListItem>(queryKey, () => fetchDebtsList(params), {
    placeholderData: (previousData) => previousData,
  });
}
