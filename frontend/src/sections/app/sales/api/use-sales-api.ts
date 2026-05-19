import { useMemo } from 'react';

import { useFetchList, useFetchOne, useMutate } from 'src/hooks/api';

import { exportSalesExcel, fetchSaleDetail, fetchSalesList } from './sales-requests';
import type { ExportSalesParams, FetchSalesListParams, SaleDetail, SaleListItem } from './types';

export function useSalesListQuery(params: FetchSalesListParams) {
  const { page, pageSize, ordering, paymentType, clientIds, sellerIds, dateFrom, dateTo, amountFrom, amountTo } = params;

  const queryKey = useMemo(
    () => [
      'sales',
      'list',
      {
        page, pageSize,
        ordering: ordering ?? '-created_at',
        paymentType: paymentType ?? '',
        clientIds: clientIds ?? '',
        sellerIds: sellerIds ?? '',
        dateFrom: dateFrom ?? '',
        dateTo: dateTo ?? '',
        amountFrom: amountFrom ?? '',
        amountTo: amountTo ?? '',
      },
    ] as const,
    [page, pageSize, ordering, paymentType, clientIds, sellerIds, dateFrom, dateTo, amountFrom, amountTo]
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

export function useExportSalesMutation() {
  return useMutate<void, ExportSalesParams>(exportSalesExcel);
}
