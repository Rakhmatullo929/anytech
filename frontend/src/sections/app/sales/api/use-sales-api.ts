import { useMemo } from 'react';

import { useFetchList, useFetchOne } from 'src/hooks/api';

import { fetchSaleDetail, fetchSalesList } from './sales-requests';
import type { FetchSalesListParams, SaleDetail, SaleListItem } from './types';

export function useSalesListQuery(params: FetchSalesListParams) {
  const { page, pageSize, ordering, paymentType } = params;

  const queryKey = useMemo(
    () => ['sales', 'list', { page, pageSize, ordering: ordering ?? '-created_at', paymentType: paymentType ?? '' }] as const,
    [page, pageSize, ordering, paymentType]
  );

  return useFetchList<SaleListItem>(queryKey, () => fetchSalesList(params), {
    placeholderData: (previousData) => previousData,
  });
}

export function useSaleDetailQuery(id: string) {
  const queryKey = useMemo(() => ['sales', 'detail', id] as const, [id]);

  return useFetchOne<SaleDetail>(queryKey, () => fetchSaleDetail(id), {
    enabled: Boolean(id),
  });
}
