import { useMemo } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

import { deleteFromList, type Pagination, updateList, useFetchList, useFetchOne, useMutate } from 'src/hooks/api';

import {
  bulkDeleteProducts,
  createProduct,
  deleteProduct,
  fetchCategoriesList,
  fetchProductDetail,
  fetchProductsList,
  updateProduct,
} from './products-requests';
import type {
  CategoryListItem,
  CreateProductPayload,
  FetchProductsListParams,
  ProductDetail,
  ProductListItem,
  UpdateProductPayload,
} from './types';

type ProductsListKeyParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
};

function getProductsListKeyParams(queryKey: QueryKey): ProductsListKeyParams {
  const maybeParams = Array.isArray(queryKey) ? queryKey[2] : undefined;
  if (!maybeParams || typeof maybeParams !== 'object') {
    return {};
  }
  const params = maybeParams as Record<string, unknown>;
  return {
    page: typeof params.page === 'number' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'number' ? params.pageSize : undefined,
    search: typeof params.search === 'string' ? params.search : undefined,
    ordering: typeof params.ordering === 'string' ? params.ordering : undefined,
  };
}

export function useProductsListQuery(params: FetchProductsListParams) {
  const { page, pageSize, search, ordering } = params;

  const queryKey = useMemo(
    () =>
      ['products', 'list', { page, pageSize, search: search ?? '', ordering: ordering ?? '-created_at' }] as const,
    [page, pageSize, search, ordering]
  );

  return useFetchList<ProductListItem>(queryKey, () => fetchProductsList(params), {
    placeholderData: (previousData) => previousData,
  });
}

export function useProductDetailQuery(id: string) {
  const queryKey = useMemo(() => ['products', 'detail', id] as const, [id]);

  return useFetchOne<ProductDetail>(queryKey, () => fetchProductDetail(id), {
    enabled: Boolean(id),
  });
}

export function useCategoriesListQuery() {
  const queryKey = useMemo(() => ['categories', 'list'] as const, []);
  return useFetchList<CategoryListItem>(queryKey, fetchCategoriesList);
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutate<ProductListItem, CreateProductPayload>(createProduct, {
    onSuccess: (createdProduct) => {
      const cachedLists = queryClient.getQueriesData<Pagination<ProductListItem> | undefined>({
        queryKey: ['products', 'list'],
      });

      cachedLists.forEach(([queryKey, cachedPage]) => {
        if (!cachedPage) return;

        const { page = 1, pageSize = cachedPage.results.length, search = '', ordering = '-created_at' } =
          getProductsListKeyParams(queryKey);

        const shouldInsertIntoCurrentPage = page === 1 && ordering === '-created_at' && search.trim() === '';
        if (!shouldInsertIntoCurrentPage) return;

        const nextResults = [createdProduct, ...cachedPage.results];
        const trimmedResults = nextResults.slice(0, Math.max(1, pageSize));

        queryClient.setQueryData<Pagination<ProductListItem>>(queryKey, {
          ...cachedPage,
          count: cachedPage.count + 1,
          results: trimmedResults,
        });
      });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutate<ProductListItem, UpdateProductPayload>(updateProduct, {
    onSuccess: (updatedProduct) => {
      queryClient.setQueriesData<Pagination<ProductListItem> | undefined>(
        { queryKey: ['products', 'list'] },
        updateList(updatedProduct)
      );
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutate<void, string>(deleteProduct, {
    onSuccess: (_, deletedProductId) => {
      queryClient.setQueriesData<Pagination<ProductListItem> | undefined>(
        { queryKey: ['products', 'list'] },
        deleteFromList(deletedProductId)
      );
    },
  });
}

export function useBulkDeleteProductsMutation() {
  const queryClient = useQueryClient();

  return useMutate<void, string[]>(bulkDeleteProducts, {
    onSuccess: (_, deletedIds) => {
      queryClient.setQueriesData<Pagination<ProductListItem> | undefined>(
        { queryKey: ['products', 'list'] },
        (old) => {
          if (!old) return old;
          const deletedSet = new Set(deletedIds);
          const nextResults = old.results.filter((row) => !deletedSet.has(String(row.id)));
          return {
            ...old,
            results: nextResults,
            count: Math.max(0, old.count - (old.results.length - nextResults.length)),
          };
        }
      );
    },
  });
}
