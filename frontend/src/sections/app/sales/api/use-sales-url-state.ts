import { useCallback } from 'react';

import { intParam, stringParam, useUrlQueryState } from 'src/hooks/use-url-query-state';

import type { SalePaymentType } from './types';

const SALES_URL_SCHEMA = {
  page: intParam(1),
  page_size: intParam(15),
  ordering: stringParam('-created_at'),
  payment_type: stringParam(''),
  date_from: stringParam(''),
  date_to: stringParam(''),
  client_ids: stringParam(''),
  seller_ids: stringParam(''),
  amount_from: stringParam(''),
  amount_to: stringParam(''),
} as const;

export function useSalesUrlState() {
  const { values, setValues } = useUrlQueryState(SALES_URL_SCHEMA);
  const {
    page,
    page_size,
    ordering,
    payment_type,
    date_from,
    date_to,
    client_ids,
    seller_ids,
    amount_from,
    amount_to,
  } = values;

  const activeFiltersCount = [
    payment_type,
    date_from,
    date_to,
    client_ids,
    seller_ids,
    amount_from,
    amount_to,
  ].filter(Boolean).length;

  const setOrdering = useCallback(
    (v: string) => setValues({ ordering: v, page: 1 }),
    [setValues]
  );

  const setFilters = useCallback(
    (patch: {
      paymentType?: string;
      dateFrom?: string;
      dateTo?: string;
      clientIds?: string;
      sellerIds?: string;
      amountFrom?: string;
      amountTo?: string;
    }) => {
      setValues({
        payment_type: patch.paymentType ?? payment_type,
        date_from: patch.dateFrom ?? date_from,
        date_to: patch.dateTo ?? date_to,
        client_ids: patch.clientIds ?? client_ids,
        seller_ids: patch.sellerIds ?? seller_ids,
        amount_from: patch.amountFrom ?? amount_from,
        amount_to: patch.amountTo ?? amount_to,
        page: 1,
      });
    },
    [setValues, payment_type, date_from, date_to, client_ids, seller_ids, amount_from, amount_to]
  );

  const resetFilters = useCallback(
    () =>
      setValues({
        payment_type: '',
        date_from: '',
        date_to: '',
        client_ids: '',
        seller_ids: '',
        amount_from: '',
        amount_to: '',
        page: 1,
      }),
    [setValues]
  );

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => setValues({ page: newPage + 1 }),
    [setValues]
  );

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = parseInt(e.target.value, 10);
      if (Number.isInteger(next) && next > 0) setValues({ page_size: next, page: 1 });
    },
    [setValues]
  );

  return {
    page,
    rowsPerPage: page_size,
    ordering,
    paymentType: payment_type as '' | SalePaymentType,
    dateFrom: date_from,
    dateTo: date_to,
    clientIds: client_ids ? client_ids.split(',') : ([] as string[]),
    sellerIds: seller_ids ? seller_ids.split(',') : ([] as string[]),
    amountFrom: amount_from,
    amountTo: amount_to,
    activeFiltersCount,
    setOrdering,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
  };
}
