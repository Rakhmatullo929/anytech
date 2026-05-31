import { useCallback } from 'react';

import { intParam, stringParam, useUrlQueryState } from 'src/hooks/use-url-query-state';

import type { DebtPaymentMethod } from './types';

const DEBT_PAYMENTS_URL_SCHEMA = {
  dp_page: intParam(1),
  dp_page_size: intParam(15),
  dp_ordering: stringParam('-created_at'),
  dp_customer_id: stringParam(''),
  dp_payment_method: stringParam(''),
  dp_cashier_ids: stringParam(''),
  dp_date_from: stringParam(''),
  dp_date_to: stringParam(''),
} as const;

export function useDebtPaymentsUrlState() {
  const { values, setValues } = useUrlQueryState(DEBT_PAYMENTS_URL_SCHEMA);
  const {
    dp_page,
    dp_page_size,
    dp_ordering,
    dp_customer_id,
    dp_payment_method,
    dp_cashier_ids,
    dp_date_from,
    dp_date_to,
  } = values;

  const activeFiltersCount = [
    dp_customer_id,
    dp_payment_method,
    dp_cashier_ids,
    dp_date_from,
    dp_date_to,
  ].filter(Boolean).length;

  const setOrdering = useCallback(
    (v: string) => setValues({ dp_ordering: v, dp_page: 1 }),
    [setValues]
  );

  const setFilters = useCallback(
    (patch: {
      customerId?: string;
      paymentMethod?: string;
      cashierIds?: string;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      setValues({
        dp_customer_id: patch.customerId ?? dp_customer_id,
        dp_payment_method: patch.paymentMethod ?? dp_payment_method,
        dp_cashier_ids: patch.cashierIds ?? dp_cashier_ids,
        dp_date_from: patch.dateFrom ?? dp_date_from,
        dp_date_to: patch.dateTo ?? dp_date_to,
        dp_page: 1,
      });
    },
    [setValues, dp_customer_id, dp_payment_method, dp_cashier_ids, dp_date_from, dp_date_to]
  );

  const resetFilters = useCallback(
    () =>
      setValues({
        dp_customer_id: '',
        dp_payment_method: '',
        dp_cashier_ids: '',
        dp_date_from: '',
        dp_date_to: '',
        dp_page: 1,
      }),
    [setValues]
  );

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => setValues({ dp_page: newPage + 1 }),
    [setValues]
  );

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = parseInt(e.target.value, 10);
      if (Number.isInteger(next) && next > 0) setValues({ dp_page_size: next, dp_page: 1 });
    },
    [setValues]
  );

  return {
    page: dp_page,
    rowsPerPage: dp_page_size,
    ordering: dp_ordering,
    customerId: dp_customer_id,
    paymentMethod: dp_payment_method as '' | DebtPaymentMethod,
    cashierIds: dp_cashier_ids ? dp_cashier_ids.split(',') : ([] as string[]),
    cashierIdsStr: dp_cashier_ids,
    dateFrom: dp_date_from,
    dateTo: dp_date_to,
    activeFiltersCount,
    setOrdering,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
  };
}
