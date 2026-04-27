import { useMemo } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

import { deleteFromList, type Pagination, updateList, useFetchList, useMutate } from 'src/hooks/api';

import { bulkDeleteCategories, createCategory, deleteCategory, fetchCategoriesList, updateCategory } from './categories-requests';
import type {
  CategoryListItem,
  CreateCategoryPayload,
  FetchCategoriesListParams,
  UpdateCategoryPayload,
} from './types';

type CategoriesListKeyParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
};

function getCategoriesListKeyParams(queryKey: QueryKey): CategoriesListKeyParams {
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

export function useCategoriesListQuery(params: FetchCategoriesListParams) {
  const { page, pageSize, search, ordering } = params;

  const queryKey = useMemo(
    () =>
      [
        'categories',
        'list',
        { page, pageSize, search: search ?? '', ordering: ordering ?? '-created_at' },
      ] as const,
    [page, pageSize, search, ordering]
  );

  return useFetchList<CategoryListItem>(queryKey, () => fetchCategoriesList(params), {
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutate<CategoryListItem, CreateCategoryPayload>(createCategory, {
    onSuccess: (createdCategory) => {
      const cachedLists = queryClient.getQueriesData<Pagination<CategoryListItem> | undefined>({
        queryKey: ['categories', 'list'],
      });

      cachedLists.forEach(([queryKey, cachedPage]) => {
        if (!cachedPage) return;

        const { page = 1, pageSize = cachedPage.results.length, search = '', ordering = '-created_at' } =
          getCategoriesListKeyParams(queryKey);

        const shouldInsertIntoCurrentPage = page === 1 && ordering === '-created_at' && search.trim() === '';
        if (!shouldInsertIntoCurrentPage) return;

        const nextResults = [createdCategory, ...cachedPage.results];
        const trimmedResults = nextResults.slice(0, Math.max(1, pageSize));

        queryClient.setQueryData<Pagination<CategoryListItem>>(queryKey, {
          ...cachedPage,
          count: cachedPage.count + 1,
          results: trimmedResults,
        });
      });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutate<CategoryListItem, UpdateCategoryPayload>(updateCategory, {
    onSuccess: (updatedCategory) => {
      queryClient.setQueriesData<Pagination<CategoryListItem> | undefined>(
        { queryKey: ['categories', 'list'] },
        updateList(updatedCategory)
      );
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutate<void, string>(deleteCategory, {
    onSuccess: (_, deletedCategoryId) => {
      queryClient.setQueriesData<Pagination<CategoryListItem> | undefined>(
        { queryKey: ['categories', 'list'] },
        deleteFromList(deletedCategoryId)
      );
    },
  });
}

export function useBulkDeleteCategoriesMutation() {
  const queryClient = useQueryClient();

  return useMutate<void, string[]>(bulkDeleteCategories, {
    onSuccess: (_, deletedIds) => {
      queryClient.setQueriesData<Pagination<CategoryListItem> | undefined>(
        { queryKey: ['categories', 'list'] },
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
