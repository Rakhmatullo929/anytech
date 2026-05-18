import { useCallback } from 'react';

import { intParam, stringParam, useUrlQueryState } from 'src/hooks/use-url-query-state';

import type { DebtStatus } from './types';

const DEBTS_URL_SCHEMA = {
  page: intParam(1),
  page_size: intParam(15),
  ordering: stringParam('-created_at'),
  status: stringParam(''),
  client_ids: stringParam(''),
  date_from: stringParam(''),
  date_to: stringParam(''),
  deadline_from: stringParam(''),
  deadline_to: stringParam(''),
  amount_from: stringParam(''),
  amount_to: stringParam(''),
} as const;

export function useDebtsUrlState() {
  const { values, setValues } = useUrlQueryState(DEBTS_URL_SCHEMA);
  const {
    page,
    page_size,
    ordering,
    status,
    client_ids,
    date_from,
    date_to,
    deadline_from,
    deadline_to,
    amount_from,
    amount_to,
  } = values;

  const activeFiltersCount = [
    status,
    client_ids,
    date_from,
    date_to,
    deadline_from,
    deadline_to,
    amount_from,
    amount_to,
  ].filter(Boolean).length;

  const setOrdering = useCallback(
    (v: string) => setValues({ ordering: v, page: 1 }),
    [setValues]
  );

  const setFilters = useCallback(
    (patch: {
      status?: string;
      clientIds?: string;
      dateFrom?: string;
      dateTo?: string;
      deadlineFrom?: string;
      deadlineTo?: string;
      amountFrom?: string;
      amountTo?: string;
    }) => {
      setValues({
        status: patch.status ?? status,
        client_ids: patch.clientIds ?? client_ids,
        date_from: patch.dateFrom ?? date_from,
        date_to: patch.dateTo ?? date_to,
        deadline_from: patch.deadlineFrom ?? deadline_from,
        deadline_to: patch.deadlineTo ?? deadline_to,
        amount_from: patch.amountFrom ?? amount_from,
        amount_to: patch.amountTo ?? amount_to,
        page: 1,
      });
    },
    [setValues, status, client_ids, date_from, date_to, deadline_from, deadline_to, amount_from, amount_to]
  );

  const resetFilters = useCallback(
    () =>
      setValues({
        status: '',
        client_ids: '',
        date_from: '',
        date_to: '',
        deadline_from: '',
        deadline_to: '',
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
    status: status as '' | DebtStatus,
    clientIds: client_ids ? client_ids.split(',') : ([] as string[]),
    dateFrom: date_from,
    dateTo: date_to,
    deadlineFrom: deadline_from,
    deadlineTo: deadline_to,
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
