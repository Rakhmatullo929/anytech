import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useFetchList, useFetchOne, useMutate } from 'src/hooks/api';

import { exportDebtsExcel, fetchDebtDetail, fetchDebtsList, payDebt } from './debts-requests';
import type {
  DebtDetail,
  DebtListItem,
  ExportDebtsParams,
  FetchDebtsListParams,
  PayDebtPayload,
} from './types';

export function useDebtsListQuery(params: FetchDebtsListParams) {
  const {
    page,
    pageSize,
    ordering,
    status,
    clientIds,
    dateFrom,
    dateTo,
    deadlineFrom,
    deadlineTo,
    amountFrom,
    amountTo,
  } = params;

  const queryKey = useMemo(
    () => [
      'debts',
      'list',
      {
        page,
        pageSize,
        ordering: ordering ?? '-created_at',
        status: status ?? '',
        clientIds: clientIds ?? '',
        dateFrom: dateFrom ?? '',
        dateTo: dateTo ?? '',
        deadlineFrom: deadlineFrom ?? '',
        deadlineTo: deadlineTo ?? '',
        amountFrom: amountFrom ?? '',
        amountTo: amountTo ?? '',
      },
    ] as const,
    [page, pageSize, ordering, status, clientIds, dateFrom, dateTo, deadlineFrom, deadlineTo, amountFrom, amountTo]
  );

  return useFetchList<DebtListItem>(queryKey, () => fetchDebtsList(params), {
    placeholderData: (previousData) => previousData,
  });
}

export function useDebtDetailQuery(id: string) {
  const queryKey = useMemo(() => ['debts', 'detail', id] as const, [id]);
  return useFetchOne<DebtDetail>(queryKey, () => fetchDebtDetail(id));
}

export function usePayDebtMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutate<DebtDetail, PayDebtPayload>((payload) => payDebt(id, payload), {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['debts', 'list'] });
    },
  });
}

export function useExportDebtsMutation() {
  return useMutate<void, ExportDebtsParams>(exportDebtsExcel);
}
