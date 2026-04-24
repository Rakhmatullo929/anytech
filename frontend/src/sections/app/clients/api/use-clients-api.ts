import { useMemo } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

import {
  deleteFromList,
  type Pagination,
  updateList,
  updateObject,
  useFetchList,
  useFetchOne,
  useMutate,
} from 'src/hooks/api';

import {
  bulkDeleteClients,
  bulkCreateClientsFromExcel,
  createClient,
  deleteClient,
  fetchClientDetail,
  fetchClientsList,
  updateClient,
} from './clients-requests';
import type {
  ClientDetail,
  ClientListItem,
  CreateClientPayload,
  FetchClientsListParams,
  BulkCreateClientsResult,
  UpdateClientPayload,
} from './types';

type ClientsListKeyParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  groupId?: string;
};

function getClientsListKeyParams(queryKey: QueryKey): ClientsListKeyParams {
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
    groupId: typeof params.groupId === 'string' ? params.groupId : undefined,
  };
}

export function useClientsListQuery(params: FetchClientsListParams) {
  const { page, pageSize, search, ordering, groupId } = params;

  const queryKey = useMemo(
    () =>
      [
        'clients',
        'list',
        { page, pageSize, search: search ?? '', ordering: ordering ?? '-created_at', groupId: groupId ?? '' },
      ] as const,
    [page, pageSize, search, ordering, groupId]
  );

  return useFetchList<ClientListItem>(queryKey, () => fetchClientsList(params), {
    // Keep previous page data while new search params are loading
    // so list UI doesn't unmount (search input keeps focus).
    placeholderData: (previousData) => previousData,
  });
}

export function useClientDetailQuery(id: string) {
  const queryKey = useMemo(() => ['clients', 'detail', id] as const, [id]);

  return useFetchOne<ClientDetail>(queryKey, () => fetchClientDetail(id), {
    enabled: Boolean(id),
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();

  return useMutate<ClientListItem, CreateClientPayload>(createClient, {
    onSuccess: (createdClient) => {
      const cachedLists = queryClient.getQueriesData<Pagination<ClientListItem> | undefined>({
        queryKey: ['clients', 'list'],
      });

      cachedLists.forEach(([queryKey, cachedPage]) => {
        if (!cachedPage) return;

        const { page = 1, pageSize = cachedPage.results.length, search = '', ordering = '-created_at', groupId = '' } =
          getClientsListKeyParams(queryKey);

        // New entity should only appear immediately on the first page of default ordering without active search.
        const shouldInsertIntoCurrentPage =
          page === 1 && ordering === '-created_at' && search.trim() === '' && groupId.trim() === '';
        if (!shouldInsertIntoCurrentPage) return;

        const nextResults = [createdClient, ...cachedPage.results];
        const trimmedResults = nextResults.slice(0, Math.max(1, pageSize));

        queryClient.setQueryData<Pagination<ClientListItem>>(queryKey, {
          ...cachedPage,
          count: cachedPage.count + 1,
          results: trimmedResults,
        });
      });
    },
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();

  return useMutate<void, string>(deleteClient, {
    onSuccess: (_, deletedClientId) => {
      queryClient.setQueriesData<Pagination<ClientListItem> | undefined>(
        { queryKey: ['clients', 'list'] },
        deleteFromList(deletedClientId)
      );
    },
  });
}

export function useBulkDeleteClientsMutation() {
  const queryClient = useQueryClient();

  return useMutate<void, string[]>(
    bulkDeleteClients,
    {
      onSuccess: (_, deletedIds) => {
        queryClient.setQueriesData<Pagination<ClientListItem> | undefined>(
          { queryKey: ['clients', 'list'] },
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
    }
  );
}

export function useBulkCreateClientsMutation() {
  const queryClient = useQueryClient();

  return useMutate<BulkCreateClientsResult, File>(bulkCreateClientsFromExcel, {
    onSuccess: (result) => {
      const createdClients = result.results ?? [];
      if (!createdClients.length) return;

      const cachedLists = queryClient.getQueriesData<Pagination<ClientListItem> | undefined>({
        queryKey: ['clients', 'list'],
      });

      cachedLists.forEach(([queryKey, cachedPage]) => {
        if (!cachedPage) return;

        const { page = 1, pageSize = cachedPage.results.length, search = '', ordering = '-created_at', groupId = '' } =
          getClientsListKeyParams(queryKey);

        const shouldInsertIntoCurrentPage =
          page === 1 && ordering === '-created_at' && search.trim() === '' && groupId.trim() === '';
        if (!shouldInsertIntoCurrentPage) return;

        const nextResults = [...createdClients, ...cachedPage.results];
        const trimmedResults = nextResults.slice(0, Math.max(1, pageSize));

        queryClient.setQueryData<Pagination<ClientListItem>>(queryKey, {
          ...cachedPage,
          count: cachedPage.count + createdClients.length,
          results: trimmedResults,
        });
      });
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();

  return useMutate<ClientListItem, UpdateClientPayload>(updateClient, {
    onSuccess: (updatedClient) => {
      queryClient.setQueriesData<Pagination<ClientListItem> | undefined>(
        { queryKey: ['clients', 'list'] },
        updateList(updatedClient)
      );
      queryClient.setQueryData<ClientDetail | undefined>(
        ['clients', 'detail', updatedClient.id],
        updateObject<ClientDetail>({
          ...updatedClient,
        })
      );
    },
  });
}
