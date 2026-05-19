import { useCallback, useMemo } from 'react';

import { intParam, stringParam, useUrlQueryState } from 'src/hooks/use-url-query-state';

const CLIENTS_URL_SCHEMA = {
  page: intParam(1),
  page_size: intParam(15),
  search: stringParam(''),
  ordering: stringParam('-created_at'),
  gender: stringParam(''),
  group_ids: stringParam(''),
} as const;

export function useClientsUrlState() {
  const { values, setValues } = useUrlQueryState(CLIENTS_URL_SCHEMA);
  const { page, page_size, search, ordering, gender, group_ids } = values;

  const groupIds = useMemo(
    () => (group_ids ? group_ids.split(',').filter(Boolean) : []),
    [group_ids]
  );

  const activeFiltersCount = [gender, group_ids].filter(Boolean).length;

  const setSearch = useCallback(
    (v: string) => setValues({ search: v, page: 1 }),
    [setValues]
  );

  const setOrdering = useCallback(
    (v: string) => setValues({ ordering: v, page: 1 }),
    [setValues]
  );

  const setFilters = useCallback(
    (patch: { gender?: string; groupIds?: string }) => {
      setValues({
        gender: patch.gender ?? gender,
        group_ids: patch.groupIds ?? group_ids,
        page: 1,
      });
    },
    [setValues, gender, group_ids]
  );

  const resetFilters = useCallback(
    () => setValues({ gender: '', group_ids: '', page: 1 }),
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
    search,
    ordering,
    gender,
    groupIds,
    activeFiltersCount,
    setSearch,
    setOrdering,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
    setValues,
  };
}
