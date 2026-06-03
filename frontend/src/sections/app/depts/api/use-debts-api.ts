import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useFetch, useFetchList, useFetchOne, useMutate } from 'src/hooks/api';
import type { Pagination } from 'src/hooks/api';

import {
  exportCustomerDebtSummaryExcel,
  exportDebtPaymentsExcel,
  exportDebtsExcel,
  fetchCustomerDebtStats,
  fetchCustomerDebtSummary,
  fetchDebtDetail,
  fetchDebtPaymentsList,
  fetchDebtsList,
  payDebt,
} from './debts-requests';
import type {
  CustomerDebtStats,
  CustomerDebtSummary,
  DebtDetail,
  DebtListItem,
  DebtPaymentHistoryItem,
  ExportCustomerDebtSummaryParams,
  ExportDebtPaymentsParams,
  ExportDebtsParams,
  FetchCustomerDebtSummaryParams,
  FetchDebtPaymentsParams,
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

export function useDebtPaymentsListQuery(params: FetchDebtPaymentsParams) {
  const { page, pageSize, ordering, customerId, paymentMethod, cashierIds, dateFrom, dateTo } =
    params;

  const queryKey = useMemo(
    () =>
      [
        'debt-payments',
        'list',
        {
          page,
          pageSize,
          ordering: ordering ?? '-created_at',
          customerId: customerId ?? '',
          paymentMethod: paymentMethod ?? '',
          cashierIds: cashierIds ?? '',
          dateFrom: dateFrom ?? '',
          dateTo: dateTo ?? '',
        },
      ] as const,
    [page, pageSize, ordering, customerId, paymentMethod, cashierIds, dateFrom, dateTo]
  );

  return useFetchList<DebtPaymentHistoryItem>(queryKey, () => fetchDebtPaymentsList(params), {
    placeholderData: (previousData) => previousData,
  });
}

export function useExportDebtPaymentsMutation() {
  return useMutate<void, ExportDebtPaymentsParams>(exportDebtPaymentsExcel);
}

export function useCustomerDebtSummaryQuery(params: FetchCustomerDebtSummaryParams) {
  const { page, pageSize, ordering, search, dateFrom, dateTo, amountFrom, amountTo } = params;

  const queryKey = useMemo(
    () =>
      [
        'customer-debt-summary',
        'list',
        {
          page,
          pageSize,
          ordering: ordering ?? '-last_debt_date',
          search: search ?? '',
          dateFrom: dateFrom ?? '',
          dateTo: dateTo ?? '',
          amountFrom: amountFrom ?? '',
          amountTo: amountTo ?? '',
        },
      ] as const,
    [page, pageSize, ordering, search, dateFrom, dateTo, amountFrom, amountTo]
  );

  return useFetch<Pagination<CustomerDebtSummary>>(queryKey, () => fetchCustomerDebtSummary(params), {
    placeholderData: (previousData) => previousData,
  });
}

export function useCustomerDebtStatsQuery() {
  const queryKey = useMemo(() => ['customer-debt-summary', 'stats'] as const, []);
  return useFetchOne<CustomerDebtStats>(queryKey, fetchCustomerDebtStats);
}

export function useExportCustomerDebtSummaryMutation() {
  return useMutate<void, ExportCustomerDebtSummaryParams>(exportCustomerDebtSummaryExcel);
}
