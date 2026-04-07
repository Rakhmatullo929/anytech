import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  addToList,
  deleteFromList,
  type Pagination,
  updateList,
  updateObject,
  useFetchList,
  useFetchOne,
  useMutate,
} from 'src/hooks/api';

import {
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
  UpdateClientPayload,
} from './types';

export function useClientsListQuery(params: FetchClientsListParams) {
  const { page, pageSize, search, ordering } = params;

  const queryKey = useMemo(
    () => ['clients', 'list', { page, pageSize, search: search ?? '', ordering: ordering ?? '-created_at' }] as const,
    [page, pageSize, search, ordering]
  );

  return useFetchList<ClientListItem>(queryKey, () => fetchClientsList(params));
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
      queryClient.setQueriesData<Pagination<ClientListItem> | undefined>(
        { queryKey: ['clients', 'list'] },
        addToList(createdClient)
      );
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
    async (ids) => {
      await Promise.all(ids.map((id) => deleteClient(id)));
    },
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
