import { useCallback } from 'react';

import { intParam, stringParam, useUrlQueryState } from 'src/hooks/use-url-query-state';

// cd_ prefix avoids collisions with debts (page/ordering) and dp_ (payments) URL params
const CUSTOMER_DEBTS_URL_SCHEMA = {
  cd_page: intParam(1),
  cd_page_size: intParam(15),
  cd_ordering: stringParam('-last_debt_date'),
  cd_search: stringParam(''),
  cd_date_from: stringParam(''),
  cd_date_to: stringParam(''),
  cd_amount_from: stringParam(''),
  cd_amount_to: stringParam(''),
} as const;

export function useCustomerDebtsUrlState() {
  const { values, setValues } = useUrlQueryState(CUSTOMER_DEBTS_URL_SCHEMA);
  const {
    cd_page,
    cd_page_size,
    cd_ordering,
    cd_search,
    cd_date_from,
    cd_date_to,
    cd_amount_from,
    cd_amount_to,
  } = values;

  const activeFiltersCount = [
    cd_search,
    cd_date_from,
    cd_date_to,
    cd_amount_from,
    cd_amount_to,
  ].filter(Boolean).length;

  const setOrdering = useCallback(
    (v: string) => setValues({ cd_ordering: v, cd_page: 1 }),
    [setValues]
  );

  const setFilters = useCallback(
    (patch: {
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      amountFrom?: string;
      amountTo?: string;
    }) => {
      setValues({
        cd_search: patch.search ?? cd_search,
        cd_date_from: patch.dateFrom ?? cd_date_from,
        cd_date_to: patch.dateTo ?? cd_date_to,
        cd_amount_from: patch.amountFrom ?? cd_amount_from,
        cd_amount_to: patch.amountTo ?? cd_amount_to,
        cd_page: 1,
      });
    },
    [setValues, cd_search, cd_date_from, cd_date_to, cd_amount_from, cd_amount_to]
  );

  const resetFilters = useCallback(
    () =>
      setValues({
        cd_search: '',
        cd_date_from: '',
        cd_date_to: '',
        cd_amount_from: '',
        cd_amount_to: '',
        cd_page: 1,
      }),
    [setValues]
  );

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => setValues({ cd_page: newPage + 1 }),
    [setValues]
  );

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = parseInt(e.target.value, 10);
      if (Number.isInteger(next) && next > 0) setValues({ cd_page_size: next, cd_page: 1 });
    },
    [setValues]
  );

  return {
    page: cd_page,
    rowsPerPage: cd_page_size,
    ordering: cd_ordering,
    search: cd_search,
    dateFrom: cd_date_from,
    dateTo: cd_date_to,
    amountFrom: cd_amount_from,
    amountTo: cd_amount_to,
    activeFiltersCount,
    setOrdering,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
  };
}
