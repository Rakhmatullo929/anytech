import { useCallback, useMemo } from 'react';
import { intParam, stringParam, useUrlQueryState } from 'src/hooks/use-url-query-state';

// Stable schema object — defined outside the hook so the reference never changes.
const PRODUCTS_URL_SCHEMA = {
  page: intParam(1),
  page_size: intParam(15),
  search: stringParam(''),
  ordering: stringParam('-created_at'),
  // Comma-separated category IDs: "id1,id2,id3"
  categories: stringParam(''),
  // Quantity range — stored as strings to keep the codec simple
  min_quantity: stringParam(''),
  max_quantity: stringParam(''),
} as const;

// ----------------------------------------------------------------------

export type ProductsFilterPatch = {
  categories?: string;
  minQuantity?: string;
  maxQuantity?: string;
};

export function useProductsUrlState() {
  const { values, setValues } = useUrlQueryState(PRODUCTS_URL_SCHEMA);

  const page = values.page as number;
  const rowsPerPage = values.page_size as number;
  const search = values.search as string;
  const ordering = values.ordering as string;
  const categories = values.categories as string;
  const minQuantity = values.min_quantity as string;
  const maxQuantity = values.max_quantity as string;

  const categoryIds = useMemo(
    () => (categories ? categories.split(',').filter(Boolean) : []),
    [categories]
  );

  const activeFiltersCount = [
    categoryIds.length > 0,
    Boolean(minQuantity),
    Boolean(maxQuantity),
  ].filter(Boolean).length;

  const setSearch = useCallback(
    (s: string) =>
      setValues({ search: s, page: 1 } as Parameters<typeof setValues>[0]),
    [setValues]
  );

  const setOrdering = useCallback(
    (o: string) =>
      setValues({ ordering: o, page: 1 } as Parameters<typeof setValues>[0]),
    [setValues]
  );

  const setPage = useCallback(
    (p: number) => setValues({ page: p + 1 } as Parameters<typeof setValues>[0]),
    [setValues]
  );

  const setRowsPerPage = useCallback(
    (rpp: number) =>
      setValues({ page_size: rpp, page: 1 } as Parameters<typeof setValues>[0]),
    [setValues]
  );

  // Merge a partial filter patch — always resets page to 1.
  const setFilters = useCallback(
    (patch: ProductsFilterPatch) => {
      setValues({
        categories:
          patch.categories !== undefined ? patch.categories : categories,
        min_quantity:
          patch.minQuantity !== undefined ? patch.minQuantity : minQuantity,
        max_quantity:
          patch.maxQuantity !== undefined ? patch.maxQuantity : maxQuantity,
        page: 1,
      } as Parameters<typeof setValues>[0]);
    },
    [setValues, categories, minQuantity, maxQuantity]
  );

  const resetFilters = useCallback(
    () =>
      setValues({
        categories: '',
        min_quantity: '',
        max_quantity: '',
        page: 1,
      } as Parameters<typeof setValues>[0]),
    [setValues]
  );

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) =>
      setValues({ page: newPage + 1 } as Parameters<typeof setValues>[0]),
    [setValues]
  );

  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = parseInt(e.target.value, 10);
      if (Number.isInteger(n) && n > 0)
        setValues({ page_size: n, page: 1 } as Parameters<typeof setValues>[0]);
    },
    [setValues]
  );

  return {
    page,
    rowsPerPage,
    search,
    ordering,
    categories,
    categoryIds,
    minQuantity,
    maxQuantity,
    activeFiltersCount,
    setSearch,
    setOrdering,
    setPage,
    setRowsPerPage,
    setFilters,
    resetFilters,
    handlePageChange,
    handleRowsPerPageChange,
  };
}
